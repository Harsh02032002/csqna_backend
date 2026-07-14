import express from "express";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";
import { AddUserProfessionalName, CertificateData, Dashboard, DeletePractice, deleteReadNotifications, GeneratePractice, GetAllCategories, GetAllCertifications, GetAllDifficulty, getNotifications, getNotificationsUnreadCount, GetUserProfessionalName, InitiatePayment, InvoiceData, ListCertificationReports, ListOngoingPracticeTests, ListReports, ListUserCertifications, ListUserScheduledCertifications, markNotificationsAsRead, PaymentHistory, PersonalDetails, RefundHistory, RequestRefund, SaveCertificationResponse, SaveResponse, ScheduleCertification, StartCertification, StartPractice, SubmitCertificationTest, SubmitTest, SubscriptionInitiatePayment, SubscriptionVerifyPayment, UpdatePassword, UpdatePersonalDetails, UserSubscription, VerifyPayment } from "../controllers/userController.js";


const router = express.Router();


router.get("/practice/categories",
    Validate,
    GetAllCategories);

router.get("/practice/difficulty",
    Validate,
    GetAllDifficulty);

router.post(
    "/practice/generate",
    check("category")
        .not()
        .isEmpty()
        .withMessage("category is required")
        .custom((value) => {
            // Check if it's an array
            if (Array.isArray(value) && value.length > 0) {

                // Escape each string in the array
                value.forEach((item, index) => {
                    if (typeof item !== 'string') {
                        throw new Error(`Each category must be a string, but found ${typeof item} at index ${index}`);
                    }
                    // Escape the string individually
                    // value[index] = escape(item.trim());
                    value[index] = item.trim();
                });
            }

            return true;
        }),
    check("difficulty")
        .not()
        .isEmpty()
        .withMessage("difficulty is required")
        .custom((value) => {
            // Check if it's an array
            if (Array.isArray(value) && value.length > 0) {

                // Escape each string in the array
                value.forEach((item, index) => {
                    if (typeof item !== 'string') {
                        throw new Error(`Each difficulty must be a string, but found ${typeof item} at index ${index}`);
                    }
                    // Escape the string individually
                    // value[index] = escape(item.trim());
                    value[index] = item.trim();
                });
            }

            return true;
        }),
    check("questions")
        .not()
        .isEmpty()
        .withMessage("questions is required")
        .trim()
        .isInt({ gt: 0 })
        .withMessage("questions value must be an integer greater than 0")
        .escape(),
    check("duration")
        .not()
        .isEmpty()
        .withMessage("Time is required")
        .trim()
        .isInt({ gte: 0 })
        .withMessage("Time value must be a positive integer")
        .escape(),
    Validate,
    GeneratePractice
);

router.post(
    "/practice/saveresponse",
    check("testId")
        .not()
        .isEmpty()
        .withMessage("testId is required")
        .trim()
        .escape(),
    check("questionId")
        .not()
        .isEmpty()
        .withMessage("questionId is required")
        .trim()
        .escape(),
    check("answer")
        .not()
        .isEmpty()
        .withMessage("answer is required")
        .custom((value) => {
            // Check if it's an array
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("Answer must be a non-empty array");
            }

            // Escape each string in the array
            value.forEach((item, index) => {
                if (typeof item !== 'string') {
                    throw new Error(`Each answer must be a string, but found ${typeof item} at index ${index}`);
                }
                // Escape the string individually
                // value[index] = escape(item.trim());
                value[index] = item.trim();
            });

            return true;
        }),
    Validate,
    SaveResponse
);

router.post(
    "/practice/submittest",
    check("testId")
        .not()
        .isEmpty()
        .withMessage("testId is required")
        .trim()
        .escape(),
    Validate,
    SubmitTest
);

router.get("/practice/listongoing",
    Validate,
    ListOngoingPracticeTests);

router.get(
    "/dashboard",
    Validate,
    Dashboard
);

router.patch(
    "/practice/start",
    Validate,
    StartPractice
);

router.delete(
    "/practice/delete",
    Validate,
    DeletePractice
);

router.get("/practice/reports",
    Validate,
    ListReports);

router.get("/notifications",
    getNotifications); // Fetch notifications
router.get("/notifications/unread-count",
    Validate,
    getNotificationsUnreadCount);
router.post("/notifications/mark-read",
    check("ids")
        .isArray({ min: 1 })
        .withMessage("notificationIds must be a non-empty array.")
        .bail()
        .custom((ids) => {
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            const allValid = ids.every((id) => objectIdRegex.test(id));
            if (!allValid) {
                throw new Error("All notification IDs must be valid Ids.");
            }
            return true;
        }),
    Validate,
    markNotificationsAsRead); // Mark notifications as read
router.delete("/notifications/delete-read",
    deleteReadNotifications); // Mark notifications as read

router.get("/personal-details",
    Validate,
    PersonalDetails);

router.patch(
    "/update-personal-details",
    check("first_name")
        .not()
        .isEmpty()
        .withMessage("first_name is required")
        .trim()
        .escape(),
    check("last_name")
        .not()
        .isEmpty()
        .withMessage("last_name is required")
        .trim()
        .escape(),
    check("address")
        .not()
        .isEmpty()
        .withMessage("address is required")
        .trim()
        .escape(),
    check("country")
        .not()
        .isEmpty()
        .withMessage("country is required")
        .trim()
        .escape(),
    check("state")
        .not()
        .isEmpty()
        .withMessage("state is required")
        .trim()
        .escape(),
    check("city")
        .not()
        .isEmpty()
        .withMessage("city is required")
        .trim()
        .escape(),
    check("zipcode")
        .not()
        .isEmpty()
        .withMessage("zipcode is required")
        .trim()
        .escape(),
    check("phone")
        .notEmpty()
        .isLength({ min: 10, max: 10 })
        .withMessage("Must be 10 digits long"),
    Validate,
    UpdatePersonalDetails
);

router.patch(
    "/update-password",
    check("password")
        .notEmpty()
        .isLength({ min: 8, max: 25 })
        .withMessage("Must be at least 8 chars long"),
    check("newpassword")
        .notEmpty()
        .isLength({ min: 8, max: 25 })
        .withMessage("Must be at least 8 chars long"),
    check("confirmpassword")
        .notEmpty()
        .isLength({ min: 8, max: 25 })
        .withMessage("Must be at least 8 chars long"),
    Validate,
    UpdatePassword
);

router.get("/all-certifications",
    Validate,
    GetAllCertifications);

router.post(
    "/certification/initiate-payment",
    check("certificationId")
        .not()
        .isEmpty()
        .withMessage("certificationId is required")
        .trim()
        .escape(),
    check("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isFloat({ min: 1 })
        .withMessage("Amount must be a valid number greater than 0")
        .trim()
        .escape(),
    Validate,
    InitiatePayment
);

router.post(
    "/certification/verify-payment",
    check("razorpay_order_id")
        .not()
        .isEmpty()
        .withMessage("razorpay_order_id is required")
        .trim()
        .escape(),
    check("razorpay_payment_id")
        .not()
        .isEmpty()
        .withMessage("razorpay_payment_id is required")
        .trim()
        .escape(),
    check("razorpay_signature")
        .not()
        .isEmpty()
        .withMessage("razorpay_signature is required")
        .trim()
        .escape(),
    Validate,
    VerifyPayment
);

router.get("/certification/list",
    Validate,
    ListUserCertifications);

router.post(
    "/certification/schedule",
    check("certification")
        .not()
        .isEmpty()
        .withMessage("certification is required")
        .trim()
        .escape(),
    check("startDateTime")
        .exists().withMessage("startDateTime is required")
        .not().isEmpty().withMessage("startDateTime cannot be empty")
        .isISO8601().withMessage("startDateTime must be a valid ISO 8601 date"),
    Validate,
    ScheduleCertification
);

router.patch(
    "/certification/start",
    check("testid")
        .not()
        .isEmpty()
        .withMessage("testid is required")
        .trim()
        .escape(),
    Validate,
    StartCertification
);

router.post(
    "/certification/saveresponse",
    check("testId")
        .not()
        .isEmpty()
        .withMessage("testId is required")
        .trim()
        .escape(),
    check("questionId")
        .not()
        .isEmpty()
        .withMessage("questionId is required")
        .trim()
        .escape(),
    check("answer")
        .not()
        .isEmpty()
        .withMessage("answer is required")
        .custom((value) => {
            // Check if it's an array
            if (!Array.isArray(value) || value.length === 0) {
                throw new Error("Answer must be a non-empty array");
            }

            // Escape each string in the array
            value.forEach((item, index) => {
                if (typeof item !== 'string') {
                    throw new Error(`Each answer must be a string, but found ${typeof item} at index ${index}`);
                }
                // Escape the string individually
                // value[index] = escape(item.trim());
                value[index] = item.trim();
            });

            return true;
        }),
    Validate,
    SaveCertificationResponse
);

router.post(
    "/certification/submittest",
    check("testId")
        .not()
        .isEmpty()
        .withMessage("testId is required")
        .trim()
        .escape(),
    Validate,
    SubmitCertificationTest
);

router.get("/certification/listscheduled",
    Validate,
    ListUserScheduledCertifications);

router.get("/certification/reports",
    Validate,
    ListCertificationReports);

router.get("/payments/history",
    Validate,
    PaymentHistory);

router.get("/payments/refundhistory",
    Validate,
    RefundHistory);

router.post(
    "/payments/requestrefund",
    check("paymentId")
        .not()
        .isEmpty()
        .withMessage("paymentId is required")
        .trim()
        .escape()
        .custom((paymentId) => {
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(paymentId)) {
                throw new Error("PaymentID must be valid Id.");
            }
            return true;
        }),
    check("message")
        .not()
        .isEmpty()
        .withMessage("paymentId is required")
        .trim()
        .escape(),
    Validate,
    RequestRefund
);

router.post(
    "/subscription/initiate-payment",
    check("plan")
        .not()
        .isEmpty()
        .withMessage("plan details is required")
        .trim()
        .escape(),
    check("amount")
        .notEmpty()
        .withMessage("Amount is required")
        .isFloat({ min: 1 })
        .withMessage("Amount must be a valid number greater than 0")
        .trim()
        .escape(),
    Validate,
    SubscriptionInitiatePayment
);

router.post(
    "/subscription/verify-payment",
    check("razorpay_order_id")
        .not()
        .isEmpty()
        .withMessage("razorpay_order_id is required")
        .trim()
        .escape(),
    check("razorpay_payment_id")
        .not()
        .isEmpty()
        .withMessage("razorpay_payment_id is required")
        .trim()
        .escape(),
    check("razorpay_signature")
        .not()
        .isEmpty()
        .withMessage("razorpay_signature is required")
        .trim()
        .escape(),
    Validate,
    SubscriptionVerifyPayment
);

router.get("/subscription",
    Validate,
    UserSubscription);

router.get("/invoicedata",
    Validate,
    InvoiceData);

router.put(
    "/professional-name",
    check("name")
        .not()
        .isEmpty()
        .withMessage("Professional Name is required")
        .trim()
        .escape(),
    Validate,
    AddUserProfessionalName
);

router.get("/professional-name",
    Validate,
    GetUserProfessionalName);

router.get("/certificatedata",
    Validate,
    CertificateData);


export default router;