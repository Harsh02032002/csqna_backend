import express from "express";
import { Register, Login, Check_username, VerifyEmail, ForgotPassword, ResetPassword } from "../controllers/authController.js";
import Validate from "../middleware/validate.js";
import { check } from "express-validator";

const router = express.Router();

// Register route -- POST request
router.post(
    "/register",
    check("username")
        .not()
        .isEmpty()
        .withMessage("You username is required")
        .trim()
        .escape(),
    check("email")
        .isEmail()
        .withMessage("Enter a valid email address"),
        // .normalizeEmail(),
    check("first_name")
        .not()
        .isEmpty()
        .withMessage("You first name is required")
        .trim()
        .escape(),
    check("last_name")
        .not()
        .isEmpty()
        .withMessage("You last name is required")
        .trim()
        .escape(),
    check("password")
        .notEmpty()
        .isLength({ min: 8, max: 25})
        .withMessage("Must be at least 8 chars long"),
    check("phone")
        .notEmpty()
        .isLength({ min: 10, max: 10 })
        .withMessage("Must be 10 digits long"),
    Validate,
    Register
);

router.get(
    "/verify-email/:token",
    Validate,
    VerifyEmail
);

router.post(
    "/check-username",
    check("username")
        .not()
        .isEmpty()
        .withMessage("You username is required")
        .trim()
        .escape(),
    // Validate,
    Check_username
);

router.post(
    "/login",
    check("email")
        .not()
        .isEmpty()
        .withMessage("Your email/username is required")
        .trim()
        .escape(),
        // .isEmail()
        // .withMessage("Enter a valid email address")
        // .normalizeEmail(),
    check("password").not().isEmpty(),
    Validate,
    Login
);

router.post(
    "/forgot-password",
    check("email")
        .not()
        .isEmpty()
        .withMessage("Your email is required")
        .trim()
        .escape(),
    Validate,
    ForgotPassword
);

router.post(
    "/reset-password",
    check("email")
        .not()
        .isEmpty()
        .withMessage("Your email/username is required")
        .trim()
        .escape(),
    check("newpassword").not().isEmpty().withMessage("newpassword is required"),
    check("otp").not().isEmpty().withMessage("otp is required"),
    Validate,
    ResetPassword
);

export default router;