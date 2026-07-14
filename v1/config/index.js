import * as dotenv from "dotenv";
dotenv.config();

const {
    URI,
    PORT,
    SECRET_ACCESS_TOKEN,
    TOKEN_EXPIRY_DURATION_MIN,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    RAZORPAY_KEY,
    RAZORPAY_SECRET,
    AES_SECRET_KEY
} = process.env;

// Provide safe defaults when environment variables are not set
const DEFAULT_PORT = 5003;
const DEFAULT_URI = URI || "mongodb://localhost:27017/csqna";

const EXPORT_URI = DEFAULT_URI;
const EXPORT_PORT = PORT || DEFAULT_PORT;

export {
    EXPORT_URI as URI,
    EXPORT_PORT as PORT,
    SECRET_ACCESS_TOKEN,
    TOKEN_EXPIRY_DURATION_MIN,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    RAZORPAY_KEY,
    RAZORPAY_SECRET,
    AES_SECRET_KEY
};
