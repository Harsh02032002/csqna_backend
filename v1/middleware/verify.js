import User from "../models/User.js";
import util from "util";
import jwt from "jsonwebtoken";
import { SECRET_ACCESS_TOKEN } from '../config/index.js';



export async function Verify(req, res, next) {
    try {
        const authHeader = req.headers["authorization"]; // get the session cookie from request header
        // if (!authHeader) return res.sendStatus(401); // if there is no cookie from request header, send an unauthorized response.
        if(!authHeader) return res.status(401).json({
            status: false,
            code: 401,
            message:
                "Unauthorized..",
        });
        const token = authHeader.split(" ")[1];  // If there is, split the cookie string to get the actual jwt
        if (!token) {
            return res.status(401).json({
                status: false,
                code: 401,
                message: "Token missing in Authorization header",
            });
        }
        const verifyAsync = util.promisify(jwt.verify);
        const decoded = await verifyAsync(token, SECRET_ACCESS_TOKEN);
        const { id } = decoded;
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({
                status: false,
                code: 401,
                message: "Invalid session. User not found",
            });
        }
        const { password, ...data } = user._doc;
        req.user = data;
        return next();

    } catch (err) {
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({
                status: false,
                code: 401,
                message: "Invalid or expired token",
            });
        }
        console.log(err);
        res.status(500).json({
            status: false,
            code: 500,
            message: "Internal Server Error",
        });
    }
}

export function VerifyRole(req, res, next) {
    try {
        const user = req.user; // we have access to the user object from the request
        const { role } = user; // extract the user role
        // console.log(role);
        // check if user has no advance privileges
        // return an unathorized response
        if (role !== "0x88") {
            return res.status(401).json({
                status: false,
                code: 401,
                message: "You are not authorized to view this page.",
            });
        }
        next(); // continue to the next middleware or function
    } catch (err) {
        res.status(500).json({
            status: false,
            code: 500,
            data: [],
            message: "Internal Server Error",
        });
    }
}