import mongoose from 'mongoose';

const certificationSchema = new mongoose.Schema(
    {
        certificationId: { type: String , required: true, }, 
        certificationName: { type: String, default: 1 },
        description: { type: String, required: false},
        price: { type: Number, default: 0 }, //in INR
        validityDays: { type: Number, default: 180 }, 
        details: { type: Object, required: true},
        isActive: {type: Boolean, default: true},
        enderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: false },
    },
    { timestamps: true }
);

export default mongoose.model('Certification', certificationSchema);