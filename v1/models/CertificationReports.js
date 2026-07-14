import mongoose from "mongoose";

const certificationReportsSchema = new mongoose.Schema({
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
  certificationname: {
    type: String,
    default: "Test " + Date.now(),
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
  scheduledAt: {
    type: Date,
    default: Date.now, // Automatically set the creation time
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  submitTime: {
    type: Date,
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

export default mongoose.model("CertificationReports", certificationReportsSchema);