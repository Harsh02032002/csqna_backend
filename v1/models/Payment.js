import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
        certificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' },
        paymentFor: String,
        amount: Number,
        paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
        refundStatus: { type: String, enum: ['NA', 'refund-initiated', 'refunded'], default: 'NA' },
        razorpayOrderId: String,
        razorpayPaymentId: String,
        razorpaySignature: String,
        razorpayOrde: Object,
        completedAt: { type: Date, required: false },
        refundInitiatedAt: { type: Date, required: false },
        refundMessage: { type: String, required: false},
        refundedAt: { type: Date, required: false },
        refundDetails: { type: String, required: false}
    },
    { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
