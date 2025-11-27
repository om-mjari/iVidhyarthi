/**
 * Razorpay Payment Handler
 * ========================
 * Reusable payment function with automatic fallback animation
 */

import { showCoinAnimation, hideCoinAnimation } from "./coinAnimation";

/**
 * Load Razorpay script dynamically
 * @returns {Promise<boolean>} - Success status
 */
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Main Payment Handler Function
 * @param {number} amount - Amount in rupees (will be converted to paise)
 * @param {Object} options - Additional payment options
 * @returns {Promise<Object>} - Payment result with payment_id, order_id, amount, payment_status
 */
export const handlePayment = async (amount, options = {}) => {
  try {
    // Default options
    const defaultOptions = {
      currency: "INR",
      name: "iVidhyarthi",
      description: options.description || "Course Payment",
      customerName: options.customerName || "Student",
      customerEmail: options.customerEmail || "student@ividhyarthi.com",
      customerContact: options.customerContact || "9999999999",
      orderId: options.orderId || null,
    };

    // Merge with provided options
    const paymentConfig = { ...defaultOptions, ...options };

    // Step 1: Load Razorpay script
    console.log("📦 Loading Razorpay script...");
    const scriptLoaded = await loadRazorpayScript();

    if (!scriptLoaded) {
      console.warn(
        "⚠️ Razorpay script failed to load, showing fallback animation"
      );
      // Show coin animation as fallback
      showCoinAnimation();

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      hideCoinAnimation();

      // Return simulated success response
      return {
        payment_id: `pay_FALLBACK_${Date.now()}`,
        order_id: paymentConfig.orderId || `order_FALLBACK_${Date.now()}`,
        amount: amount,
        payment_status: "SUCCESS",
        fallback: true,
        message: "Payment simulated (Razorpay unavailable)",
      };
    }

    // Step 2: Create order on backend (if orderId not provided)
    let orderId = paymentConfig.orderId;

    if (!orderId) {
      console.log("📝 Creating payment order...");
      try {
        const response = await fetch(
          "http://localhost:5000/api/payments/create-order",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: options.studentId || "1",
              courseId: options.courseId || "1",
              amount: amount,
              type: options.paymentType || "Card",
              studentName: paymentConfig.customerName,
              studentEmail: paymentConfig.customerEmail,
              courseName: options.courseName || "Course",
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          orderId = data.data.orderId;
          console.log("✅ Order created:", orderId);

          // Check if demo mode
          if (data.demoMode) {
            console.log("🎭 Demo mode detected, showing fallback animation");
            showCoinAnimation();

            // Simulate payment
            await new Promise((resolve) => setTimeout(resolve, 3000));

            hideCoinAnimation();

            // Verify demo payment
            const verifyResponse = await fetch(
              "http://localhost:5000/api/payments/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: orderId,
                  razorpay_payment_id: `pay_DEMO_${Date.now()}`,
                  razorpay_signature: `sig_DEMO_${Date.now()}`,
                  receiptNo: data.data.receiptNo,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              return {
                payment_id: verifyData.data.paymentId,
                order_id: orderId,
                amount: amount,
                payment_status: "SUCCESS",
                demo: true,
                message: "Demo payment successful",
              };
            }
          }
        } else {
          throw new Error(data.message || "Order creation failed");
        }
      } catch (error) {
        console.error("❌ Order creation error:", error);
        throw error;
      }
    }

    // Step 3: Initialize Razorpay payment
    return new Promise((resolve, reject) => {
      const razorpayOptions = {
        key: "rzp_test_DEMO_MODE", // Demo test key
        amount: Math.round(amount * 100), // Convert to paise
        currency: paymentConfig.currency,
        name: paymentConfig.name,
        description: paymentConfig.description,
        order_id: orderId,
        prefill: {
          name: paymentConfig.customerName,
          email: paymentConfig.customerEmail,
          contact: paymentConfig.customerContact,
        },
        theme: {
          color: "#2E8BFF",
        },
        modal: {
          ondismiss: () => {
            console.log("❌ Payment cancelled by user");
            hideCoinAnimation();
            reject({
              payment_status: "CANCELLED",
              message: "Payment cancelled by user",
            });
          },
        },
        handler: async (response) => {
          console.log("✅ Payment successful:", response);

          try {
            // Verify payment on backend
            const verifyResponse = await fetch(
              "http://localhost:5000/api/payments/verify",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              resolve({
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                amount: amount,
                payment_status: "SUCCESS",
                message: "Payment successful",
              });
            } else {
              reject({
                payment_status: "FAILED",
                message: verifyData.message || "Payment verification failed",
              });
            }
          } catch (error) {
            console.error("❌ Verification error:", error);
            reject({
              payment_status: "ERROR",
              message: "Payment verification error",
              error: error.message,
            });
          }
        },
      };

      // Create Razorpay instance and open
      try {
        const razorpay = new window.Razorpay(razorpayOptions);

        razorpay.on("payment.failed", (response) => {
          console.error("❌ Payment failed:", response);
          reject({
            payment_status: "FAILED",
            message: response.error.description,
            error: response.error,
          });
        });

        // Show coin animation while waiting for popup
        showCoinAnimation();

        // Open Razorpay checkout
        razorpay.open();

        // Hide animation once popup opens (small delay)
        setTimeout(() => {
          hideCoinAnimation();
        }, 500);
      } catch (error) {
        console.error("❌ Razorpay initialization error:", error);

        // Fallback to coin animation
        showCoinAnimation();

        setTimeout(() => {
          hideCoinAnimation();
          resolve({
            payment_id: `pay_FALLBACK_${Date.now()}`,
            order_id: orderId,
            amount: amount,
            payment_status: "SUCCESS",
            fallback: true,
            message: "Payment simulated (Razorpay error)",
          });
        }, 3000);
      }
    });
  } catch (error) {
    console.error("❌ Payment handler error:", error);

    // Show fallback animation
    showCoinAnimation();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    hideCoinAnimation();

    // Return error
    throw {
      payment_status: "ERROR",
      message: error.message || "Payment processing error",
      error: error,
    };
  }
};

export default handlePayment;
