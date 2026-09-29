import type { FastifyInstance } from "fastify";
import { AgentRequest, AGENT_REQUEST_STATUSES } from "../models/AgentRequest.js";
import { User } from "../models/User.js";
import { optionalAuth, requireAuth, requireRole } from "../auth/middleware.js";
import { escapeRegex, objectId, oneOf, optionalObjectId, requiredStr, str } from "../lib/validate.js";
import { notify } from "../notifications/service.js";

function toPublicRequest(r: any, opts: { forAgent?: boolean } = {}) {
  const agent = r.agentId && typeof r.agentId === "object" && "name" in r.agentId ? r.agentId : null;
  return {
    id: String(r._id),
    name: r.name,
    // Contact details are only shared with the agent once they've taken the request.
    contact: !opts.forAgent || r.status !== "new" || r.agentId ? r.contact : null,
    area: r.area,
    lookingFor: r.lookingFor ?? null,
    budget: r.budget ?? null,
    status: r.status,
    agentNote: r.agentNote ?? null,
    agent: agent ? { id: String(agent._id), name: agent.name, verified: agent.verified } : null,
    assigned: !!r.agentId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

const STATUS_COPY: Record<string, string> = {
  accepted: "accepted your request and will be in touch",
  declined: "isn't able to take on your request",
  closed: "closed your request",
};

export async function registerAgentRequestRoutes(app: FastifyInstance): Promise<void> {
  // Ask a specific agent (agentId) or post an open request to agents covering an area.
  app.post(
    "/agent-requests",
    { preHandler: optionalAuth, config: { rateLimit: { max: 5, timeWindow: "10 minutes" } } },
    async (request, reply) => {
      const body = (request.body ?? {}) as Record<string, unknown>;
      const agentId = optionalObjectId(body.agentId, "Agent");
      if (agentId) {
        const agent = await User.findOne({ _id: agentId, role: "agent", status: { $nin: ["suspended", "deactivated"] } }).select("_id").lean();
        if (!agent) return reply.code(404).send({ error: "That agent isn't available." });
      }

      const req = await AgentRequest.create({
        agentId,
        userId: request.authUser?.sub ?? null,
        name: requiredStr(body.name, "Name", 100),
        contact: requiredStr(body.contact, "Phone or email", 120),
        area: requiredStr(body.area, "Area", 120),
        lookingFor: str(body.lookingFor, "What you're looking for", { max: 1000 }),
        budget: str(body.budget, "Budget", { max: 60 }),
      });

      if (agentId) {
        await notify(agentId, {
          type: "agent_request.new",
          title: "New client request",
          body: `${req.name} is looking for help in ${req.area}.`,
          link: "/agent-dashboard/requests",
        });
      } else {
        const rx = new RegExp(escapeRegex(req.area), "i");
        const agents = await User.find({ role: "agent", status: { $nin: ["suspended", "deactivated"] }, $or: [{ areasCovered: rx }, { states: rx }] })
          .select("_id")
          .limit(50)
          .lean();
        await Promise.all(
          agents.map((a) =>
            notify(a._id, {
              type: "agent_request.new",
              title: "New request in your area",
              body: `${req.name} is looking for an agent in ${req.area}.`,
              link: "/agent-dashboard/requests",
            })
          )
        );
      }

      return reply.code(201).send({ request: toPublicRequest(req.toObject()) });
    }
  );

  // Requests sent to me directly, plus open requests in my coverage areas.
  app.get("/agent-requests/incoming", { preHandler: requireRole("agent") }, async (request) => {
    const me = await User.findById(request.authUser!.sub).select("areasCovered states").lean();
    const coverage = [...(me?.areasCovered ?? []), ...(me?.states ?? [])].map(
      (a) => new RegExp(escapeRegex(a.replace(/, Nigeria$/, "")), "i")
    );
    const items = await AgentRequest.find({
      $or: [{ agentId: request.authUser!.sub }, ...(coverage.length ? [{ agentId: null, status: "new", area: { $in: coverage } }] : [])],
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return items.map((r) => toPublicRequest(r, { forAgent: true }));
  });

  // Requests I sent while signed in.
  app.get("/agent-requests/mine", { preHandler: requireAuth }, async (request) => {
    const items = await AgentRequest.find({ userId: request.authUser!.sub })
      .sort({ createdAt: -1 })
      .populate("agentId", "name verified")
      .lean();
    return items.map((r) => {
      // The agent's note is private to the agent.
      const { agentNote: _n, ...rest } = toPublicRequest(r);
      return rest;
    });
  });

  app.patch("/agent-requests/:id", { preHandler: requireRole("agent") }, async (request, reply) => {
    const id = objectId((request.params as { id: string }).id, "Request id");
    const body = (request.body ?? {}) as Record<string, unknown>;
    const me = request.authUser!.sub;
    const status = oneOf(body.status, AGENT_REQUEST_STATUSES, "Status", false);

    const req = await AgentRequest.findById(id);
    if (!req) return reply.code(404).send({ error: "Request not found." });

    if (!req.agentId) {
      // Open request: the first agent to accept claims it.
      if (status !== "accepted") return reply.code(403).send({ error: "Accept this request before updating it." });
      const claimed = await AgentRequest.findOneAndUpdate(
        { _id: id, agentId: null, status: "new" },
        { agentId: me, status: "accepted" },
        { new: true }
      );
      if (!claimed) return reply.code(409).send({ error: "Another agent has already taken this request." });
      await notify(claimed.userId, {
        type: "agent_request.status",
        title: "An agent took your request",
        body: `An agent ${STATUS_COPY.accepted}.`,
        link: "/dashboard/requests",
      });
      return { request: toPublicRequest(claimed.toObject(), { forAgent: true }) };
    }

    if (String(req.agentId) !== me) return reply.code(403).send({ error: "This request belongs to another agent." });
    if (body.agentNote !== undefined) req.agentNote = str(body.agentNote, "Note", { max: 1000 }) ?? undefined;
    const changed = status && status !== req.status;
    if (status) req.status = status;
    await req.save();

    if (changed && STATUS_COPY[status]) {
      await notify(req.userId, {
        type: "agent_request.status",
        title: "Update on your agent request",
        body: `Your agent ${STATUS_COPY[status]}.`,
        link: "/dashboard/requests",
      });
    }
    return { request: toPublicRequest(req.toObject(), { forAgent: true }) };
  });
}
