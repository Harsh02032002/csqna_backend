import bodyParser from "body-parser";
import CryptoJS from "crypto-js";
import {AES_SECRET_KEY} from "../config/index.js"

const EncDec = (server) => {

    // SECRET KEY (Must be 16 characters as per your Angular setup)
    const SECRET_KEY = AES_SECRET_KEY;

    // Encrypt function (AES-256-ECB with PKCS7 Padding)
    function encryptAES(data) {
        try {
            if (!data) throw new Error("Data to encrypt cannot be empty");

            const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
            const formattedData = CryptoJS.enc.Utf8.parse(data);

            const encrypted = CryptoJS.AES.encrypt(formattedData, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });

            return encrypted.toString();
        } catch (error) {
            console.error("Encryption error:", error);
            throw error;
        }
    }

    // Decrypt function (AES-256-ECB with PKCS7 Padding)
    function decryptAES(encryptedData) {
        try {
            const key = CryptoJS.enc.Utf8.parse(SECRET_KEY);
            const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });

            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (error) {
            console.error("Decryption error:", error);
            throw error;
        }
    }

    // Middleware to decrypt request body
    server.use(bodyParser.text()); // Expecting raw text
    server.use((req, res, next) => {
        const urlPath = req.path || req.originalUrl || req.url || "";

        // ── CHAT / CONTENT: always bypass encryption ──
        // express.json() may have already parsed the body into an object,
        // so we cannot rely on typeof === "string" here.
        if (urlPath.includes("/chat") || urlPath.includes("/content")) {
            // If body somehow arrived as a raw string, parse it
            if (typeof req.body === "string" && req.body.trim() !== "") {
                try { req.body = JSON.parse(req.body); } catch (e) {}
            }
            return next();
        }

        // ── ALL OTHER ROUTES: expect AES-encrypted string ──
        try {
            if (JSON.stringify(req.body) !== "{}") {
                if (typeof req.body === "string" && req.body.trim() !== "") {
                    req.body = JSON.parse(decryptAES(req.body));
                } else if (
                    req.url.slice(req.url.length - 21) === "/admin/uploadpractice" ||
                    req.url.slice(req.url.length - 26) === "/admin/uploadcertification"
                ) {
                    console.log("ok");
                } else if (typeof req.body === "object" && req.body !== null) {
                    // express.json() already parsed an encrypted payload — should not happen
                    // but don't block the request; just let it through
                } else {
                    return res.status(200).json({ status: false, code: 6001, message: "invalid encrypted request body" });
                }
            }
        } catch (error) {
            console.error(error);
            return res.status(200).json({ status: false, code: 6001, message: "Invalid encrypted data" });
        }
        next();
    });

    // Middleware to encrypt response before sending
    server.use((req, res, next) => {
        const urlPath = req.path || req.originalUrl || req.url || "";
        if (urlPath.includes("/chat") || urlPath.includes("/content")) {
            return next();
        }
        // console.log(res.send);
        const originalSend = res.send;
        res.send = function (body) {
            try {
                if (typeof body === "object") {
                    body = JSON.stringify(body); // Convert response to string
                }

                const encryptedBody = encryptAES(body);
                // console.log(body, encryptedBody)
                res.setHeader("Content-Type", "application/octet-stream");
                originalSend.call(this, encryptedBody);
            } catch (error) {
                console.error("Error encrypting response:", error);
                originalSend.call(this, JSON.stringify({ error: "Encryption error" }));
            }
        };
        next();
    });


}

export default EncDec;