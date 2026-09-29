import { Schema, model, type InferSchemaType } from "mongoose";

export const AGENT_REQUEST_STATUSES = ["new", "accepted", "declined", "closed"] as const;
export type AgentRequestStatus = (typeof AGENT_REQUEST_STATUSES)[number];

const agentRequestSchema = new Schema(
  {
    // A specific agent, or null for an open request any agent covering the area can accept.
    agentId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    area: { type: String, required: true },
    lookingFor: { type: String },
    budget: { type: String },
    status: { type: String, enum: AGENT_REQUEST_STATUSES, default: "new" },
    agentNote: { type: String },
  },
  { timestamps: true }
);

export type AgentRequestDoc = InferSchemaType<typeof agentRequestSchema>;
export const AgentRequest = model("AgentRequest", agentRequestSchema);
