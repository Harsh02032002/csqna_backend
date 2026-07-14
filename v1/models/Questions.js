import mongoose from "mongoose";

const QuestionsSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: "Question category is required",
        },
        area: {
            type: String,
            required: "Question area is required",
        },
        question: {
            type: String,
            required: "Question question is required",
        },
        options: {
            Option1: {
                type: String,
                required: "Option 1 is required",
            },
            Option2: {
                type: String,
                required: "Option 2 is required",
            },
            Option3: {
                type: String,
                required: false,  // Optional Option3
            },
            Option4: {
                type: String,
                required: false,  // Optional Option4
            },
        },
        correctAnswers: {
            type: [String],  // Array of correct options (e.g., ["Option1", "Option3"])
            required: "Correct answer(s) are required",
        },
        justifications: {
            Option1: {
                type: String,
                required: "Justification for Option 1 is required",
            },
            Option2: {
                type: String,
                required: false,
            },
            Option3: {
                type: String,
                required: false,  // Optional Justification for Option3
            },
            Option4: {
                type: String,
                required: false,  // Optional Justification for Option4
            },
        },
        questionType: {
            type: String,
            required: "Question type is required",
        },
        difficultyLevel: {
            type: String,
            required: "Difficulty level is required",
        },
        
    },
    { timestamps: true }
);



export default mongoose.model("questions", QuestionsSchema);