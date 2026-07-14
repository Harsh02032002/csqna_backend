import mongoose from 'mongoose';

const certificatesIssuedSchema = new mongoose.Schema(
    {
        reportId: { type: String , required: true, }, 
        certificationName: { type: String, default: 1 },
        userProfessionalName: { type: String , required: true, }, 
        score: {type: Number, required: true},
        issueDate: {type: Date, default: Date.now},
        uniqueCode: { type: String , required: true, }, 
    },
    { timestamps: true }
);

export default mongoose.model('CertificatesIssued', certificatesIssuedSchema);