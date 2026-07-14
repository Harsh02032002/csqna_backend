import mongoose from 'mongoose';

const VerificationTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // Expires in 1 hour
});

export default mongoose.model('VerificationToken', VerificationTokenSchema);
