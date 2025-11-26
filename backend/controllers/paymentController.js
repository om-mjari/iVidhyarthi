const Payment = require("../models/Payment");
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
      // DEMO MODE - Create fake order for testing
      console.log("🎭 DEMO MODE: Creating simulated order");
      razorpayOrder = {
        id: `order_DEMO_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: "INR",
        receipt: receiptNo,
        status: "created",
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
      // In demo mode, accept any signature
      console.log("🎭 DEMO MODE: Skipping signature verification");
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
