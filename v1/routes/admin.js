import express from "express";
import Validate from "../middleware/validate.js";
import { check, header } from "express-validator";
import {
    ClientProfessionalName, Dashboard, DeleteClient,
    ListCertificationQuestions, ListCertificationReports, ListCertificationTests,
    ListClients, ListPracticeQuestions, ListPracticeReports, ListPracticeTests,
    UpdateCertificationQuestion, UpdateClientData, UpdateClientProfessionalName,
    UpdatePracticeQuestion, UploadCertification, UploadPractice,
    AddPracticeQuestion, DeletePracticeQuestion, BulkDeletePracticeQuestions,
    AddCertificationQuestion, DeleteCertificationQuestion, BulkDeleteCertificationQuestions
} from "../controllers/adminController.js";
import { AdminListContent, UpsertContent, DeleteContent } from "../controllers/contentController.js";

import multer from "multer";
import path from "path";

const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) === ".xlsx") {
            cb(null, true);
        } else {
            cb(new Error("Only .xlsx files are allowed"), false);
        }
    },
});

const router = express.Router();

// ── Excel Upload ─────────────────────────────────────────────────────────────
router.post("/uploadpractice",      upload.array('files', 5), Validate, UploadPractice);
router.post("/uploadcertification", upload.array('files', 5), Validate, UploadCertification);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get("/dashboard", Validate, Dashboard);

// ── Practice Reports & Tests ──────────────────────────────────────────────────
router.get("/practice/reports", Validate, ListPracticeReports);
router.get("/practice/tests",   Validate, ListPracticeTests);

// ── Practice Questions CRUD ───────────────────────────────────────────────────
router.get("/practice/questions",         Validate, ListPracticeQuestions);
router.post("/practice/question",         Validate, AddPracticeQuestion);
router.patch("/practice/question",
    check("id").not().isEmpty().withMessage("id is required").trim().escape(),
    check("area").not().isEmpty().withMessage("area is required").trim().escape(),
    check("category").not().isEmpty().withMessage("category is required").trim().escape(),
    check("difficultyLevel").not().isEmpty().withMessage("difficultyLevel is required").trim().escape(),
    check("questionType").not().isEmpty().withMessage("questionType is required").trim().escape(),
    check("question").not().isEmpty().withMessage("question is required").trim().escape(),
    check("Option1").not().isEmpty().withMessage("Option1 is required").trim().escape(),
    check("Option2").not().isEmpty().withMessage("Option2 is required").trim().escape(),
    check("isCorrectOption1").isBoolean().withMessage("isCorrectOption1 must be true or false"),
    check("isCorrectOption2").isBoolean().withMessage("isCorrectOption2 must be true or false"),
    check("isCorrectOption3").isBoolean().withMessage("isCorrectOption3 must be true or false"),
    check("isCorrectOption4").isBoolean().withMessage("isCorrectOption4 must be true or false"),
    Validate, UpdatePracticeQuestion
);
router.delete("/practice/questions/bulk", Validate, BulkDeletePracticeQuestions);
router.delete("/practice/question",
    header('id').isMongoId().withMessage('Invalid question ID').bail(),
    Validate, DeletePracticeQuestion
);

// ── Certification Reports & Tests ─────────────────────────────────────────────
router.get("/certification/reports", Validate, ListCertificationReports);
router.get("/certification/tests",   Validate, ListCertificationTests);

// ── Certification Questions CRUD ──────────────────────────────────────────────
router.get("/certification/questions",         Validate, ListCertificationQuestions);
router.post("/certification/question",         Validate, AddCertificationQuestion);
router.patch("/certification/question",
    check("id").not().isEmpty().withMessage("id is required").trim().escape(),
    check("area").not().isEmpty().withMessage("area is required").trim().escape(),
    check("category").not().isEmpty().withMessage("category is required").trim().escape(),
    check("difficultyLevel").not().isEmpty().withMessage("difficultyLevel is required").trim().escape(),
    check("questionType").not().isEmpty().withMessage("questionType is required").trim().escape(),
    check("question").not().isEmpty().withMessage("question is required").trim().escape(),
    check("Option1").not().isEmpty().withMessage("Option1 is required").trim().escape(),
    check("Option2").not().isEmpty().withMessage("Option2 is required").trim().escape(),
    check("isCorrectOption1").isBoolean().withMessage("isCorrectOption1 must be true or false"),
    check("isCorrectOption2").isBoolean().withMessage("isCorrectOption2 must be true or false"),
    check("isCorrectOption3").isBoolean().withMessage("isCorrectOption3 must be true or false"),
    check("isCorrectOption4").isBoolean().withMessage("isCorrectOption4 must be true or false"),
    Validate, UpdateCertificationQuestion
);
router.delete("/certification/questions/bulk", Validate, BulkDeleteCertificationQuestions);
router.delete("/certification/question",
    header('id').isMongoId().withMessage('Invalid question ID').bail(),
    Validate, DeleteCertificationQuestion
);

// ── Clients ───────────────────────────────────────────────────────────────────
router.get("/clients/list",              Validate, ListClients);
router.get("/clients/profesionalname",
    header('id').isMongoId().withMessage('Invalid user ID format').bail(),
    Validate, ClientProfessionalName
);
router.patch("/clients/profesionalname",
    check('id').isMongoId().withMessage('Invalid user ID format').bail(),
    check("name").not().isEmpty().withMessage("name is required").trim().escape(),
    Validate, UpdateClientProfessionalName
);
router.patch("/clients/update",  Validate, UpdateClientData);
router.delete("/clients/delete",
    header('id').isMongoId().withMessage('Invalid user ID format').bail(),
    Validate, DeleteClient
);

// ── CMS Content ───────────────────────────────────────────────────────────────
router.get("/content",     Validate, AdminListContent);
router.post("/content",    Validate, UpsertContent);
router.delete("/content/:id", Validate, DeleteContent);

export default router;