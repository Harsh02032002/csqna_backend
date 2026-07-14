import mongoose from "mongoose";

const reportsSchema = new mongoose.Schema({
  userid: {
    // type: String,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true, // The user ID of the test generator
  },
  testid: {
    type: String,
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
    type: String,
  },
  duration: {
    type: Number,
  },
  testQuestions: [
    {
      _id: mongoose.Schema.Types.ObjectId,
      category: {
        type: String,
      },
      question: {
        type: String,
      },
      options: {
        type: Object,
      },
      questionType: {
        type: String,
      },
      difficultyLevel: {
        type: String,
      },
      userAnswer: {
        type: [String],
        default: [],
      },
      correctAnswers: {
        type: [String],
        default: [],
      },
      justifications: {
        type: Object,
      },
      score: {
        type: Number,
        default: 0.0,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now, // Automatically set the creation time
  },
  startTime: {
    type: Date,
    required: false,
  },
  endTime: {
    type: Date, // The calculated end time
    required: true,
  },
  submitTime: {
    type: Date, // The calculated end time
    required: true,
    default: Date.now,
  },
  isEnded: {
    type: Boolean,
    default: true,
  },
  score: {
    type: Number,
    default: 0.0,
  },
});

export default mongoose.model("Reports", reportsSchema);