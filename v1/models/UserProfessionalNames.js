import mongoose from 'mongoose';

const userProfessionalNamesSchema = new mongoose.Schema(
    {
        userid: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true, },
        userProfessionalName: { type: String, required: true, },
    },
    { timestamps: true }
);

export default mongoose.model('UserProfessionalNames', userProfessionalNamesSchema);