import nodemailer from 'nodemailer';
import crypto from 'crypto';
import VerificationToken from '../models/VerificationToken.js';
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } from '../config/index.js';
import ForgotPassOtp from '../models/ForgotPassOtp.js';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

export async function sendVerificationLink(userid, email, first_name) {
    try {
        // Generate verification token
        const token = crypto.randomBytes(32).toString('hex');
        await VerificationToken.deleteOne({ userId: userid })
        const verificationToken = new VerificationToken({ userId: userid, token });
        await verificationToken.save();

        const verificationLink = `https://csqna.com/verifyemail/${token}`;
        console.log(verificationLink);

        // Send email
        await transporter.sendMail({
            from: 'info@csqna.com',
            to: email,
            subject: 'Please Confirm Your Email for Your Registration on CSQNA',
            text: `Welcome to CSQNA!
Dear ${first_name},

Thank you for registering on CSQNA! We are excited to have you as part of our community, where you can build and take practice tests for self-assessment on various cybersecurity topics.

To complete your registration and activate your account, please confirm your email address by clicking the link below:

Verify Email ${verificationLink}

If you did not register for an account with us, please ignore this email.

If you need any assistance, feel free to reach out to us at info@csqna.com.

Thank you for joining us, and we look forward to helping you enhance your cybersecurity skills.

Best regards,

The CSQNA Team

csqna.com `,
            html: `<h2 style="color: #333; text-align: center;">Welcome to CSQNA!</h2>
                <p>Dear ${first_name},</p>
                <p>Thank you for registering on CSQNA! We are excited to have you as part of our community, where you can build and take practice tests for self-assessment on various cybersecurity topics.</p>
                <p>To complete your registration and activate your account, please confirm your email address by clicking the button below:</p>
                <p style="text-align: center;">
                    <a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
                </p>
                <p>If you did not register for an account with us, please ignore this email.</p>
                <p>If you need any assistance, feel free to reach out to us at <a href="mailto:info@csqna.com">info@csqna.com</a>.</p>
                <p>Thank you for joining us, and we look forward to helping you enhance your cybersecurity skills.</p>
                <p>Best regards,<br>The CSQNA Team</p>
                <p><a href="https://csqna.com">csqna.com</a></p>`
        });

    } catch (error) {
        console.log("errro in sending mail : ", error)
    }
}

export async function sendForgotPasswordOtp(userid, email, first_name) {
    try {
        // Generate verification token
        const otp = crypto.randomInt(10 ** (4 - 1), 10 ** 4).toString();
        await ForgotPassOtp.deleteOne({ userId: userid })
        const forgotPassOtp = new ForgotPassOtp({ userId: userid, email, otp });
        await forgotPassOtp.save();

        console.log(otp);

        // Send email
        await transporter.sendMail({
            from: 'info@csqna.com',
            to: email,
            subject: 'Otp to reset your password',
            text: `Greetings from CSQNA!
Dear ${first_name},

Here's your otp to reset your password ${otp}, otp is valid for 10 minutes only.

If you did not request for an otp, please ignore this email.

If you need any assistance, feel free to reach out to us at info@csqna.com.

Thank you for joining us, and we look forward to helping you enhance your cybersecurity skills.

Best regards,

The CSQNA Team

csqna.com `,
            html: `<h2 style="color: #333; text-align: center;">Greetings from CSQNA!</h2>
                <p>Dear ${first_name},</p>
                <p>Here's your otp to reset your password ${otp}, otp is valid for 10 minutes only.</p>
                <p>If you did not request for an otp, please ignore this email.</p>
                <p>If you need any assistance, feel free to reach out to us at <a href="mailto:info@csqna.com">info@csqna.com</a>.</p>
                <p>Thank you for joining us, and we look forward to helping you enhance your cybersecurity skills.</p>
                <p>Best regards,<br>The CSQNA Team</p>
                <p><a href="https://csqna.com">csqna.com</a></p>`
        });

    } catch (error) {
        console.log("error in sending mail : ", error)
    }
}