# 🎭 Razorpay Demo Mode - Setup Guide

## Current Status: DEMO MODE ACTIVE ✅

Your payment gateway is currently running in **DEMO MODE** which means:
- ✅ All payments are **simulated** (no real money charged)
- ✅ Safe for testing and development
- ✅ No Razorpay account required
- ✅ Payments marked as successful automatically

---

## 🚀 How to Enable REAL Razorpay Payments

### Step 1: Sign Up for Razorpay (FREE)
1. Visit: https://razorpay.com
2. Click **"Sign Up"** (100% free for testing)
3. Complete registration with your email
4. Verify your email address

### Step 2: Get TEST API Keys
1. Login to Razorpay Dashboard
2. Go to: **Settings** → **API Keys** (Website and App Settings)
3. Or directly visit: https://dashboard.razorpay.com/app/website-app-settings/api-keys
4. Click **"Generate Test Key"** if not already generated
5. You'll see two keys:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret** (click "Show" to reveal)

### Step 3: Update Backend Configuration
1. Open file: `iVidhyarthi/backend/.env`
2. Find these lines:
   ```env
   RAZORPAY_KEY_ID=rzp_test_DEMO_MODE
   RAZORPAY_KEY_SECRET=demo_secret_key
   ```
3. Replace with your REAL test keys:
   ```env
   RAZORPAY_KEY_ID=rzp_test_YOUR_ACTUAL_KEY_HERE
   RAZORPAY_KEY_SECRET=YOUR_ACTUAL_SECRET_HERE
   ```
4. Save the file

### Step 4: Restart Backend Server
1. Stop the current backend server (Ctrl+C in terminal)
2. Restart it:
   ```powershell
   cd backend
   npm start
   ```
3. You should see: ✅ **RAZORPAY CONFIGURED - LIVE TEST MODE**

### Step 5: Test with Real Payment Gateway
1. Go to your application
2. Select a course and proceed to payment
3. You'll now see the **real Razorpay checkout** instead of demo mode
4. Use Razorpay test card details:
   - Card Number: `4111 1111 1111 1111`
   - CVV: Any 3 digits (e.g., `123`)
   - Expiry: Any future date (e.g., `12/25`)
   - Name: Any name

---

## 🧪 Razorpay Test Cards

| Card Number | Type | Result |
|------------|------|--------|
| `4111 1111 1111 1111` | Visa | Success ✅ |
| `5555 5555 5555 4444` | Mastercard | Success ✅ |
| `4000 0000 0000 0002` | Visa | Card Declined ❌ |
| `4000 0000 0000 0341` | Visa | Insufficient Funds ❌ |

**Note:** Use any CVV, any future expiry date, and any name

---

## 📊 Checking Payment Status

### In Backend Logs:
- **Demo Mode:** `🎭 DEMO MODE: Creating simulated payment order`
- **Live Mode:** `✅ RAZORPAY CONFIGURED - LIVE TEST MODE`

### In MongoDB Database:
Check the `Tbl_Payment` collection for payment records with status:
- `PENDING` - Order created, awaiting payment
- `SUCCESS` - Payment completed successfully
- `FAILED` - Payment failed

---

## 🔧 Troubleshooting

### Issue: Still showing Demo Mode after adding keys
**Solution:** 
1. Verify keys are correctly copied (no extra spaces)
2. Ensure backend server was restarted
3. Check backend console for error messages

### Issue: "Invalid API Key" error
**Solution:**
1. Verify you copied **TEST** keys (not LIVE keys)
2. Ensure Key ID starts with `rzp_test_`
3. Double-check there are no typos

### Issue: Payment not going through
**Solution:**
1. Check browser console for errors (F12)
2. Ensure backend is running on port 5000
3. Check if Razorpay script loaded (check Network tab)

---

## 🌐 Going LIVE (Production)

**⚠️ IMPORTANT:** Before accepting real money:

1. Complete **KYC verification** in Razorpay dashboard
2. Switch to **LIVE mode keys** (starts with `rzp_live_`)
3. Update backend `.env` with LIVE keys
4. Test thoroughly with small amounts first
5. Enable webhook for payment confirmations

---

## 📞 Support

- **Razorpay Docs:** https://razorpay.com/docs/
- **Razorpay Support:** support@razorpay.com
- **Integration Issues:** Check backend logs and browser console

---

## ✅ Quick Checklist

- [ ] Signed up on Razorpay
- [ ] Generated TEST API keys
- [ ] Updated backend/.env file
- [ ] Restarted backend server
- [ ] Verified "LIVE TEST MODE" message in console
- [ ] Tested payment with test card
- [ ] Verified payment in MongoDB

---

**Current Configuration:** Demo Mode (No real payments)

**To Switch:** Follow Steps 1-4 above and restart server
