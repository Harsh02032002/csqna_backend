import mongoose from 'mongoose';

const ForgotPassOtpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    email: {type: String, required: true},
    otp: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 600 }, // Expires in 10 min
});

export default mongoose.model('ForgotPassOtp', ForgotPassOtpSchema);
