import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  userid: {
    // type: String,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true, // The user ID of the test generator
  },
  testname: {
    type: String,
    default: "Test " + Date.now(),
  },
  category: {
    type: Object,
  },
  difficulty: {
    type: Object,
  },
  questions: {
    type: Number,
  },
  duration: {
    type: Number,
  },
  testQuestions: [
    {
      _id: mongoose.Schema.Types.ObjectId, // The question's unique ID
      category: {
        type: String,
      },
      question: {
        type: String,
      },
      options: {
        type: Object, // Options as an object (e.g., { a: "Option A", b: "Option B", ... })
      },
      questionType: {
        type: String, // e.g., "MSQ" or "MCQ"
      },
      difficultyLevel: {
        type: String, // e.g., "Hard", "Medium", "Easy"
      },
      userAnswer: {
        type: [String], // Can store multiple answers if it's a multi-select question (MSQ)
        default: [],
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation time
  },
  startTime: {
    type: Date,
    default: Date.now, // Automatically set the creation time
  },
  endTime: {
    type: Date,
    required: true,
  },
  isEnded: {
    type: Boolean,
    default: false,
  },
});

// Virtual field for status
testSchema.virtual("status").get(function () {
  const createdAt = this.createdAt.getTime();  // Convert createdAt to timestamp
  const currentTime = new Date().getTime();  // Current timestamp
  const diffHours = (currentTime - createdAt) / (1000 * 60 * 60);  // Difference in hours

  // Return 'Active' if the test was created within the last 48 hours
  return diffHours < 48 ? "Active" : "Inactive";
});

testSchema.set('toJSON', {
  virtuals: true,
});

export default mongoose.model("Tests", testSchema);