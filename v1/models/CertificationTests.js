import mongoose from "mongoose";

const certificationTestSchema = new mongoose.Schema({
  userid: {
    // type: String,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true, // The user ID of the test generator
  },
  certificationname: {
    type: String,
    default: true,
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
  scheduledAt: {
    type: Date,
    default: Date.now, // Automatically set the creation time
  },
  scheduledFor: {
    type: Date,
    default: Date.now,
  },
  startTime: {
    type: Date,
    required: true,
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
// certificationTestSchema.virtual("status").get(function () {
//   const scheduledFor = this.scheduledFor.getTime();
//   const duration = this.duration;
//   const currentTime = new Date().getTime();  // Current timestamp
//   const diffHours = (currentTime - scheduledFor);  // Difference in hours
//   console.log(duration);
//   if (diffHours < 0) return "Not Started"
//   if (diffHours < 30 * 1000 * 60) return "Active"
//   if (diffHours < duration * 1000 * 60) return "Ongoing"
//   return "Unattemped";
// });

certificationTestSchema.virtual("status").get(function () {
  if (!this.scheduledFor || this.duration == null) return "Unattempted"; // Handle undefined/null cases

  const scheduledFor = this.scheduledFor.getTime();
  const startTime = this.startTime.getTime();
  const durationMs = Number(this.duration) * 60 * 1000; // Convert duration to milliseconds
  const currentTime = Date.now();
  const diffMs = currentTime - scheduledFor;

  // console.log(diffMs, durationMs)

  if (diffMs < 0) return "Not Started";
  if (diffMs < 30 * 60 * 1000 && scheduledFor === startTime) return "Active";
  if (diffMs < durationMs && scheduledFor !== startTime) return "Ongoing";
  return "Unattempted";
});


certificationTestSchema.set('toJSON', {
  virtuals: true,
});

export default mongoose.model("CertificationTests", certificationTestSchema);