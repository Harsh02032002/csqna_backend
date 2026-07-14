import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { TOKEN_EXPIRY_DURATION_MIN } from '../config/index.js';
import { logNotification } from "../service/notificationService.js";
import VerificationToken from '../models/VerificationToken.js';
import { sendForgotPasswordOtp, sendVerificationLink } from "../service/emailService.js";
import ForgotPassOtp from "../models/ForgotPassOtp.js";


/**
 * @route POST v1/auth/register
 * @desc Registers a user
 * @access Public
 */
export async function Register(req, res) {
    // get required variables from request body
    // using es6 object destructing
    const { username, first_name, last_name, email, password, phone } = req.body;
    // console.log(email);
    const passwd = password;
    try {
        // create an instance of a user
        const newUser = new User({
            username,
            first_name,
            last_name,
            email,
            password: passwd,
            phonenumber: phone,
        });
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser)
            if (existingUser.isEmailVerified) {
                return res.status(200).json({
                    status: false,
                    code: 400,
                    data: [],
                    message: "It seems you already have an account, please log in instead.",
                });
            } else {
                const oldVerificationToken = await VerificationToken.findOne({ userId: existingUser._id });
                if (oldVerificationToken) {
                    const tokenCreatedAt = new Date(oldVerificationToken.createdAt);
                    const now = new Date();
                    const diffInMilliseconds = now.getTime() - tokenCreatedAt.getTime();
                    if (diffInMilliseconds < 60 * 1000) {
                        return res.status(400).json({
                            status: false,
                            code: 400,
                            data: [],
                            message: "A verification link was already sent recently. Please wait for at least one minute before requesting a new link."
                        });
                    }
                }
                sendVerificationLink(existingUser._id, email, first_name);
                return res.status(200).json({
                    status: false,
                    code: 400,
                    data: [],
                    message: "Unverified account found with this email. sending new verification link.",
                });
            }
        // Check if username already taken
        const usernameExists = await User.findOne({ username });
        if (usernameExists)
            return res.status(200).json({
                status: false,
                code: 400,
                data: [],
                message: "It seems username already taken, please choose another.",
            });
        const savedUser = await newUser.save(); // save new user into the database
        // console.log(savedUser);

        sendVerificationLink(savedUser._id, email, first_name);

        const { createdAt, updatedAt, __v, _id, password, role, isEmailVerified, emailVerifiedAt, testCount, ...user_data } = savedUser._doc; // Return user's details but password

        res.status(200).json({
            status: true,
            code: 200,
            data: [user_data],
            message:
                'Thank you for registering with us. Your account has been successfully created. Please check your email to verify your account.',
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: false,
            code: 500,
            data: [],
            message: "Internal Server Error",
        });
    }
    res.end();
}

/**
 * @route POST v1/auth/verify-email/:token
 * @desc Verify user email
 * @access Public
 */
export async function VerifyEmail(req, res) {
    const { token } = req.params;
    // console.log("token recived for verification", token)
    try {
        const verificationToken = await VerificationToken.findOne({ token });
        if (!verificationToken) {
            return res.status(200).json({ status: false, code: 400, message: "Invalid or expired link." });
        }

        await User.findByIdAndUpdate(verificationToken.userId, { isEmailVerified: true, emailVerifiedAt: new Date() });
        await VerificationToken.deleteOne({ _id: verificationToken._id });

        res.status(200).json({ status: true, code: 200, message: "Email verified successfully." });
    } catch (err) {
        console.error(err);
        res.status(200).json({ status: false, code: 500, message: "Internal Server Error" });
    }
}


/**
 * @route POST v1/auth/check-username
 * @desc Check username avability while registration of user
 * @access Public
 */
export async function Check_username(req, res) {
    const { username } = req.body;

    try {
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.status(200).json({
                status: true,
                code: 200,
                available: false,
                message: "Username is already taken."
            });
        } else {
            return res.status(200).json({
                status: true,
                code: 200,
                available: true,
                message: "Username is available."
            });
        }
    } catch (error) {
        console.error("Error checking username availability:", error);
        return res.status(200).json({
            status: false,
            code: 500,
            message: "Internal server error."
        });
    }
}

/**
 * @route POST v1/auth/login
 * @desc logs in a user
 * @access Public
 */
export async function Login(req, res) {
    // Get variables for the login process
    const { email } = req.body;
    try {
        // Check if user exists
        const user = await User.findOne({ $or: [{ email }, { username: email }], }).select("+password");
        // const user = await User.findOne({ email }).select("+password");
        if (!user)
            return res.status(401).json({
                status: false,
                code: 401,
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });
        // if user exists
        // validate password
        const isPasswordValid = await bcrypt.compare(
            `${req.body.password}`,
            user.password
        );
        const loginDetails = {
            ip: req.ip,
            location: "Unknown Location",
        };
        // if not valid, return unathorized response
        if (!isPasswordValid) {
            await logNotification(user, "Failed login.", loginDetails, "warning");
            return res.status(401).json({
                status: false,
                code: 401,
                data: [],
                message:
                    "Invalid email or password. Please try again with the correct credentials.",
            });
        }

        // let options = {
        //     maxAge: TOKEN_EXPIRY_DURATION_MIN * 60 * 1000, // would expire in 20minutes
        //     httpOnly: true, // The cookie is only accessible by the web server
        //     secure: true,
        //     sameSite: "None",
        // };

        const token = user.generateAccessJWT(); // generate session token for user
        // console.log(token);
        // res.cookie("SessionID", "sfkjk", options);
        // res.cookie("SessionID", token, options); // set the token to response header, so that the client sends it back on each subsequent request

        // return user info except password
        const { password, createdAt, updatedAt, __v, ...user_data } = user._doc;

        // await logNotification(user, "Successful login.", loginDetails, "info");
        res.status(200).json({
            code: 200,
            token: token,
            status: true,
            message: "You have successfully logged in.",
            data: user_data
        });

        // res.status(200).json({
        //     status: "success",
        //     data: [user_data],
        //     message: "You have successfully logged in.",
        // });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            status: false,
            code: 500,
            data: [],
            message: "Internal Server Error",
        });
    }
    res.end();
}

/**
 * @route POST v1/auth/forgot-password
 * @desc initiates forgot password process and sends otp
 * @access Public
 */
export async function ForgotPassword(req, res) {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                status: false,
                code: 404,
                message: "User not found with this email."
            });
        }

        await sendForgotPasswordOtp(user._id, user.email, user.first_name);

        res.status(200).json({ status: true, code: 200, message: "OTP sent successfully." });
    } catch (err) {
        console.error(err);
        res.status(200).json({ status: false, code: 500, message: "Internal Server Error" });
    }
}

/**
 * @route POST v1/auth/reset-password
 * @desc Resets user password
 * @access Public
 */
export async function ResetPassword(req, res) {
    const { email, newpassword, otp } = req.body;
    try {
        const forgotPassOtp = await ForgotPassOtp.findOne({ email });
        if (!forgotPassOtp) {
            return res.status(200).json({ status: false, code: 400, message: "Invalid or expired request." });
        }

        if (forgotPassOtp.otp === Number(otp)) {
            const user = await User.findById(forgotPassOtp.userId);
            user.password = newpassword;
            user.save();
            await ForgotPassOtp.deleteOne({ _id: forgotPassOtp._id });

            return res.status(200).json({ status: true, code: 200, message: "Password Updated Successfully." });
        }
        res.status(200).json({ status: false, code: 400, message: "Invalid or Wrong Otp." });


    } catch (err) {
        console.error(err);
        res.status(200).json({ status: false, code: 500, message: "Internal Server Error" });
    }
}