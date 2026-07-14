import express from "express";
import Validate from "../middleware/validate.js";
import { check, header } from "express-validator";
import { ClientProfessionalName, Dashboard, DeleteClient, ListCertificationQuestions, ListCertificationReports, ListCertificationTests, ListClients, ListPracticeQuestions, ListPracticeReports, ListPracticeTests, UpdateCertificationQuestion, UpdateClientData, UpdateClientProfessionalName, UpdatePracticeQuestion, UploadCertification, UploadPractice } from "../controllers/adminController.js";
import { AdminListContent, UpsertContent, DeleteContent } from "../controllers/contentController.js";

import multer from "multer";
import path from "path";

// Configure multer for file upload
const upload = multer({
    dest: "uploads/", // Temporary storage for uploaded files
    fileFilter: (req, file, cb) => {
        // Accept only .xlsx files
        if (path.extname(file.originalname) === ".xlsx") {
            cb(null, true);
        } else {
            cb(new Error("Only .xlsx files are allowed"), false);
        }
    },
});

const router = express.Router();

// Register route -- POST request
router.post(
    "/uploadpractice",
    // upload.single("file"),
    upload.array('files', 5),
    Validate,
    UploadPractice
);

router.get(
    "/dashboard",
    Validate,
    Dashboard
);

router.post(
    "/uploadcertification",
    // upload.single("file"),
    upload.array('files', 5),
    Validate,
    UploadCertification
);

router.get(
    "/practice/reports",
    Validate,
    ListPracticeReports
);

router.get(
    "/practice/tests",
    Validate,
    ListPracticeTests
);

router.get(
    "/practice/questions",
    Validate,
    ListPracticeQuestions
);

router.get(
    "/certification/reports",
    Validate,
    ListCertificationReports
);

router.get(
    "/certification/tests",
    Validate,
    ListCertificationTests
);

router.get(
    "/certification/questions",
    Validate,
    ListCertificationQuestions
);

router.patch(
    "/practice/question",
    check("id").not().isEmpty().withMessage("id is required").trim().escape(),
    check("area").not().isEmpty().withMessage("area is required").trim().escape(),
    check("category").not().isEmpty().withMessage("category is required").trim().escape(),
    check("difficultyLevel").not().isEmpty().withMessage("difficultyLevel is required").trim().escape(),
    check("questionType").not().isEmpty().withMessage("questionType is required").trim().escape(),
    check("question").not().isEmpty().withMessage("question is required").trim().escape(),
    check("Option1").not().isEmpty().withMessage("Option1 is required").trim().escape(),
    check("Option2").not().isEmpty().withMessage("Option2 is required").trim().escape(),
    check("Option3").not().isEmpty().withMessage("Option3 is required").trim().escape(),
    check("Option4").not().isEmpty().withMessage("Option4 is required").trim().escape(),
    check("isCorrectOption1").isBoolean().withMessage("isCorrectOption1 must be true or false"),
    check("isCorrectOption2").isBoolean().withMessage("isCorrectOption2 must be true or false"),
    check("isCorrectOption3").isBoolean().withMessage("isCorrectOption3 must be true or false"),
    check("isCorrectOption4").isBoolean().withMessage("isCorrectOption4 must be true or false"),
    check("justification1").not().isEmpty().withMessage("justification1 is required").trim().escape(),
    check("justification2").not().isEmpty().withMessage("justification2 is required").trim().escape(),
    check("justification3").not().isEmpty().withMessage("justification3 is required").trim().escape(),
    check("justification4").not().isEmpty().withMessage("justification4 is required").trim().escape(),
    Validate,
    UpdatePracticeQuestion
);

router.patch(
    "/certification/question",
    check("id").not().isEmpty().withMessage("id is required").trim().escape(),
    check("area").not().isEmpty().withMessage("area is required").trim().escape(),
    check("category").not().isEmpty().withMessage("category is required").trim().escape(),
    check("difficultyLevel").not().isEmpty().withMessage("difficultyLevel is required").trim().escape(),
    check("questionType").not().isEmpty().withMessage("questionType is required").trim().escape(),
    check("question").not().isEmpty().withMessage("question is required").trim().escape(),
    check("Option1").not().isEmpty().withMessage("Option1 is required").trim().escape(),
    check("Option2").not().isEmpty().withMessage("Option2 is required").trim().escape(),
    check("Option3").not().isEmpty().withMessage("Option3 is required").trim().escape(),
    check("Option4").not().isEmpty().withMessage("Option4 is required").trim().escape(),
    check("isCorrectOption1").isBoolean().withMessage("isCorrectOption1 must be true or false"),
    check("isCorrectOption2").isBoolean().withMessage("isCorrectOption2 must be true or false"),
    check("isCorrectOption3").isBoolean().withMessage("isCorrectOption3 must be true or false"),
    check("isCorrectOption4").isBoolean().withMessage("isCorrectOption4 must be true or false"),
    // check("justification1").not().isEmpty().withMessage("justification1 is required").trim().escape(),
    // check("justification2").not().isEmpty().withMessage("justification2 is required").trim().escape(),
    // check("justification3").not().isEmpty().withMessage("justification3 is required").trim().escape(),
    // check("justification4").not().isEmpty().withMessage("justification4 is required").trim().escape(),
    Validate,
    UpdateCertificationQuestion
);

router.get(
    "/clients/list",
    Validate,
    ListClients
);

router.get(
    "/clients/profesionalname",
    header('id').isMongoId().withMessage('Invalid user ID format').bail(),
    Validate,
    ClientProfessionalName
);
router.patch(
    "/clients/profesionalname",
    check('id').isMongoId().withMessage('Invalid user ID format').bail(),
    check("name").not().isEmpty().withMessage("name is required").trim().escape(),
    Validate,
    UpdateClientProfessionalName 
);

router.patch(
    "/clients/update",
    Validate,
    UpdateClientData
);

router.delete(
    "/clients/delete",
    header('id').isMongoId().withMessage('Invalid user ID format').bail(),
    Validate,
    DeleteClient
);


router.get("/content", Validate, AdminListContent);
router.post("/content", Validate, UpsertContent);
router.delete("/content/:id", Validate, DeleteContent);

export default router;