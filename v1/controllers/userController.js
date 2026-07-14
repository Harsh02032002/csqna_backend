import CertificationQuestions from "../models/CertificationQuestions.js";
import Notifications from "../models/Notifications.js";
import Questions from "../models/Questions.js";
import Reports from "../models/Reports.js";
import Tests from "../models/Tests.js";
import User from "../models/User.js";
import { logNotification } from "../service/notificationService.js";
import bcrypt from "bcryptjs";
import razorpay from "../config/razorpay.js";
import Payment from "../models/Payment.js";
import { RAZORPAY_SECRET } from "../config/index.js";
import UserCertification from "../models/UserCertification.js";
import crypto from "crypto";
import CertificationTests from "../models/CertificationTests.js";
import CertificationReports from "../models/CertificationReports.js";
import Certification from "../models/Certification.js";
import UserProfessionalNames from "../models/UserProfessionalNames.js";
import CertificatesIssued from "../models/CertificatesIssued.js";


const now = new Date();
const ongoingDuration = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

// Function to find set intersection
function CalculateMSQ(set1, set2) {
  set1.delete(null);
  set2.delete(null);
  const resultSet = new Set();
  for (let element of set1) {
    if (set2.has(element)) {
      resultSet.add(element);
    }
  }
  return Math.trunc(resultSet.size * (1 / set1.size) * 100) / 100;
}
// Function to find set intersection
function setIntersection(set1, set2) {
  const resultSet = new Set();
  for (let element of set1) {
    if (set2.has(element)) {
      resultSet.add(element);
    }
  }
  return resultSet;
}
// Function to check if two sets are equal
function areSetsEqual(setA, setB) {
  setA.delete(null)
  if (setA.size !== setB.size) {
    return false;
  }

  for (let element of setA) {
    if (!setB.has(element)) {
      return false;
    }
  }
  return true;
}
// Function to check if set1 is a subset of set2
function isSubset(set1, set2) {
  for (let element of set1) {
    if (!set2.has(element)) {
      return false; // If any element of set1 is not in set2, return false
    }
  }
  return true; // If all elements of set1 are in set2, return true
}

/**
 * @route GET v1/user/practice/categories
 * @desc Get all categories for practice test
 * @access User
 */
export async function GetAllCategories(req, res) {
  try {

    const distinctCategories = await Questions.distinct('category');

    res.status(200).json({
      status: true,
      code: 200,
      data: distinctCategories,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching Categories:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch Categories'
    });
  }
}

/**
 * @route GET v1/user/practice/difficulty
 * @desc Get all Difficulty for practice test
 * @access User
 */
export async function GetAllDifficulty(req, res) {
  try {

    const distinctCategories = await Questions.distinct('difficultyLevel');

    res.status(200).json({
      status: true,
      code: 200,
      data: distinctCategories,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching Difficulty:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch Difficulty'
    });
  }
}

/**
 * @route POST v1/user/practice/generate
 * @desc Generate practice test 
 * @access User
 */
export async function GeneratePractice(req, res) {
  try {
    // Get the filters and count from query parameters
    const { category, difficulty, questions, duration, testname } = req.body;
    const userid = req.user._id;
    const numberOfQuestions = parseInt(questions) || 5;

    // Build the match filter dynamically based on query parameters
    const matchFilter = {};
    // Handle multiple categories
    if (Array.isArray(category) && category.length > 0 && !category.includes("Any")) {
      matchFilter.category = { $in: category }; // Matches any category in the array
    } else if (category && category !== "Any" && !Array.isArray(category)) {
      matchFilter.category = category; // For single category
    }

    if (Array.isArray(difficulty) && difficulty.length > 0 && !difficulty.includes("Any")) {
      matchFilter.difficultyLevel = { $in: difficulty };
    } else if (difficulty && difficulty !== "Any" && !Array.isArray(difficulty)) {
      matchFilter.difficultyLevel = difficulty;
    }


    // Use aggregation with $match, $sample, and $project
    const randomQuestions = await Questions.aggregate([
      { $match: matchFilter }, // Apply filtering
      { $sample: { size: numberOfQuestions } }, // Random sampling
      {
        $project: {
          _id: 1,
          category: 1,
          question: 1,
          options: 1,
          questionType: 1,
          difficultyLevel: 1,
        },
      },
    ]);

    if (randomQuestions.length === 0) {
      return res.status(200).json({
        status: false,
        code: 404,
        data: [],
        message: "No questions found for the given criteria"
      });
    } else if (randomQuestions.length < questions) {
      return res.status(200).json({
        status: false,
        code: 404,
        data: [],
        message: "Only " + randomQuestions.length + " questions found for the given criteria"
      });
    }

    const createdAt = new Date();
    const testDuration = parseInt(duration) || randomQuestions.length;
    const endTime = new Date(createdAt.getTime() + testDuration * 60 * 1000);

    const test = new Tests({
      userid, testname,
      category, difficulty, questions, duration,
      testQuestions: randomQuestions,
      createdAt,
      endTime
    });

    // await test.save();

    const { testQuestions, startTime, isEnded, __v, userid: userid2, endTime: endTime2, ...savedTest } = (await test.save()).toObject();
    const r = await User.updateOne({ _id: userid }, { $inc: { 'testCount': 1 } });
    // console.log(r, userid);

    res.json({
      status: true,
      code: 200,
      message: "Test generated successfully",
      data: savedTest,
    });


  } catch (error) {
    console.error('Error fetching random questions:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch random questions'
    });
  }
}



/**
 * @route POST v1/user/practice/start
 * @desc Start practice test 
 * @access User
 */
export async function StartPractice(req, res) {
  try {
    // Get the filters and count from query parameters
    const { testid } = req.body;
    const userid = req.user._id;

    const test = await Tests.findById(testid);

    // console.log(test.userid.toString())

    if (!test || test.userid.toString() !== req.user._id.toString()) {
      // console.log('Test not found');
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }

    const currentTime = new Date();
    const durationInMinutes = test.duration; // The duration is already stored in the test document
    const endTime = new Date(currentTime.getTime() + durationInMinutes * 60000); // Add duration to current time

    // Update the test document with the new start and end times
    const updatedTest = await Tests.findByIdAndUpdate(
      testid,
      {
        startTime: currentTime,
        endTime: endTime
      },
      {
        new: true, // Returns the updated document
        runValidators: true // Ensures that the document adheres to schema validation rules
      }
    );

    // console.log('start Test:', updatedTest);


    res.json({
      status: true,
      code: 200,
      message: "Test started successfully",
      data: updatedTest,
    });


  } catch (error) {
    console.error('Error start Test:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to start test'
    });
  }
}


/**
 * @route Delete v1/user/practice/delete
 * @desc Delete practice test 
 * @access User
 */
export async function DeletePractice(req, res) {
  try {
    // Get the filters and count from query parameters
    const { testid } = req.body;

    const test = await Tests.deleteOne({ _id: testid });

    res.json({
      status: true,
      code: 200,
      message: "Test deleted successfully",
      // data: [test],
    });


  } catch (error) {
    console.error('Error in deleting Test:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to delete test'
    });
  }
}



/**
 * @route POST v1/user/practice/saveresponse
 * @desc Save user Response / Answer to question. 
 * @access User
 */
export async function SaveResponse(req, res) {
  const { testId, questionId, answer } = req.body;
  try {
    // Find the test by its ID
    const test = await Tests.findById(testId);
    if (!test || test.userid.toString() !== req.user._id.toString()) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }
    if (test.endTime <= new Date() || test.isEnded) {
      test.isEnded = true;
      await test.save();
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test Ended'
      });
    }

    // Find the question in the test
    const questionIndex = test.testQuestions.findIndex(q => q._id.toString() === questionId);

    if (questionIndex === -1) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Question not found'
      });
    }

    const question = test.testQuestions[questionIndex];
    const options = Object.values(question.options); // Extract options keys as an array

    if (!isSubset(new Set(answer), new Set(options))) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: 'Invalid Answer'
      });
    }

    // Save the user's answer in the question's `userAnswer` field
    test.testQuestions[questionIndex].userAnswer = answer;
    // Save the updated test document
    await test.save();


    res.json({
      status: true,
      code: 200,
      message: 'Response saved successfully',
    });
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({
      status: false,
      code: 500,
      message: 'Failed to save response'
    });
  }
}

/**
 * @route POST v1/user/practice/submittest
 * @desc Submit Practice Test. 
 * @access User
 */
export async function SubmitTest(req, res) {
  const { testId } = req.body;
  const userid = req.user._id;
  try {
    // Find the test by its ID
    const test = await Tests.findById(testId);
    if (!test || test.userid.toString() !== req.user._id.toString()) {
      // console.log(test.userid)
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }
    // if (test.endTime <= new Date() || test.isEnded) {
    //   test.isEnded = true;
    //   await test.save(); 
    //   return res.status(200).json({
    //     status: false,
    //     code: 200,
    //     error: 'Test Already Ended'
    //   });
    // }

    test.isEnded = true;

    // start evaluation 
    let score = 0;
    const evaluationResults = [];

    for (const testquestion of test.testQuestions) {
      const question = await Questions.findById(testquestion._id);
      if (!question) {
        // evaluationResults.push({ questionId: answer.questionId, message: "Question not found" });
        continue;
      }


      switch (question.questionType) {
        case "MSQ":
          const thisScore = CalculateMSQ(new Set(question.correctAnswers), new Set(testquestion.userAnswer));
          score += thisScore;
          evaluationResults.push({
            _id: question._id,
            category: question.category,
            question: question.question,
            options: question.options,
            questionType: question.questionType,
            difficultyLevel: question.difficultyLevel,
            userAnswer: testquestion.userAnswer,
            correctAnswers: question.correctAnswers,
            justifications: question.justifications,
            score: thisScore,
          });
          break;
        case "MCQ":
        case "Boolean":
        default:

          if (question.correctAnswers[0] === testquestion.userAnswer[0] && !testquestion.userAnswer[1] && !testquestion.userAnswer[2] && !testquestion.userAnswer[3]) {
            score += 1;
            evaluationResults.push({
              _id: question._id,
              category: question.category,
              question: question.question,
              options: question.options,
              questionType: question.questionType,
              difficultyLevel: question.difficultyLevel,
              userAnswer: testquestion.userAnswer,
              correctAnswers: question.correctAnswers,
              justifications: question.justifications,
              score: 1,
            });
          } else {
            evaluationResults.push({
              _id: question._id,
              category: question.category,
              question: question.question,
              options: question.options,
              questionType: question.questionType,
              difficultyLevel: question.difficultyLevel,
              userAnswer: testquestion.userAnswer,
              correctAnswers: question.correctAnswers,
              justifications: question.justifications,
              score: 0,
            });
          }
          break;
      }
    }
    score = Math.trunc(score * 100) / 100;

    // console.log(evaluationResults);

    const report = new Reports({
      userid,
      testname: test.testname,
      testid: test._id,
      category: test.category,
      difficulty: test.difficulty,
      questions: test.questions,
      duration: test.duration,
      testQuestions: evaluationResults,
      createdAt: test.createdAt,
      endTime: test.endTime,
      score,
      startTime: test.startTime,
    });

    test.deleteOne();

    const details = {
      testname: test.testname,
      category: test.category,
      difficulty: test.difficulty,
      questions: test.questions,
      duration: test.duration,
      score
    };
    await logNotification(req.user, "Test Completed.", details, "info");

    const savedReport = await report.save();
    res.json({
      status: true,
      code: 200,
      message: 'Test Submitted successfully',
      data: {
        reportid: savedReport._id,
        testname: savedReport.testname,
        category: savedReport.category,
        testid: savedReport.testid,
        difficulty: savedReport.difficulty,
        questions: savedReport.questions,
        duration: savedReport.duration,
        score: savedReport.score,
        createdAt: savedReport.createdAt,
        endTime: savedReport.endTime,
        submitTime: savedReport.submitTime,
        startTime: savedReport.startTime,
      },
    });
  } catch (error) {
    console.error("Error Submitting Test :", error);
    res.status(500).json({
      status: false,
      code: 500,
      message: 'Failed to submit test'
    });
  }
}

/**
 * @route GET v1/user/practice/listongoing
 * @desc List ongoing practice tests
 * @access User
 */
export async function ListOngoingPracticeTests(req, res) {
  try {


    const tests = await Tests.find({ endTime: { $gte: ongoingDuration }, userid: req.user._id })
      .select('_id category testname difficulty questions duration createdAt endTime isEnded').sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: tests,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching ongoing tests:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch ongoing tests'
    });
  }
}

/**
 * @route GET v1/user/dashboard
 * @desc Get Dashboard Data for user
 * @access User
 */
export async function Dashboard(req, res) {
  try {
    // Use MongoDB aggregation to calculate counts
    const stats = await Tests.aggregate([
      {
        $match: {
          userid: req.user._id, // Filter by the provided userId
        },
      },
      {
        $facet: {
          activeCount: [
            { $match: { endTime: { $gt: new Date() } } },
            { $count: "total" },
          ],
          ongoing: [
            { $match: { endTime: { $gte: ongoingDuration, $lte: new Date() }, isEnded: false } },
            { $count: "total" },
          ],
          completed: [
            { $match: { endTime: { $lte: new Date() }, isEnded: true } },
            { $count: "total" },
          ],
          // Count of all tests
          totalCount: [
            { $count: "total" },
          ],
        },
      },
    ]);

    const stats2 = await Reports.aggregate([
      {
        $match: {
          userid: req.user._id,
        },
      },
      {
        $facet: {
          completed: [
            { $match: { endTime: { $lte: new Date() }, isEnded: true } },
            { $count: "total" },
          ],
        },
      },
    ]);

    const stats3 = await Reports.find({ userid: req.user._id })
      .sort({ createdAt: -1 })
      .select("questions score")
      .limit(7);

    // console.log(stats3);

    // Extract counts from the stats array
    const result = {
      active: stats[0]?.activeCount[0]?.total || 0,
      ongoing: stats[0]?.ongoing[0]?.total || 0,
      completed: stats2[0]?.completed[0]?.total || 0,
      total: stats[0]?.totalCount[0]?.total + stats2[0]?.completed[0]?.total || 0,
      graph: stats3,
    };
    // Return the counts as a response
    res.json({
      success: true,
      status: 200,
      data: { testStats: result }
    });
  } catch (error) {
    console.error("Error fetching question stats:", error);
    res.status(500).json({
      status: 500,
      success: false,
      error: "Internal Server Error"
    });
  }
}


/**
 * @route GET v1/user/practice/reports
 * @desc List reports of practice tests
 * @access User
 */
export async function ListReports(req, res) {
  try {


    const reports = await Reports.find({ userid: req.user._id }).sort({ submitTime: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: reports,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch reports'
    });
  }
}


/**
 * @route GET v1/user/notifications
 * @desc Get list of notifications
 * @access User
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user._id;

    const notifications = await Notifications.find({ user: userId })
      .sort({ createdAt: -1 }) // Sort by latest notifications
      .limit(50); // Limit results for performance

    res.status(200).json({
      status: true,
      code: 200,
      message: "Notifications fetched successfully.",
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
      data: [],
    });
  }
}

/**
 * @route GET v1/user/notifications/unread-count
 * @desc Get list of notifications
 * @access User
 */
export async function getNotificationsUnreadCount(req, res) {
  try {
    // Count unread notifications for the user
    const unreadCount = await Notifications.countDocuments(
      { user: req.user._id, read: false }
    );
    // Return the count
    return res.status(200).json({
      status: true,
      code: 200,
      message: "Unread notifications count fetched successfully.",
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}

/**
 * @route POST v1/user/notifications/mark-read
 * @desc Mark Notifications as read
 * @access User
 */
export async function markNotificationsAsRead(req, res) {
  try {
    const userId = req.user._id;
    const { ids } = req.body; // Array of notification IDs to mark as read

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: "Notification IDs are required.",
      });
    }

    await Notifications.updateMany(
      { _id: { $in: ids }, user: userId },
      { $set: { read: true } }
    );

    res.status(200).json({
      status: true,
      code: 200,
      message: "Notifications marked as read.",
    });
  } catch (err) {
    console.error("Error marking notifications as read:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}

/**
 * @route DELETE v1/user/notifications/delete_read
 * @desc Mark Notifications as read
 * @access User
 */
export async function deleteReadNotifications(req, res) {
  try {
    const userId = req.user._id;

    await Notifications.deleteMany(
      { user: userId, read: true }
    );

    res.status(200).json({
      status: true,
      code: 200,
      message: "Read notifications deleted.",
    });
  } catch (err) {
    console.error("Error deleting read notifications:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}


/**
 * @route GET v1/user/personal-details
 * @desc Mark Notifications as read
 * @access User
 */
export async function PersonalDetails(req, res) {
  try {
    const userId = req.user._id;

    const data = {
      username: req.user.username,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      address: req.user.address,
      country: req.user.country,
      state: req.user.state,
      city: req.user.city,
      zipcode: req.user.zipcode,
      phonenumber: req.user.phonenumber,
    }

    res.status(200).json({
      status: true,
      code: 200,
      message: "Success",
      data
    });
  } catch (err) {
    console.error("Error fetching personal deatils:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}

/**
 * @route POST v1/user/personal-details
 * @desc Mark Notifications as read
 * @access User
 */
export async function UpdatePersonalDetails(req, res) {
  try {
    const userId = req.user._id;

    const { first_name, last_name, address, country, state, city, zipcode, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        first_name, last_name, address, country, state, city, zipcode, phonenumber: phone
      },
      {
        new: true, // Returns the updated document
        runValidators: true // Ensures that the document adheres to schema validation rules
      }
    );
    res.status(200).json({
      status: true,
      code: 200,
      message: "Success",
    });
  } catch (err) {
    console.error("Error updating personal deatils:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}

/**
 * @route POST v1/user/update-password
 * @desc Mark Notifications as read
 * @access User
 */
export async function UpdatePassword(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("+password");

    const { password, newpassword, confirmpassword } = req.body;
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );
    // if not valid, return unathorized response
    if (!isPasswordValid) {
      return res.status(200).json({
        status: false,
        code: 401,
        data: [],
        message:
          "Invalid password.",
      });
    }
    if (newpassword !== confirmpassword) {
      return res.status(200).json({
        status: false,
        code: 401,
        data: [],
        message:
          "new password and Confirm Password dosen't match.",
      });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newpassword, salt);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      status: true,
      code: 200,
      message: "Success",
    });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({
      status: false,
      code: 500,
      message: "Internal Server Error",
    });
  }
}

/**
 * @route GET v1/user/all-certifications
 * @desc Get all certifications list.
 * @access User
 */
export async function GetAllCertifications(req, res) {
  try {

    const distinctCertifications = await Certification.find({ isActive: true });

    res.status(200).json({
      status: true,
      code: 200,
      data: distinctCertifications,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching Certifications:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch Certifications'
    });
  }
}

/**
 * @route POST v1/user/certification/initiate-payment
 * @desc Initiates payment process.
 * @access User
 */
export async function InitiatePayment(req, res) {
  try {
    const userId = req.user._id;
    const { certificationId, amount } = req.body;
    const numericAmount = Number(amount);

    const certificationData = await Certification.findById(certificationId);
    if (numericAmount !== certificationData.price) {
      return res.status(200).json({
        status: false,
        code: 400,
        data: [],
        message: 'Invalid Amout error'
      });
    }

    const options = {
      amount: 750 * 100, // Convert amount to paise
      currency: "INR",
      receipt: `order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    // Save payment record
    const payment = new Payment({
      userId,
      certificationId,
      paymentFor: certificationData.certificationId + ": " + certificationData.certificationName,
      amount,
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      razorpayOrder: order
    });
    await payment.save();

    res.json({
      status: true,
      code: 200,
      message: "success",
      data: { ...order, phonenumber: req.user.phonenumber }
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: false,
      code: 200,
      message: "Failed to initiate payment."
    });
  }
}

/**
 * @route POST v1/user/certification/verify-payment
 * @desc Verifies User Payment.
 * @access User
 */
export async function VerifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(200).json({
        code: 400,
        status: false,
        message: "Invalid Order ID"
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(200).json({
        code: 400,
        status: false,
        message: "Invalid Payment Signature"
      });
    }

    // Update payment status
    payment.paymentStatus = 'completed';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.completedAt = new Date();
    await payment.save();

    await logNotification(req.user, "Payment Successfull.", { paymentFor: payment.paymentFor, amount: payment.amount }, "info");

    // Grant access to certification
    const userCert = await UserCertification.findOne({ userId: payment.userId, certificationId: payment.certificationId });
    const cert = await Certification.findById({ _id: payment.certificationId });
    if (userCert) {
      userCert.attemptLimit += 1;
      await userCert.save();
    } else {
      const currentDate = new Date();
      const validtill = new Date();
      validtill.setDate(currentDate.getDate() + 180);
      const userCert = new UserCertification({
        userId: payment.userId,
        certification_id: payment.certificationId,
        certificationId: cert.certificationId,
        validTill: validtill
      });
      await userCert.save();
    }

    res.json({
      code: 200,
      status: true,
      message: "Payment Verified"
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: 500,
      status: false,
      message: "Payment verification Failed."
    });
  }
}

/**
 * @route GET v1/user/certification/list
 * @desc List User's Bought Certification attempts
 * @access User
 */
export async function ListUserCertifications(req, res) {
  try {
    const certificationTests = await UserCertification.find({ userId: req.user._id })
      .select('_id certificationId attemptsUsed purchaseDate validTill').sort({ updatedAt: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: certificationTests,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching ongoing tests:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch ongoing tests'
    });
  }
}

/**
 * @route POST v1/user/certification/schedule
 * @desc Schedule Certification test 
 * @access User
 */
export async function ScheduleCertification(req, res) {
  try {
    const { certification, startDateTime } = req.body;
    const questions = 150;
    const duration = 240;
    const testname = req.user.username + "_" + certification + "_" + Date.now();
    const userid = req.user._id;

    const userCert = await UserCertification.findOne({ userId: userid, certificationId: certification });

    if (!userCert) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: "Certification not purchased"
      });
    }

    // console.log(new Date(userCert.validTill), new Date(), new Date(userCert.validTill) >= new Date())
    if (new Date(userCert.validTill) <= new Date()) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: "Certification Validity Expired. Please Renew."
      });
    }

    const matchFilter = {};

    matchFilter.certification = certification;


    // Use aggregation with $match, $sample, and $project
    const randomQuestions = await CertificationQuestions.aggregate([
      { $match: matchFilter }, // Apply filtering
      { $sample: { size: questions } }, // Random sampling
      {
        $project: {
          _id: 1,
          category: 1,
          question: 1,
          options: 1,
          questionType: 1,
          difficultyLevel: 1,
        },
      },
    ]);

    if (randomQuestions.length === 0) {
      return res.status(200).json({
        status: false,
        code: 4001,
        data: [],
        message: "Error 4001 Scheduling Certification Test."
      });
    } else if (randomQuestions.length < questions) {
      return res.status(200).json({
        status: false,
        code: 4002,
        data: [],
        message: "Error 4002 Scheduling Certification Test."
      });
    }

    const scheduledAt = new Date();
    const startTime = new Date(startDateTime);
    if (isNaN(startTime)) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: "Invalid date format"
      });
    }
    const scheduledFor = startTime;
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    const test = new CertificationTests({
      userid, certificationname: certification, testname,
      questions, duration,
      testQuestions: randomQuestions,
      scheduledAt, scheduledFor,
      startTime, endTime
    });

    const savedTest = await test.save();
    console.log("Test Scheduled for " + req.user.username + " " + savedTest._id);
    // const { testQuestions, isEnded, __v, userid: userid2, endTime: endTime2, ...savedTest } = (await test.save()).toObject();

    userCert.attemptsUsed++;
    await userCert.save();
    const r = await User.updateOne({ _id: userid }, { $inc: { 'certTestCount': 1 } });

    res.json({
      status: true,
      code: 200,
      message: "Test generated successfully",
      // data: savedTest,
      data: []
    });


  } catch (error) {
    console.error('Error Scheduling Certification Test:', error);
    res.status(200).json({
      status: false,
      code: 500,
      data: [],
      message: 'Error Scheduling Certification Test.'
    });
  }
}

/**
 * @route GET v1/user/certification/listscheduled
 * @desc List User's Bought Certification attempts
 * @access User
 */
export async function ListUserScheduledCertifications(req, res) {
  try {
    const certificationTests = await CertificationTests.find({ userid: req.user._id })
      .select('_id certificationId certificationname scheduledAt scheduledFor duration startTime').sort({ scheduledFor: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: certificationTests,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching scheduled tests:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch scheduled tests'
    });
  }
}

/**
 * @route POST v1/user/certification/start
 * @desc Start practice test 
 * @access User
 */
export async function StartCertification(req, res) {
  try {
    // Get the filters and count from query parameters
    const { testid } = req.body;
    const userid = req.user._id;

    const test = await CertificationTests.findById(testid);

    if (!test || test.userid.toString() !== userid.toString()) {
      // console.log('Test not found');
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }

    const currentTime = new Date();
    const scheduledTime = new Date(test.scheduledFor)
    const timeDiff = scheduledTime - currentTime;
    // console.log("Scheduled For:", scheduledTime);
    // console.log("Current Time:", currentTime);
    // console.log("Time Difference (ms):", timeDiff);

    const THIRTY_MINUTES = 30 * 60 * 1000;

    const durationInMinutes = test.duration;

    // console.log(test.status);

    if (test.status === 'Unattempted') {
      console.log("Error: Can't start. Scheduled time was more than 30 minutes ago.");
      return res.status(200).json({
        status: false,
        code: 404,
        message: "Error: Can't start. Scheduled time was more than 30 minutes ago."
      });
    } else if (test.status === "Not Started") {
      // Convert time difference to days, hours, minutes, seconds
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      return res.status(200).json({
        status: false,
        code: 404,
        message: `Can't start yet. Time remaining: ${days}d ${hours}h ${minutes}m ${seconds}s`
      });
    } else if (test.status === "Active") {
      console.log("Start allowed!");

      const endTime = new Date(currentTime.getTime() + durationInMinutes * 60000);

      // Update the test document with the new start and end times
      const updatedTest = await CertificationTests.findByIdAndUpdate(
        testid,
        {
          startTime: currentTime,
          endTime: endTime
        },
        {
          new: true, // Returns the updated document
          runValidators: true // Ensures that the document adheres to schema validation rules
        }
      );
      // console.log('start Test:', updatedTest);


      res.json({
        status: true,
        code: 200,
        message: "Test started successfully",
        data: updatedTest,
      });
    } else if (test.status === "Ongoing") {
      console.log("Continuing Test!");

      const endTime = new Date(currentTime.getTime() + durationInMinutes * 60000);

      // Update the test document with the new start and end times
      const updatedTest = await CertificationTests.findById(testid);
      // console.log('start Test:', updatedTest);


      res.json({
        status: true,
        code: 200,
        message: "Test started successfully",
        data: updatedTest,
      });
    }




  } catch (error) {
    console.error('Error start Test:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to start test'
    });
  }
}

/**
 * @route POST v1/user/certification/saveresponse
 * @desc Save user Response / Answer to question. 
 * @access User
 */
export async function SaveCertificationResponse(req, res) {
  const { testId, questionId, answer } = req.body;
  try {
    // Find the test by its ID
    const test = await CertificationTests.findById(testId);
    if (!test || test.userid.toString() !== req.user._id.toString()) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }
    if (test.endTime <= new Date() || test.isEnded) {
      test.isEnded = true;
      await test.save();
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test Ended'
      });
    }

    // Find the question in the test
    const questionIndex = test.testQuestions.findIndex(q => q._id.toString() === questionId);

    if (questionIndex === -1) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Question not found'
      });
    }

    const question = test.testQuestions[questionIndex];
    const options = Object.values(question.options); // Extract options keys as an array

    if (!isSubset(new Set(answer), new Set(options))) {
      return res.status(200).json({
        status: false,
        code: 400,
        message: 'Invalid Answer'
      });
    }

    // Save the user's answer in the question's `userAnswer` field
    test.testQuestions[questionIndex].userAnswer = answer;
    // Save the updated test document
    await test.save();


    res.json({
      status: true,
      code: 200,
      message: 'Response saved successfully',
    });
  } catch (error) {
    console.error("Error saving response:", error);
    res.status(500).json({
      status: false,
      code: 500,
      message: 'Failed to save response'
    });
  }
}

/**
 * @route POST v1/user/certification/submittest
 * @desc Submit certification Test. 
 * @access User
 */
export async function SubmitCertificationTest(req, res) {
  const { testId } = req.body;
  const userid = req.user._id;
  try {
    // Find the test by its ID
    const test = await CertificationTests.findById(testId);
    if (!test || test.userid.toString() !== req.user._id.toString()) {
      // console.log(test.userid)
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Test not found'
      });
    }
    // if (test.endTime <= new Date() || test.isEnded) {
    //   test.isEnded = true;
    //   await test.save(); 
    //   return res.status(200).json({
    //     status: false,
    //     code: 200,
    //     error: 'Test Already Ended'
    //   });
    // }

    test.isEnded = true;

    // start evaluation 
    let score = 0;
    const evaluationResults = [];

    for (const testquestion of test.testQuestions) {
      const question = await CertificationQuestions.findById(testquestion._id);
      if (!question) {
        // evaluationResults.push({ questionId: answer.questionId, message: "Question not found" });
        continue;
      }


      switch (question.questionType) {
        case "MSQ":
          const thisScore = CalculateMSQ(new Set(question.correctAnswers), new Set(testquestion.userAnswer));
          score += thisScore;
          evaluationResults.push({
            _id: question._id,
            category: question.category,
            question: question.question,
            options: question.options,
            questionType: question.questionType,
            difficultyLevel: question.difficultyLevel,
            userAnswer: testquestion.userAnswer,
            correctAnswers: question.correctAnswers,
            justifications: question.justifications,
            score: thisScore,
          });
          break;
        case "MCQ":
        case "Boolean":
        default:

          if (question.correctAnswers[0] === testquestion.userAnswer[0] && !testquestion.userAnswer[1] && !testquestion.userAnswer[2] && !testquestion.userAnswer[3]) {
            score += 1;
            evaluationResults.push({
              _id: question._id,
              category: question.category,
              question: question.question,
              options: question.options,
              questionType: question.questionType,
              difficultyLevel: question.difficultyLevel,
              userAnswer: testquestion.userAnswer,
              correctAnswers: question.correctAnswers,
              justifications: question.justifications,
              score: 1,
            });
          } else {
            evaluationResults.push({
              _id: question._id,
              category: question.category,
              question: question.question,
              options: question.options,
              questionType: question.questionType,
              difficultyLevel: question.difficultyLevel,
              userAnswer: testquestion.userAnswer,
              correctAnswers: question.correctAnswers,
              justifications: question.justifications,
              score: 0,
            });
          }
          break;
      }
    }
    score = Math.trunc(score * 100) / 100;

    // console.log(evaluationResults);

    const report = new CertificationReports({
      userid,
      certificationname: test.certificationname,
      testname: test.testname,
      testid: test._id,
      category: test.category,
      difficulty: test.difficulty,
      questions: test.questions,
      duration: test.duration,
      testQuestions: evaluationResults,
      scheduledAt: test.scheduledAt,
      scheduledFor: test.scheduledFor,
      startTime: test.startTime,
      endTime: test.endTime,
      score,
    });

    test.deleteOne();

    const details = {
      testname: test.testname,
      category: test.category,
      difficulty: test.difficulty,
      questions: test.questions,
      duration: test.duration,
      score
    };
    await logNotification(req.user, "Certification Test Completed.", details, "info");

    const savedReport = await report.save();
    res.json({
      status: true,
      code: 200,
      message: 'Test Submitted successfully',
      data: {
        reportid: savedReport._id,
        testname: savedReport.testname,
        category: savedReport.category,
        testid: savedReport.testid,
        difficulty: savedReport.difficulty,
        questions: savedReport.questions,
        duration: savedReport.duration,
        score: savedReport.score,
        createdAt: savedReport.createdAt,
        endTime: savedReport.endTime,
        submitTime: savedReport.submitTime,
        startTime: savedReport.startTime,
      },
    });
  } catch (error) {
    console.error("Error Submitting Test :", error);
    res.status(500).json({
      status: false,
      code: 500,
      message: 'Failed to submit test'
    });
  }
}

/**
 * @route GET v1/user/certification/reports
 * @desc List reports of certification tests
 * @access User
 */
export async function ListCertificationReports(req, res) {
  try {


    const reports = await CertificationReports.find({ userid: req.user._id }).sort({ submitTime: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: reports,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch reports'
    });
  }
}

/**
 * @route GET v1/user/payment/history
 * @desc List all user initiated payments
 * @access User
 */
export async function PaymentHistory(req, res) {
  try {


    const payments = await Payment.find({ userId: req.user._id })
      .select(" _id amount paymentStatus completedAt createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: payments,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch payments'
    });
  }
}

/**
 * @route POST v1/user/payment/requestrefund
 * @desc initiated payments refund
 * @access User
 */
export async function RequestRefund(req, res) {
  try {
    const { paymentId, message } = req.body;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Payment Data not found.'
      });
    }
    if (payment.refundStatus !== 'NA') {
      return res.status(200).json({
        status: false,
        code: 403,
        message: 'Refund process is already initiated or completed.'
      });
    }

    if (payment.paymentStatus !== 'completed') {
      return res.status(200).json({
        status: false,
        code: 403,
        message: 'Payment Status is not completed.'
      });
    }

    payment.set({
      refundStatus: 'refund-initiated',
      refundInitiatedAt: new Date(),
      refundMessage: message,
    })

    // console.log(payment);
    payment.save();

    res.status(200).json({
      status: true,
      code: 200,
      data: payment,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch payments'
    });
  }
}

/**
 * @route GET v1/user/payment/refundhistory
 * @desc List all user initiated refunds
 * @access User
 */
export async function RefundHistory(req, res) {
  try {


    const payments = await Payment.find({ userId: req.user._id, refundStatus: { $ne: "NA" } })
      .select(" _id amount certificationId paymentStatus createdAt updatedAt  refundStatus refundInitiatedAt refundDetails refundMessage refundedAt ")
      .sort({ refundInitiatedAt: -1 });

    res.status(200).json({
      status: true,
      code: 200,
      data: payments,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch payments'
    });
  }
}

/**
 * @route POST v1/user/subscription/initiate-payment
 * @desc Initiates subscription payment process.
 * @access User
 */
export async function SubscriptionInitiatePayment(req, res) {
  try {
    const userId = req.user._id;
    const { plan, amount } = req.body;
    const numericAmount = Number(amount);

    if (!(numericAmount == 550 && plan === "Plan1") && !(numericAmount == 750 && plan === "Plan2")) {
      return res.status(200).json({
        status: false,
        code: 400,
        data: [],
        message: 'Invalid Plan error'
      });
    }

    // console.log(amount, plan);
    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: `order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    // Save payment record
    const payment = new Payment({
      userId,
      certificationId: null,
      paymentFor: plan,
      amount,
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      razorpayOrder: order
    });
    await payment.save();

    res.json({
      status: true,
      code: 200,
      message: "success",
      data: { ...order, phonenumber: req.user.phonenumber }
    });
  } catch (error) {
    console.error(error)
    res.status(500).json({
      status: false,
      code: 200,
      message: "Failed to initiate payment."
    });
  }
}

/**
 * @route POST v1/user/subscription/verify-payment
 * @desc Verifies User Payment.
 * @access User
 */
export async function SubscriptionVerifyPayment(req, res) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });

    if (!payment) {
      return res.status(200).json({
        code: 400,
        status: false,
        message: "Invalid Order ID"
      });
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(200).json({
        code: 400,
        status: false,
        message: "Invalid Payment Signature"
      });
    }

    // Update payment status
    payment.paymentStatus = 'completed';
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.completedAt = new Date();
    await payment.save();

    await logNotification(req.user, "Payment Successfull.", { paymentFor: payment.paymentFor, amount: payment.amount }, "info");

    // Grant access to certification
    const user = await User.findById(req.user._id);
    // if (payment.certificationId === "Plan1" || payment.paymentFor === "Plan1") {
    //   user.plan = 1;
    // } else if (payment.certificationId === "Plan2" || payment.paymentFor === "Plan1") {
    //   user.plan = 2;
    // }
    user.planDetails = {
      planName: payment.paymentFor,
      price: payment.amount,
      purchaseDate: Date.now(),
      activeTill: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
    };
    const saveduser = await user.save();

    res.json({
      code: 200,
      status: true,
      message: "Payment Verified",
      data: saveduser,
    });
  } catch (error) {
    console.error(error);
    res.status(200).json({
      code: 500,
      status: false,
      message: "Payment verification Failed."
    });
  }
}

/**
 * @route GET v1/user/subscription
 * @desc List user subscription
 * @access User
 */
export async function UserSubscription(req, res) {
  try {

    res.status(200).json({
      status: true,
      code: 200,
      data: req.user.planDetails,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch data'
    });
  }
}

/**
 * @route GET v1/user/invoicedata
 * @desc get invoicedata to print invoice
 * @access User
 */
export async function InvoiceData(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'ID is required.'
      });
    }

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'Invoice Data not found'
      });
    }
    if (payment.paymentStatus !== "completed") {
      return res.status(200).json({
        status: false,
        code: 404,
        message: "can't get invoice for incomplete payment"
      });
    }
    let paymentName;
    if (payment.paymentFor !== "Plan1" && payment.paymentFor !== "Plan2") {
      paymentName = "Certificate Plan | " + payment.paymentFor;
    } else {
      paymentName = "Data Retention | " + payment.paymentFor;
    }

    const printData = {
      invoiceId: payment._id,
      solddatetime: payment.completedAt,
      userId: req.user.username,
      firstName: req.user.first_name + " " + req.user.last_name,
      address: req.user.address + req.user.city + req.user.state + req.user.country || "Not Provide by user.",
      zipCode: req.user.zipCode,
      phoneNumber: req.user.phonenumber,
      paymentName,
      price: payment.amount,
    }

    res.status(200).json({
      status: true,
      code: 200,
      data: printData,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching invoicedata:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch invoicedata'
    });
  }
}

/**
 * @route Put v1/user/professional-name
 * @desc Adds users Professional Name
 * @access User
 */
export async function AddUserProfessionalName(req, res) {
  try {
    const { name } = req.body;

    const userPname = await UserProfessionalNames.findOne({ userid: req.user._id });
    if (userPname) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: "Can't update name. contact admin."
      });
    }

    const newUserPname = UserProfessionalNames({
      userid: req.user._id,
      userProfessionalName: name,
    })

    await newUserPname.save();


    res.status(200).json({
      status: true,
      code: 200,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error adding Data:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to put Data'
    });
  }
}

/**
 * @route GET v1/user/professional-name
 * @desc Get user professional-name
 * @access User
 */
export async function GetUserProfessionalName(req, res) {
  try {

    const userPname = await UserProfessionalNames.findOne({ userid: req.user._id });

    res.status(200).json({
      status: true,
      code: 200,
      data: userPname ? userPname.userProfessionalName : "",
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch data'
    });
  }
}

/**
 * @route GET v1/user/certificatedata
 * @desc get invoicedata to print invoice
 * @access User
 */
export async function CertificateData(req, res) {
  try {
    const { id } = req.query;

    console.log(id);

    if (!id) {
      return res.status(200).json({
        status: false,
        code: 404,
        message: 'ID is required.'
      });
    }

    const issuedCertificate = await CertificatesIssued.findOne({ reportId: id });
    if (issuedCertificate) {
      return res.status(200).json({
        status: true,
        code: 200,
        data: issuedCertificate,
        message: 'Success'
      });
    }

    const report = await CertificationReports.findById(id)
      .select("_id score questions submitTime certificationname")

    const userPname = await UserProfessionalNames.findOne({ userid: req.user._id });

    if (!userPname) {
      return res.status(200).json({
        status: false,
        code: 4003,
        message: 'Professional Name not provided. please update professional name from accout settings'
      });
    }

    const certificationDetails = await Certification.findOne({ certificationId: report.certificationname });

    const issueNewCertifcate = CertificatesIssued({
      reportId: report._id,
      certificationName: "C | " + certificationDetails.certificationId + " - " + certificationDetails.certificationName,
      userProfessionalName: userPname.userProfessionalName,
      score: parseFloat(((report.score / report.questions) * 100).toFixed(2)),
      issueDate: report.submitTime,
      uniqueCode: report._id,
    });

    // if(report.score / report.questions < 60){
    //   return res.status(200).json({
    //     status: false,
    //     code: 404,
    //     message: "can't generate certification for score less than 60%"
    //   });
    // }

    const newIssuedCertificate = await issueNewCertifcate.save()

    res.status(200).json({
      status: true,
      code: 200,
      data: newIssuedCertificate,
      message: 'Success'
    });

  } catch (error) {
    console.error('Error fetching Data:', error);
    res.status(500).json({
      status: false,
      code: 500,
      data: [],
      message: 'Failed to fetch Data'
    });
  }
}