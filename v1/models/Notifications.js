import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
        message: { type: String, required: true },
        type: { type: String, enum: ["info", "warning", "error"], default: "info" },
        read: { type: Boolean, default: false },
        details: { type: Object, default: {} },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.model("Notification", notificationSchema);
