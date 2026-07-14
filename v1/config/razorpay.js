import Razorpay from "razorpay";
import { RAZORPAY_KEY, RAZORPAY_SECRET } from "./index.js";

const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY,
    key_secret: RAZORPAY_SECRET
});

export default razorpay;
