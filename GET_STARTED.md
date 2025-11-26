# ✅ Setup Checklist - Get Started in 10 Minutes

## Step 1: Install Dependencies (2 min)
```bash
cd backend
npm install razorpay
```

## Step 2: Get Razorpay Keys (3 min)
1. Go to https://razorpay.com/
2. Sign up / Login
3. Dashboard → Settings → API Keys
4. Click "Generate Test Key"
5. Copy **Key ID** and **Key Secret**

## Step 3: Configure Environment (2 min)
```bash
cd backend
copy .env.example .env
```

Edit `.env` and add:
```env
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_HERE
RAZORPAY_KEY_SECRET=YOUR_SECRET_HERE
MONGODB_URI=your_existing_mongodb_uri
```

## Step 4: Start Services (1 min)

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Step 5: Test Payment (2 min)
1. Open http://localhost:5173
2. Login to dashboard
3. Click "Enroll Now" on any course
4. Select payment method
5. Click "Pay"
6. Use test card:
   - **Card:** 4111 1111 1111 1111
   - **Expiry:** 12/25
   - **CVV:** 123
7. Verify success page appears

## Step 6: Verify Database (1 min)
1. Open MongoDB Compass or Atlas
2. Check `Tbl_Payment` collection
3. Verify new document with `status: "SUCCESS"`

---

## ✅ Success Indicators

- [x] Backend shows "Routes registered: /api/payments"
- [x] Frontend loads without errors
- [x] Payment page shows 4 payment methods
- [x] Razorpay popup opens on "Pay Now"
- [x] Success page shows all details
- [x] MongoDB has payment entry

---

## 🐛 Quick Troubleshooting

**"Razorpay is not defined"**
→ Check internet connection (script loads from CDN)

**"Invalid signature"**
→ Check RAZORPAY_KEY_SECRET in .env file

**"404 on /api/payments"**
→ Restart backend server

**"MongoError"**
→ Check MONGODB_URI in .env

---

## 📚 Next Read
- `RAZORPAY_INTEGRATION_GUIDE.md` - Full documentation
- `QUICK_REFERENCE.md` - Payment flow diagram
- `PAYMENT_INTEGRATION_SUMMARY.md` - Complete overview

---

**🎉 You're ready to accept payments!**

Need help? Check the documentation files or test with:
```bash
node test-payment-api.js
```
