import mongoose from "mongoose";

const ToolSchema = new mongoose.Schema(
  {
    toolId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["media", "text", "system"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "maintenance"],
      default: "active",
    },
    version: {
      type: String,
      enum: ["v1", "v2"],
      default: "v1",
    },
    rateLimitPerDay: {
      type: Number,
      default: 0, // 0 indicates unlimited (for v1)
    },
  },
  { timestamps: true }
);

export default mongoose.models.Tool || mongoose.model("Tool", ToolSchema);
