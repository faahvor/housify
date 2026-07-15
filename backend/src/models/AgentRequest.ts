import { Schema, model, type InferSchemaType } from "mongoose";

const agentRequestSchema = new Schema(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    area: { type: String, required: true },
    lookingFor: { type: String },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export type AgentRequestDoc = InferSchemaType<typeof agentRequestSchema>;
export const AgentRequest = model("AgentRequest", agentRequestSchema);
