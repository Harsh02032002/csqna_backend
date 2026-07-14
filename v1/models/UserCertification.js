import mongoose from 'mongoose';

const userCertificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
        certification_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Certification' },
        certificationId: { type: String , required: true}, 
        attemptLimit: { type: Number, default: 1 },
        attemptsUsed: { type: Number, default: 0 },
        purchaseDate: { type: Date, default: Date.now },
        validTill: { type: Date, required: "Subscription End Date required"},
    },
    { timestamps: true }
);

export default mongoose.model('UserCertification', userCertificationSchema);