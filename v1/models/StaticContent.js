import mongoose from "mongoose";

const StaticContentSchema = new mongoose.Schema(
    {
        page: {
            type: String,
            required: true,
            trim: true,
        },
        sectionKey: {
            type: String,
            required: true,
            unique: true, // e.g., 'home_hero_title' must be unique across the whole collection
            trim: true,
        },
        contentValue: {
            type: String,
            required: true,
        }
    },
    { timestamps: true }
);

export default mongoose.model("StaticContent", StaticContentSchema);
