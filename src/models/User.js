import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    tier: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    dailyUsage: [
      {
        date: {
          type: String, // YYYY-MM-DD
          required: true,
        },
        tools: [
          {
            toolId: String,
            count: { type: Number, default: 0 },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
