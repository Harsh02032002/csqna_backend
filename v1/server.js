import dns from "dns";
dns.setDefaultResultOrder("ipv4first");
// if (process.env.NODE_ENV !== "production") {
//     dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
// }

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { PORT, URI } from "./config/index.js";
import Router from "./routes/index.js";

import EncDec from "./middleware/enc-dec.js"

// === 1 - CREATE SERVER ===
const server = express();

// CONFIGURE HEADER INFORMATION
// Allow request from any source. In real production, this should be limited to allowed origins only
server.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});
server.use(cors());
server.disable("x-powered-by"); //Reduce fingerprinting
server.use(express.urlencoded({ extended: false }));
server.use(express.json());

EncDec(server);


// === 2 - CONNECT DATABASE ===
// Set up mongoose's promise to global promise
mongoose.promise = global.Promise;
mongoose.set("strictQuery", false);

console.log(`⏳ Connecting to MongoDB at ${URI}...`);

mongoose
  .connect(URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s if MongoDB is not running
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
    console.error("Please make sure your MongoDB server is running.");
  });

// === 4 - CONFIGURE ROUTES ===
// Connect Route handler to server
Router(server);

// === 5 - START UP SERVER ===
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});