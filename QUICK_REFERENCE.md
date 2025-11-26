# 🎯 Quick Reference - Razorpay Payment Flow

## 🔄 Complete Flow

```
Student Dashboard
    ↓ (Click Enroll)
Course Details
    ↓ (Click Enroll)
Payment Page
    ↓ (Select method + Click Pay)
PaymentGateway.jsx
    ↓ (Call Backend)
POST /api/payments/create-order
    ↓ (Create Razorpay order)
MongoDB: Insert PENDING payment
    ↓ (Return orderId + key)
Frontend: Open Razorpay Popup
    ↓ (User pays with test card)
Razorpay: Payment Success
    ↓ (Return payment_id + signature)
POST /api/payments/verify
    ↓ (Verify signature)
MongoDB: Update to SUCCESS
    ↓ (Return payment details)
FinalPayment.jsx (Success Page)
    ↓ (Click Continue)
Student Dashboard
```

---

## 🧪 Test Card (Razorpay TEST Mode)

```
Card Number:  4111 1111 1111 1111
Expiry:       Any future date (12/25)
CVV:          Any 3 digits (123)
Name:         Any name
```

**Result:** ✅ Always succeeds in TEST mode

---

## 📊 MongoDB Document Structure

```javascript
{
  studentId: "1",
  courseId: "1",
  amount: 1499,
  type: "Card",
  receiptNo: "IVY-1732630400-123",  // Unique
  orderId: "order_xxx",              // From Razorpay
  paymentId: "pay_xxx",              // From Razorpay
  status: "SUCCESS",                 // PENDING → SUCCESS
  paymentDate: "2025-11-26T10:30:00Z",
  courseName: "Maths with AI",
  studentEmail: "student@email.com"
}
```

---

## 🔑 Environment Variables (.env)

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
MONGODB_URI=mongodb+srv://...
PORT=5000
```

---

## 🚀 Start Commands

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint                           | Purpose                  |
| ------ | ---------------------------------- | ------------------------ |
| POST   | `/api/payments/create-order`       | Create Razorpay order    |
| POST   | `/api/payments/verify`             | Verify payment signature |
| GET    | `/api/payments/:receiptNo`         | Get payment by receipt   |
| GET    | `/api/payments/student/:studentId` | Get all student payments |

---

## ✅ Success Indicators

1. **Console:** `Payment successful: { razorpay_payment_id, razorpay_order_id, razorpay_signature }`
2. **Page:** Redirects to `FinalPayment.jsx` with all details
3. **MongoDB:** Document with `status: "SUCCESS"`
4. **Razorpay Dashboard:** Payment appears in test payments

---

## 🐛 Common Errors

| Error                     | Solution                              |
| ------------------------- | ------------------------------------- |
| `Razorpay is not defined` | Check internet, script loads from CDN |
| `Invalid signature`       | Verify `RAZORPAY_KEY_SECRET` in .env  |
| `404 on /api/payments`    | Restart backend, check route import   |
| `MongoServerError`        | Check MongoDB connection string       |

---

## 📁 Modified Files

### Backend

- ✅ `models/Payment.js` (New)
- ✅ `controllers/paymentController.js` (New)
- ✅ `routes/paymentRoutes.js` (New)
- ✅ `config/razorpay.js` (New)
- ✅ `server.js` (Updated)
- ✅ `.env.example` (Updated)

### Frontend

- ✅ `PaymentGateway.jsx` (Updated)
- ✅ `FinalPayment.jsx` (Updated)
- ✅ `Payment.css` (Updated)

---

**🎉 You're all set!** Test the payment flow now.
