# 🚀 Razorpay Payment Gateway Integration - Complete Guide

## 📋 Overview

This document explains how to integrate Razorpay TEST payment gateway with iVidhyarthi platform.

---

## ✅ Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB Atlas** account
3. **Razorpay Test Account** (free)

---

## 🔧 Step 1: Install Dependencies

### Backend

```bash
cd backend
npm install razorpay crypto
```

### Frontend

```bash
cd ../
npm install
```

---

## 🔑 Step 2: Get Razorpay Test Keys

1. **Sign up** at [Razorpay](https://razorpay.com/)
2. Go to **Dashboard** → **Settings** → **API Keys**
3. Click **Generate Test Key**
4. Copy both:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

---

## ⚙️ Step 3: Configure Environment

1. Copy `.env.example` to `.env`:

```bash
cd backend
copy .env.example .env
```

2. Edit `.env` and add your Razorpay keys:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

---

## 📁 Step 4: Project Structure

```
iVidhyarthi/
├── backend/
│   ├── models/
│   │   └── Payment.js                 # Mongoose model
│   ├── controllers/
│   │   └── paymentController.js       # Payment logic
│   ├── routes/
│   │   └── paymentRoutes.js           # API routes
│   ├── config/
│   │   └── razorpay.js                # Razorpay config
│   └── server.js                      # Main server (updated)
├── src/
│   ├── PaymentGateway.jsx             # Payment page (updated)
│   ├── FinalPayment.jsx               # Success page (updated)
│   └── Payment.css                    # Styles (updated)
```

---

## 🗄️ Step 5: Database Setup

The `Tbl_Payment` collection will be created automatically when first payment is made.

**Schema:**

- `studentId` - Student identifier
- `courseId` - Course identifier
- `amount` - Payment amount
- `type` - Payment method (Card/UPI/NetBanking/Wallet)
- `receiptNo` - Unique receipt (IVY-timestamp-random)
- `orderId` - Razorpay order ID
- `paymentId` - Razorpay payment ID (after success)
- `status` - PENDING/SUCCESS/FAILED
- `paymentDate` - Completion timestamp

---

## 🚀 Step 6: Start the Application

### Terminal 1: Backend

```bash
cd backend
npm start
```

**Expected output:**

```
✅ MongoDB connected
✅ Routes registered:
   - /api/payments
Server running on port 5000
```

### Terminal 2: Frontend

```bash
npm run dev
```

**Expected output:**

```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

---

## 🧪 Step 7: Test Payment Flow

### A) Navigate to Payment

1. Open `http://localhost:5173`
2. Login to Student Dashboard
3. Click **Enroll Now** on any course
4. Go through checkout → Click **Pay Now**

### B) Payment Gateway Opens

1. Select payment method (Card/UPI/NetBanking)
2. Click **Pay ₹XXXX**
3. Razorpay TEST popup appears

### C) Test Payment (TEST MODE)

Use these TEST card details:

- **Card Number:** `4111 1111 1111 1111`
- **Expiry:** Any future date (e.g., `12/25`)
- **CVV:** Any 3 digits (e.g., `123`)
- **Name:** Any name

Click **Pay** in Razorpay popup

### D) Verify Success

1. You'll be redirected to **Payment Successful** page
2. Check details:
   - ✅ Payment ID
   - ✅ Order ID
   - ✅ Receipt No
   - ✅ Amount
   - ✅ Date

---

## 🔍 Step 8: Verify Database Entry

### Option 1: MongoDB Compass

1. Connect to your MongoDB
2. Navigate to database → `Tbl_Payment` collection
3. Check the new document:

```json
{
  "_id": "...",
  "studentId": "1",
  "courseId": "1",
  "amount": 1499,
  "type": "Card",
  "receiptNo": "IVY-1732630400-123",
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "status": "SUCCESS",
  "paymentDate": "2025-11-26T...",
  ...
}
```

### Option 2: MongoDB Atlas

1. Login to [MongoDB Atlas](https://cloud.mongodb.com)
2. **Clusters** → **Browse Collections**
3. Find `Tbl_Payment` → View document

### Option 3: API Call

```bash
# Get payment by receipt number
curl http://localhost:5000/api/payments/IVY-1732630400-123
```

---

## 📊 API Endpoints

### 1. Create Order

**POST** `/api/payments/create-order`

**Request:**

```json
{
  "studentId": "1",
  "courseId": "1",
  "amount": 1499,
  "type": "Card",
  "studentName": "John Doe",
  "studentEmail": "john@example.com",
  "courseName": "Maths with AI"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "receiptNo": "IVY-1732630400-123",
    "amount": 1499,
    "razorpayKey": "rzp_test_xxx"
  }
}
```

### 2. Verify Payment

**POST** `/api/payments/verify`

**Request:**

```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "receiptNo": "IVY-1732630400-123"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "pay_xxx",
    "orderId": "order_xxx",
    "receiptNo": "IVY-1732630400-123",
    "amount": 1499,
    "paymentDate": "2025-11-26T...",
    "status": "SUCCESS"
  }
}
```

### 3. Get Payment

**GET** `/api/payments/:receiptNo`

### 4. Get Student Payments

**GET** `/api/payments/student/:studentId`

---

## 🧪 Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can navigate to payment page
- [ ] Payment methods are selectable
- [ ] Razorpay popup opens on "Pay Now"
- [ ] Test card payment succeeds
- [ ] Redirected to success page
- [ ] Success page shows correct details
- [ ] Entry created in MongoDB with status="SUCCESS"
- [ ] Can verify payment via API

---

## 🐛 Troubleshooting

### Issue: Razorpay script not loading

**Solution:** Check internet connection. Script loads from CDN.

### Issue: Payment verification failed

**Solution:**

1. Check `RAZORPAY_KEY_SECRET` in `.env`
2. Verify signature generation logic

### Issue: MongoDB entry not created

**Solution:**

1. Check MongoDB connection in `.env`
2. Verify model import in `server.js`

### Issue: 404 on /api/payments

**Solution:**

1. Check `paymentRoutes` import in `server.js`
2. Restart backend server

---

## 🔐 Security Notes

1. **Never commit `.env`** - Add to `.gitignore`
2. **Use TEST keys only** during development
3. **Verify signature** on backend (already implemented)
4. **Validate inputs** before creating order
5. **Switch to LIVE keys** only in production

---

## 🚀 Going to Production

1. Get **LIVE Razorpay keys** from dashboard
2. Complete KYC on Razorpay
3. Update `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_live_xxxxx
   RAZORPAY_KEY_SECRET=live_secret_here
   ```
4. Test with **real small amount** (₹1)
5. Deploy backend + frontend
6. Monitor payments in Razorpay dashboard

---

## 📞 Support

- **Razorpay Docs:** https://razorpay.com/docs/payments/
- **Test Cards:** https://razorpay.com/docs/payments/payments/test-card-upi-details/

---

**✅ Integration Complete!** Your iVidhyarthi platform now has a fully functional payment system with MongoDB persistence.
