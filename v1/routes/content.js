import express from "express";
import { GetContent } from "../controllers/contentController.js";

const router = express.Router();

router.get("/", GetContent);

export default router;
