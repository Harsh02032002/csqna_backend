import ExcelJS from "exceljs";
import Questions from "../models/Questions.js";
import fs from "fs";
import path from 'path';
import { fileURLToPath } from 'url';
import CertificationQuestions from "../models/CertificationQuestions.js";
import Reports from "../models/Reports.js"
import Tests from "../models/Tests.js"
import CertificationReports from "../models/CertificationReports.js"
import CertificationTests from "../models/CertificationTests.js"
import Certification from "../models/Certification.js";
import User from "../models/User.js";
import UserCertification from "../models/UserCertification.js";
import UserProfessionalNames from "../models/UserProfessionalNames.js";
import mongoose from "mongoose";

const toStringSafe = (value) => {
    return value !== undefined && value !== null ? String(value).trim() : "";
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads'); // Set a safe directory

/**
 * @route POST v1/admin/uploadpractice
 * @desc Upload practice test question excel sheet
 * @access Admin
 */
export async function UploadPractice(req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(200).send({
            status: false,
            code: 400,
            message: 'No files uploaded.'
        });
    }

    let allSavedQuestions = []; // To store all the saved questions
    let allErrors = []; // To store any errors encountered

    // Process each file
    req.files.forEach(async (file, index) => {
        try {
            let inputPath = file.path;
            // console.log(inputPath);
            inputPath = inputPath.replace(/%2e/ig, '.');
            // console.log(inputPath);
            inputPath = inputPath.replace(/%2f|%5c/ig, '/');
            // console.log(inputPath);
            const normalizedPath = path.normalize(inputPath);
            // console.log(normalizedPath);
            const safePath = path.join(UPLOADS_DIR, path.basename(normalizedPath)); // Restrict to UPLOADS_DIR
            // console.log(safePath);
            if (!safePath.startsWith(UPLOADS_DIR)) {
                throw new Error('Invalid file path detected.');
            }

            // Check if the file exists before reading
            if (!fs.existsSync(safePath)) {
                throw new Error('File does not exist.');
            }

            // Validate file extension
            if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
                throw new Error('Invalid file format.');
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(safePath);

            const worksheet = workbook.worksheets[0]; // Get the first worksheet
            const data = [];
            const savePromises = [];

            // Get headers (first row)
            const headers = worksheet.getRow(1).values.slice(1); // Slice to remove empty first element

            // Create an array of promises to handle saving of each question
            const rowPromises = [];

            // Iterate through the rows starting from the second row (index 2)
            worksheet.eachRow((row, rowIndex) => {
                if (rowIndex > 1) { // Skip the header row
                    const rowData = {};
                    row.values.slice(1).forEach((cell, index) => {
                        rowData[headers[index]] = cell;
                    });

                    data.push(rowData);

                    // Create a promise for checking if the question already exists
                    const questionCheckPromise = Questions.findOne({ question: rowData.Question })
                        .then(existingQuestion => {
                            if (existingQuestion) {
                                // If question already exists, log and skip saving
                                console.log(`Question already exists: ${rowData.Question}`);
                            } else {
                                // Create a new question and add it to the save promises
                                const newQuestion = new Questions({
                                    category: rowData.Category,
                                    area: rowData.Area,
                                    question: rowData.Question,
                                    options: {
                                        Option1: toStringSafe(rowData.Option1),
                                        Option2: toStringSafe(rowData.Option2),
                                        Option3: toStringSafe(rowData.Option3),
                                        Option4: toStringSafe(rowData.Option4),
                                    },
                                    correctAnswers: [
                                        toStringSafe(rowData.CorrectOption1),
                                        toStringSafe(rowData.CorrectOption2),
                                        toStringSafe(rowData.CorrectOption3),
                                        toStringSafe(rowData.CorrectOption4),
                                    ],
                                    justifications: {
                                        Option1: toStringSafe(rowData.Justification1),
                                        Option2: toStringSafe(rowData.Justification2),
                                        Option3: toStringSafe(rowData.Justification3),
                                        Option4: toStringSafe(rowData.Justification4),
                                    },
                                    questionType: toStringSafe(rowData.QuestionType),
                                    difficultyLevel: toStringSafe(rowData.DifficultyLevel),
                                });

                                try {
                                    // Add the save promise to the array
                                    const savePromise = newQuestion.save();
                                    savePromises.push(savePromise);
                                } catch (error) {
                                    console.log(rowIndex);
                                    console.log(error);
                                }
                            }
                        });

                    rowPromises.push(questionCheckPromise);
                }
            });

            // Wait for all row checks to complete
            await Promise.all(rowPromises);

            // Wait for all save operations to complete
            const savedQuestions = await Promise.all(savePromises);

            // Add to the accumulated results
            allSavedQuestions = allSavedQuestions.concat(savedQuestions);

            // After processing all files, delete the file
            fs.unlink(safePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                    allErrors.push(`Error deleting file: ${safePath}`);
                } else {
                    console.log(`File deleted: ${safePath}`);
                }
            });
        } catch (error) {
            // Catch any errors
            console.error("Error processing file:", error);
            allErrors.push(`Error processing file: ${file.originalname} - ${error.message}`);
        } finally {
            // Once all files are processed, send the response
            if (index === req.files.length - 1) { // Check if it is the last file
                if (allErrors.length > 0) {
                    return res.status(200).json({
                        status: false,
                        code: 500,
                        message: "Error processing files",
                        errors: allErrors
                    });
                } else {
                    return res.status(200).json({
                        status: true,
                        code: 200,
                        message: "Files processed successfully",
                        data: allSavedQuestions
                    });
                }
            }
        }
    });
}

/**
 * @route GET v1/admin/dashboard
 * @desc Get Dashboard Data for admin
 * @access Admin
 */
export async function Dashboard(req, res) {
    try {
        // Use MongoDB aggregation to calculate counts
        const practiceStats = await Questions.aggregate([
            {
                $facet: {
                    // Count total questions
                    questionCount: [{ $count: "total" }],
                    // Count unique categories
                    categoryCount: [
                        { $group: { _id: "$category" } },
                        { $count: "total" }
                    ],
                    // Count unique difficulties
                    difficultyCount: [
                        { $group: { _id: "$difficultyLevel" } },
                        { $count: "total" }
                    ]
                }
            }
        ]);

        // Parse the results
        const practiceStatsData = {
            questionCount: practiceStats[0]?.questionCount[0]?.total || 0, // Total questions
            categoryCount: practiceStats[0]?.categoryCount[0]?.total || 0, // Total unique categories
            difficultyCount: practiceStats[0]?.difficultyCount[0]?.total || 0, // Total unique difficulties
        }


        const certificationStats = await CertificationQuestions.aggregate([
            {
                $facet: {
                    // Count total questions
                    questionCount: [{ $count: "total" }],
                    // Count unique certification
                    certification: [
                        { $group: { _id: "$certification" } },
                        { $count: "total" }
                    ],
                }
            }
        ]);

        // Parse the results
        const certificationStatsData = {
            questionCount: certificationStats[0]?.questionCount[0]?.total || 0, // Total questions
            certificationCount: certificationStats[0]?.certification[0]?.total || 0, // Total unique certification
        }

        const userStats = await User.aggregate([
            {
                $facet: {
                    total: [{ $count: "total" }],
                    planFree: [
                        {
                            $match: {
                                "$or": [
                                    { "planDetails.planName": "Free" },
                                    { "planDetails.planName": null }
                                ]
                            }
                        },
                        { $count: "total" }
                    ],
                    plan1: [
                        { $match: { "planDetails.planName": "Plan1" } },
                        { $count: "total" }
                    ],
                    plan2: [
                        { $match: { "planDetails.planName": "Plan2" } },
                        { $count: "total" }
                    ],
                }
            }
        ]);

        // Parse the results
        const userStatsData = {
            total: userStats[0]?.total[0]?.total || 0,
            planFree: userStats[0]?.planFree[0]?.total || 0,
            plan1: userStats[0]?.plan1[0]?.total || 0,
            plan2: userStats[0]?.plan2[0]?.total || 0,
        }

        const certificateStats = await UserCertification.aggregate([
            {
                $facet: {
                    // Count total questions
                    total: [{ $count: "total" }],
                    uniqueUsers: [
                        { $group: { _id: "$userId" } },
                        { $count: "total" }
                    ],
                    uniqueCertifications: [
                        { $group: { _id: "$certification_id" } },
                        { $count: "total" }
                    ],
                }
            }
        ]);

        // Parse the results
        const certificateStatsData = {
            total: certificateStats[0]?.total[0]?.total || 0,
            uniqueUsers: certificateStats[0]?.uniqueUsers[0]?.total || 0,
            uniqueCertifications: certificateStats[0]?.uniqueCertifications[0]?.total || 0,
        }

        const certificationRevenue = await UserCertification.aggregate([
            {
                $lookup: {
                    from: "certifications", // Collection to join
                    localField: "certification_id",
                    foreignField: "_id",
                    as: "certification"
                }
            },
            {
                $unwind: "$certification" // Flatten the certification array
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$certification.price" } // Sum up all amounts
                }
            }
        ]);

        const revenue = {
            certification: certificationRevenue[0]?.totalAmount || 0,
            subscription: userStatsData.plan1 * 550 + userStatsData.plan2 * 750
        }

        // Return the counts as a response
        res.json({
            success: true,
            status: 200,
            data: {
                practiceStatsData,
                certificationStatsData,
                userStatsData,
                certificateStatsData,
                revenue
            }
        });
    } catch (error) {
        console.error("Error fetching question stats:", error);
        res.status(200).json({
            status: 500,
            success: false,
            error: "Internal Server Error"
        });
    }
}


/**
 * @route POST v1/admin/uploadcertification
 * @desc Upload certification test question excel sheet
 * @access Admin
 */
export async function UploadCertification(req, res) {
    if (!req.files || req.files.length === 0) {
        return res.status(200).send({
            status: false,
            code: 400,
            message: 'No files uploaded.'
        });
    }

    let allSavedQuestions = []; // To store all the saved questions
    let allErrors = []; // To store any errors encountered

    // Process each file
    req.files.forEach(async (file, index) => {
        try {
            let inputPath = file.path;
            inputPath = inputPath.replace(/%2e/ig, '.');
            inputPath = inputPath.replace(/%2f|%5c/ig, '/');
            const normalizedPath = path.normalize(inputPath);
            const safePath = path.join(UPLOADS_DIR, path.basename(normalizedPath)); // Restrict to UPLOADS_DIR
            if (!safePath.startsWith(UPLOADS_DIR)) {
                throw new Error('Invalid file path detected.');
            }

            // Check if the file exists before reading
            if (!fs.existsSync(safePath)) {
                throw new Error('File does not exist.');
            }

            // Validate file extension
            if (!file.originalname.toLowerCase().endsWith('.xlsx')) {
                throw new Error('Invalid file format.');
            }

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(safePath);

            const worksheet = workbook.worksheets[0]; // Get the first worksheet
            const data = [];
            const savePromises = [];

            // Get headers (first row)
            const headers = worksheet.getRow(1).values.slice(1); // Slice to remove empty first element

            // Create an array of promises to handle saving of each question
            const rowPromises = [];
            // console.log(worksheet.actualRowCount);

            // Iterate through the rows starting from the second row (index 2)
            for (let rowIndex = 1; rowIndex <= worksheet.actualRowCount; rowIndex++) {
                let row = worksheet.getRow(rowIndex);
                if (rowIndex > 1) { // Skip the header row
                    const rowData = {};
                    row.values.slice(1).forEach((cell, index) => {
                        rowData[headers[index]] = cell;
                    });


                    // console.log(rowIndex, row.values.length, row.values);
                    data.push(rowData);

                    // Create a promise for checking if the question already exists
                    const questionCheckPromise = CertificationQuestions.findOne({ question: rowData.Question })
                        .then(existingQuestion => {
                            if (existingQuestion) {
                                // If question already exists, log and skip saving
                                console.log(`Question already exists: ${rowData.Question}`);
                            } else {
                                // Create a new question and add it to the save promises
                                const newQuestion = new CertificationQuestions({
                                    certification: rowData.Certification,
                                    category: rowData.Category,
                                    area: rowData.Area,
                                    question: rowData.Question,
                                    options: {
                                        Option1: toStringSafe(rowData.Option1),
                                        Option2: toStringSafe(rowData.Option2),
                                        Option3: toStringSafe(rowData.Option3),
                                        Option4: toStringSafe(rowData.Option4),
                                    },
                                    correctAnswers: [
                                        toStringSafe(rowData.CorrectOption1),
                                        toStringSafe(rowData.CorrectOption2),
                                        toStringSafe(rowData.CorrectOption3),
                                        toStringSafe(rowData.CorrectOption4),
                                    ],
                                    justifications: {
                                        Option1: toStringSafe(rowData.Justification1),
                                        Option2: toStringSafe(rowData.Justification2),
                                        Option3: toStringSafe(rowData.Justification3),
                                        Option4: toStringSafe(rowData.Justification4),
                                    },
                                    questionType: toStringSafe(rowData.QuestionType),
                                    difficultyLevel: toStringSafe(rowData.DifficultyLevel),
                                });

                                try {
                                    // Add the save promise to the array
                                    const savePromise = newQuestion.save();
                                    savePromises.push(savePromise);
                                } catch (error) {
                                    console.log(rowIndex);
                                    console.log(error);
                                }
                            }
                        });

                    rowPromises.push(questionCheckPromise);
                }
            };

            // Wait for all row checks to complete
            await Promise.all(rowPromises);

            // Wait for all save operations to complete
            const savedQuestions = await Promise.all(savePromises);

            // Add to the accumulated results
            allSavedQuestions = allSavedQuestions.concat(savedQuestions);

            // After processing all files, delete the file
            fs.unlink(safePath, (err) => {
                if (err) {
                    console.error("Error deleting file:", err);
                    allErrors.push(`Error deleting file: ${safePath}`);
                } else {
                    console.log(`File deleted: ${safePath}`);
                }
            });
        } catch (error) {
            // Catch any errors
            console.error("Error processing file:", error);
            allErrors.push(`Error processing file: ${file.originalname} - ${error.message}`);
        } finally {
            // Once all files are processed, send the response
            if (index === req.files.length - 1) { // Check if it is the last file
                if (allErrors.length > 0) {
                    return res.status(200).json({
                        status: false,
                        code: 500,
                        message: "Error processing files",
                        errors: allErrors
                    });
                } else {
                    return res.status(200).json({
                        status: true,
                        code: 200,
                        message: "Files processed successfully",
                        data: allSavedQuestions
                    });
                }
            }
        }
    });
}

/**
 * @route GET v1/admin/practice/reports
 * @desc List reports of all practice tests
 * @access Admin
 */
export async function ListPracticeReports(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const reports = await Reports.find({})
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            code: 200,
            data: reports,
            message: 'Reports fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch reports'
        });
    }
}

/**
 * @route GET v1/admin/practice/tests
 * @desc List of all practice tests
 * @access Admin
 */
export async function ListPracticeTests(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const tests = await Tests.find({})
            .select('userid category testname difficulty questions duration createdAt endTime isEnded')
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userid', 'username');

        res.status(200).json({
            status: true,
            code: 200,
            data: tests,
            message: 'Tests fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching Tests:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch Tests'
        });
    }
}

/**
 * @route GET v1/admin/practice/questions
 * @desc List of all practice questions
 * @access Admin
 */
export async function ListPracticeQuestions(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const questions = await Questions.find({})
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            code: 200,
            data: questions,
            message: 'questions fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch questions'
        });
    }
}

/**
 * @route GET v1/admin/certification/reports
 * @desc List reports of all certification tests
 * @access Admin
 */
export async function ListCertificationReports(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const reports = await CertificationReports.find({})
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            code: 200,
            data: reports,
            message: 'Reports fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch reports'
        });
    }
}

/**
 * @route GET v1/admin/certification/tests
 * @desc List of all certification tests
 * @access Admin
 */
export async function ListCertificationTests(req, res) {
    try {
        // const temp = Certification({
        //     certificationId: "CISSP",
        //     certificationName: "Certified Information Systems Security Professional",
        //     description: "Certified Information Systems Security Professional",
        //     details: {
        //         "Duration": "240 minutes",
        //         "Number of questions": "150",
        //         " Question format": "MCQ",
        //         "Exam language": "English",
        //             "Assessment Method": "CAT"
        //     },
        //     price: 750
        // })
        // const temp2 = await temp.save();
        // console.log(temp2)
        // return;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const tests = await CertificationTests.find({})
            .select('userid certificationname category testname difficulty questions duration createdAt endTime isEnded')
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit)
            .populate('userid', 'username');

        res.status(200).json({
            status: true,
            code: 200,
            data: tests,
            message: 'Tests fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching Tests:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch Tests'
        });
    }
}

/**
 * @route GET v1/admin/certification/questions
 * @desc List of all certification questions
 * @access Admin
 */
export async function ListCertificationQuestions(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const questions = await CertificationQuestions.find({})
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            code: 200,
            data: questions,
            message: 'questions fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch questions'
        });
    }
}

/**
 * @route PATCH v1/admin/practice/question
 * @desc Update practice questions
 * @access Admin
 */
export async function UpdatePracticeQuestion(req, res) {
    try {
        const { id, area, category, difficultyLevel, questionType,
            question, Option1, Option2, Option3, Option4, isCorrectOption1, isCorrectOption2, isCorrectOption3, isCorrectOption4,
            justification1, justification2, justification3, justification4
        } = req.body;

        const options = { Option1, Option2, Option3, Option4 };
        const correctAnswers = [
            Boolean(isCorrectOption1) ? Option1 : "",
            Boolean(isCorrectOption2) ? Option2 : "",
            Boolean(isCorrectOption3) ? Option3 : "",
            Boolean(isCorrectOption4) ? Option4 : ""
        ];
        const justifications = {
            Option1: justification1,
            Option2: justification2,
            Option3: justification3,
            Option4: justification4
        };

        const updatedStat = await Questions.updateOne({ _id: id }, {
            $set: {
                area, category, difficultyLevel, questionType, question,
                options, correctAnswers, justifications
            }
        });



        res.status(200).json({
            status: true,
            code: 200,
            data: updatedStat,
            message: 'question updated Successfully'
        });

    } catch (error) {
        console.error('Error updating questions:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to update questions'
        });
    }
}

/**
 * @route PATCH v1/admin/certification/question
 * @desc Update certification questions
 * @access Admin
 */
export async function UpdateCertificationQuestion(req, res) {
    try {
        const { id, area, category, difficultyLevel, questionType,
            question, Option1, Option2, Option3, Option4, isCorrectOption1, isCorrectOption2, isCorrectOption3, isCorrectOption4,
            justification1, justification2, justification3, justification4
        } = req.body;

        const options = { Option1, Option2, Option3, Option4 };
        const correctAnswers = [
            Boolean(isCorrectOption1) ? Option1 : "",
            Boolean(isCorrectOption2) ? Option2 : "",
            Boolean(isCorrectOption3) ? Option3 : "",
            Boolean(isCorrectOption4) ? Option4 : ""
        ];
        const justifications = {
            Option1: justification1 ? justification1 : "",
            Option2: justification2 ? justification2 : "",
            Option3: justification3 ? justification3 : "",
            Option4: justification4 ? justification4 : ""
        };

        const updatedStat = await CertificationQuestions.updateOne({ _id: id }, {
            $set: {
                area, category, difficultyLevel, questionType, question,
                options, correctAnswers, justifications
            }
        });



        res.status(200).json({
            status: true,
            code: 200,
            data: updatedStat,
            message: 'question updated Successfully'
        });

    } catch (error) {
        console.error('Error updating questions:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to update questions'
        });
    }
}

/**
 * @route GET v1/admin/clients/list
 * @desc List of clients
 * @access Admin
 */
export async function ListClients(req, res) {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 1000;
        const skip = (page - 1) * limit;

        const clients = await User.find({
            $or: [{ name: { $regex: search } }, { email: { $regex: search } }],
            role: "0x01"
        })
            .sort({ submitTime: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            status: true,
            code: 200,
            data: clients,
            message: 'client fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching client list:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch client list'
        });
    }
}

/**
 * @route GET v1/admin/clients/profesionalname
 * @desc gets clients profesional name
 * @access Admin
 */
export async function ClientProfessionalName(req, res) {
    try {
        const userid = req.headers.id;
        const profesionalname = await UserProfessionalNames.findOne({ userid: new mongoose.Types.ObjectId(userid) });

        res.status(200).json({
            status: true,
            code: 200,
            data: profesionalname.userProfessionalName,
            message: 'profesionalname fetched Successfully'
        });

    } catch (error) {
        console.error('Error fetching client profesionalname:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to fetch client profesionalname'
        });
    }
}

/**
 * @route PATCH v1/admin/clients/profesionalname
 * @desc gets clients profesional name
 * @access Admin
 */
export async function UpdateClientProfessionalName(req, res) {
    try {
        const { id, name } = req.body
       
        const profesionalname = await UserProfessionalNames.updateOne({ userid: id },
            {userProfessionalName: name}
        )

        if( profesionalname.modifiedCount == 1){
            res.status(200).json({
                status: true,
                code: 200,
                message: 'profesionalname updated Successfully'
            });
        }
        else{
            res.status(200).json({
                status: true,
                code: 404,
                data: profesionalname,
                message: 'error profesionalname updated'
            });
        }

    } catch (error) {
        console.error('Error updating client profesionalname:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to update client profesionalname'
        });
    }
}

/**
 * @route PATCH v1/admin/clients/update
 * @desc Update client data
 * @access Admin
 */
export async function UpdateClientData(req, res) {
    try {
        const { id, username, email, phonenumber, first_name, last_name, address, city, state, country, zipcode
        } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(200).json({
                status: false,
                code: 404,
                data: [],
                message: 'Unable to find user data'
            });
        }

        if (username) { user.username = username }
        if (email) { user.email = email }
        if (phonenumber) { user.phonenumber = phonenumber }
        if (first_name) { user.first_name = first_name }
        if (last_name) { user.last_name = last_name }
        if (address) { user.address = address }
        if (city) { user.city = city }
        if (state) { user.state = state }
        if (country) { user.country = country }
        if (zipcode) { user.zipcode = zipcode }

        const updatedUser = await user.save();


        // console.log(updatedUser);

        res.status(200).json({
            status: true,
            code: 200,
            data: updatedUser,
            message: 'user updated Successfully'
        });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to update user'
        });
    }
}

/**
 * @route DELETE v1/admin/clients/delete
 * @desc Delete client data
 * @access Admin
 */
export async function DeleteClient(req, res) {
    try {
        const { id } = req.headers;

        // console.log(id);
        const user = await User.findById(id);
        if (!user) {
            return res.status(200).json({
                status: false,
                code: 404,
                data: [],
                message: 'Unable to find user data'
            });
        }

        const updatedUser = await user.deleteOne();

        // console.log(updatedUser);

        res.status(200).json({
            status: true,
            code: 200,
            data: updatedUser,
            message: 'user deleted Successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(200).json({
            status: false,
            code: 500,
            data: [],
            message: 'Failed to delete user'
        });
    }
}