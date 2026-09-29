import type { FastifyInstance } from "fastify";
import { registerAuthRoutes } from "../auth/routes.js";
import { registerAdminRoutes } from "../admin/routes.js";
import { registerListingRoutes } from "../listings/routes.js";
import { registerInquiryRoutes } from "../inquiries/routes.js";
import { registerAgentRequestRoutes } from "../agent-requests/routes.js";
import { registerEngagementRoutes } from "../engagement/routes.js";
import { registerProfessionalRoutes } from "../professionals/routes.js";
import { registerUploadRoutes } from "../uploads/routes.js";

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));
  await registerAuthRoutes(app);
  await registerAdminRoutes(app);
  await registerListingRoutes(app);
  await registerInquiryRoutes(app);
  await registerAgentRequestRoutes(app);
  await registerEngagementRoutes(app);
  await registerProfessionalRoutes(app);
  await registerUploadRoutes(app);
}
