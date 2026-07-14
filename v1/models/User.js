import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import { SECRET_ACCESS_TOKEN, TOKEN_EXPIRY_DURATION_MIN } from '../config/index.js';

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: "Your username is required",
            unique: true,
            trim: true,
        },
        first_name: {
            type: String,
            required: "Your firstname is required",
            max: 25,
        },
        last_name: {
            type: String,
            required: "Your lastname is required",
            max: 25,
        },
        email: {
            type: String,
            required: "Your email is required",
            unique: true,
            lowercase: true,
            trim: true,
        },
        isEmailVerified: {
            type: Boolean,
            default: false
        },
        emailVerifiedAt: {
            type: Date,
            default: null
        },
        password: {
            type: String,
            required: "Your password is required",
            select: false,
            max: 25,
        },
        role: {
            type: String,
            required: true,
            default: "0x01",
        },
        testCount: {
            type: Number,
            required: true,
            default: 0,
        },
        certTestCount: {
            type: Number,
            required: true,
            default: 0,
        },
        address: {
            type: String,
            default: null,
            required: false
        },
        country: {
            type: String,
            default: null,
            required: false
        },
        state: {
            type: String,
            default: null,
            required: false
        },
        city: {
            type: String,
            default: null,
            required: false
        },
        zipcode: {
            type: Number,
            min: 100000,
            max: 999999,
            required: false,
            default: null,
        },
        phonenumber: {
            type: Number,
            default: null,
            required: false,
            min: 1000000000,
            max: 9999999999,
        },
        // plan: {
        //     type: Number,
        //     default: 0,
        //     required: true,
        //     min: 0,
        //     max: 2,
        // },
        planDetails: {
            planName: {
                type: String,
                default: "Free",
                required: true,
            },
            price: {
                type: Number,
                default: 0,
                required: true,
            },
            purchaseDate: {
                type: Date,
                default: null,
            },
            activeTill: {
                type: Date,
                default: null,
            },
        }
    },
    { timestamps: true }
);

UserSchema.pre("save", function (next) {
    const user = this;

    if (!user.isModified("password")) return next();
    bcrypt.genSalt(10, (err, salt) => {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) return next(err);

            user.password = hash;
            next();
        });
    });
});

UserSchema.methods.generateAccessJWT = function () {
    let payload = {
        id: this._id,
    };
    return jwt.sign(payload, SECRET_ACCESS_TOKEN, {
        expiresIn: `${TOKEN_EXPIRY_DURATION_MIN}m`,
    });
};

export default mongoose.model("Users", UserSchema);