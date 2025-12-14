const Payment = require("../models/Payment");
const Enrollment = require("../models/Tbl_Enrollments");
const {
  razorpayInstance,
  isRazorpayConfigured,
  demoKeyId,
} = require("../config/razorpay");
const crypto = require("crypto");
const Students = require("../models/Tbl_Students");
const User = require("../models/User");

/**
 * Create Razorpay Order
 * POST /api/payments/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      amount,
      type,
      studentName,
      studentEmail,
      courseName,
    } = req.body;

    // Validate input
    if (!studentId || !courseId || !amount || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: studentId, courseId, amount, type",
      });
    }

    // Fetch real student data from database
    let realStudentName = studentName || "";
    let realStudentEmail = studentEmail || "";

    try {
      const mongoose = require("mongoose");
      const isValidObjectId = mongoose.Types.ObjectId.isValid(studentId);

      if (isValidObjectId) {
        // First, try to find student in Tbl_Students by User_Id (if studentId is User_Id)
        const student = await Students.findOne({ User_Id: studentId }).populate(
          "User_Id",
          "email"
        );

        if (student) {
          realStudentName = student.Full_Name || studentName || "Student";
          realStudentEmail = student.User_Id?.email || studentEmail || "";
          console.log("✅ Fetched student from Tbl_Students:", realStudentName);
        } else {
          // If not found, try finding by _id directly in Students table
          const studentById = await Students.findById(studentId).populate(
            "User_Id",
            "email"
          );

          if (studentById) {
            realStudentName = studentById.Full_Name || studentName || "Student";
            realStudentEmail = studentById.User_Id?.email || studentEmail || "";
            console.log("✅ Fetched student by ID:", realStudentName);
          } else {
            // Last resort: fetch from User table
            const user = await User.findById(studentId);
            if (user) {
              realStudentEmail = user.email || studentEmail || "";
              realStudentName = user.name || studentName || "Student";
              console.log("✅ Fetched from User table:", realStudentName);
            } else {
              console.log(
                "⚠️  Student not found in database, using provided data"
              );
            }
          }
        }
      } else {
        console.log(
          "ℹ️  studentId is not a valid ObjectId, skipping DB lookup (Guest/Custom ID)"
        );
      }
    } catch (dbError) {
      console.warn(
        "⚠️  Error fetching student from database:",
        dbError.message
      );
      console.warn("   Using provided student data as fallback");
    }

    // Generate unique receipt number
    const receiptNo = `IVY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let razorpayOrder;

    // Check if Razorpay is configured
    if (!isRazorpayConfigured) {
      // DEMO MODE - Create simulated order for testing
      console.log("\n🎭 DEMO MODE: Creating simulated payment order");
      console.log("   Student: " + realStudentName);
      console.log("   Course: " + (courseName || "N/A"));
      console.log("   Amount: ₹" + amount);
      console.log("   Receipt: " + receiptNo + "\n");

      razorpayOrder = {
        id: `order_DEMO_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: receiptNo,
        status: "created",
        created_at: Math.floor(Date.now() / 1000),
      };
    } else {
      // Create real Razorpay order
      const orderOptions = {
        amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
        currency: "INR",
        receipt: receiptNo,
        notes: {
          studentId,
          courseId,
          courseName: courseName || "Course",
        },
      };

      try {
        razorpayOrder = await razorpayInstance.orders.create(orderOptions);
      } catch (razorpayError) {
        console.error("Razorpay API error:", razorpayError);
        return res.status(500).json({
          success: false,
          message:
            "Razorpay order creation failed. Please check your API keys.",
          error: razorpayError.message,
          hint: "Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env file",
        });
      }
    }

    // Save payment record in MongoDB with PENDING status
    const payment = new Payment({
      studentId,
      courseId,
      amount,
      type,
      receiptNo,
      orderId: razorpayOrder.id,
      status: "PENDING",
      studentName: realStudentName,
      studentEmail: realStudentEmail,
      courseName: courseName || "",
    });

    await payment.save();

    // Return order details to frontend
    res.status(200).json({
      success: true,
      message: isRazorpayConfigured
        ? "Order created successfully"
        : "DEMO order created (configure Razorpay for real payments)",
      demoMode: !isRazorpayConfigured,
      data: {
        orderId: razorpayOrder.id,
        receiptNo: receiptNo,
        amount: amount,
        currency: "INR",
        razorpayKey: isRazorpayConfigured
          ? process.env.RAZORPAY_KEY_ID
          : demoKeyId,
        paymentId: payment._id,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/payments/verify
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      receiptNo,
    } = req.body;

    // Validate input
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification details",
      });
    }

    // Check for demo mode
    const isDemoPayment =
      razorpay_order_id.startsWith("order_DEMO_") || !isRazorpayConfigured;

    let signatureValid = false;

    if (isDemoPayment) {
      // In demo mode, accept any signature for testing
      console.log("\n🎭 DEMO MODE: Verifying simulated payment");
      console.log("   Order ID: " + razorpay_order_id);
      console.log("   Payment ID: " + razorpay_payment_id);
      console.log("   Status: Simulated Success ✅\n");
      signatureValid = true;
    } else {
      // Verify real signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      signatureValid = generatedSignature === razorpay_signature;
    }

    if (!signatureValid) {
      // Signature mismatch - update payment as FAILED
      if (receiptNo) {
        await Payment.findOneAndUpdate(
          { receiptNo },
          {
            status: "FAILED",
            gatewayResponse: { razorpay_order_id, razorpay_payment_id },
          }
        );
      }

      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
      });
    }

    // Signature is valid - update payment as SUCCESS
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        status: "SUCCESS",
        paymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentDate: new Date(),
        gatewayResponse: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
        },
      },
      { new: true }
    );

    if (payment) {
      try {
        // Check if enrollment already exists to avoid duplicates
        const existingEnrollment = await Enrollment.findOne({
          Student_Id: payment.studentId,
          Course_Id: payment.courseId,
        });

        if (!existingEnrollment) {
          // Create Enrollment Record as per requirement
          const enrollment = new Enrollment({
            userId: payment.studentId,
            courseId: payment.courseId,
            amount: payment.amount,
            paymentId: razorpay_payment_id,
            enrollmentDate: new Date(),
            status: "Success",
            // Map to existing schema fields - use the same IDs from payment
            Student_Id: payment.studentId,
            Course_Id: payment.courseId.toString(), // Ensure it's a string for consistency
            Status: "Active",
            Payment_Status: "Paid",
            Enrolled_On: new Date(),
          });
          await enrollment.save();
          console.log("✅ Enrollment created successfully:", {
            Student_Id: payment.studentId,
            Course_Id: payment.courseId,
          });
        } else {
          console.log("ℹ️  Enrollment already exists, skipping creation");
        }
      } catch (enrollError) {
        console.error("❌ Error creating enrollment:", enrollError.message);
        // We don't fail the response here as payment was successful
      }

      // ==========================================
      // PAYMENT SPLIT: 30% Lecturer, 70% Admin
      // ==========================================
      try {
        const TblCourses = require("../models/Tbl_Courses");
        const TblEarnings = require("../models/Tbl_Earnings");

        // Fetch course to get Lecturer_Id
        const course = await TblCourses.findOne({
          Course_Id: payment.courseId,
        }).lean();

        if (course && course.Lecturer_Id) {
          const totalAmount = payment.amount;
          const lecturerShare = (totalAmount * 0.3).toFixed(2); // 30% for lecturer
          const adminShare = (totalAmount * 0.7).toFixed(2); // 70% for admin

          console.log(`\n💰 Payment Split for ₹${totalAmount}:`);
          console.log(`   Lecturer (30%): ₹${lecturerShare}`);
          console.log(`   Admin (70%): ₹${adminShare}`);

          // Create Lecturer Earning Record (30%)
          const lecturerEarning = new TblEarnings({
            Lecturer_Id: course.Lecturer_Id,
            Amount: parseFloat(lecturerShare),
            Course_Id: payment.courseId.toString(),
            Transaction_Type: "Course Sale",
            Transaction_Date: new Date(),
            Status: "Paid",
            Payment_Method: "Online",
            Payment_Date: new Date(),
            Notes: `30% share from course enrollment - Payment ID: ${razorpay_payment_id}`,
          });
          await lecturerEarning.save();
          console.log(
            `✅ Lecturer earning created: ${lecturerEarning.Earning_Id}`
          );

          // Create Admin Earning Record (70%)
          const adminEarning = new TblEarnings({
            Lecturer_Id: "ADMIN",
            Amount: parseFloat(adminShare),
            Course_Id: payment.courseId.toString(),
            Transaction_Type: "Course Sale",
            Transaction_Date: new Date(),
            Status: "Paid",
            Payment_Method: "Online",
            Payment_Date: new Date(),
            Notes: `70% admin share from course enrollment - Payment ID: ${razorpay_payment_id}`,
          });
          await adminEarning.save();
          console.log(`✅ Admin earning created: ${adminEarning.Earning_Id}\n`);
        } else {
          console.warn(
            `⚠️  Course not found or Lecturer_Id missing for Course_Id: ${payment.courseId}`
          );
        }
      } catch (earningError) {
        console.error(
          "❌ Error creating earnings split:",
          earningError.message
        );
        // We don't fail the payment verification even if earnings creation fails
      }
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        receiptNo: payment.receiptNo,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        courseName: payment.courseName,
        studentName: payment.studentName,
        studentEmail: payment.studentEmail,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

/**
 * Get Payment by Receipt Number
 * GET /api/payments/:receiptNo
 */
exports.getPayment = async (req, res) => {
  try {
    const { receiptNo } = req.params;

    const payment = await Payment.findOne({ receiptNo });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: error.message,
    });
  }
};

/**
 * Get Student Payments
 * GET /api/payments/student/:studentId
 */
exports.getStudentPayments = async (req, res) => {
  try {
    const { studentId } = req.params;

    const payments = await Payment.find({ studentId, status: "SUCCESS" }).sort({
      paymentDate: -1,
    });

    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    console.error("Get student payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student payments",
      error: error.message,
    });
  }
};
