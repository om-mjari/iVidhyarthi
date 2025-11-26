# 🔧 Razorpay Setup Guide

## Current Status: DEMO MODE ✅

Your payment gateway is running in **DEMO MODE** which allows you to test the complete payment flow without real Razorpay credentials.

## How to Enable Real Payments (5 minutes)

### Step 1: Sign Up for Razorpay

1. Visit: https://dashboard.razorpay.com/signup
2. Create a free account
3. Complete email verification

### Step 2: Get TEST API Keys

1. Login to Razorpay Dashboard
2. Go to: **Settings** → **API Keys** → **Website & App Settings**
3. Click **Generate Test Key** (NOT Live Key)
4. You'll get two keys:
   - **Key ID**: `rzp_test_XXXXXXXXXXXXX`
   - **Key Secret**: `YYYYYYYYYYYYYYY`

### Step 3: Update Your .env File

1. Open: `iVidhyarthi/backend/.env`
2. Replace placeholder values:

```env
# Replace these lines:
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here

# With your actual keys:
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYY
```

### Step 4: Restart Backend Server

```bash
# Stop current server (Ctrl+C)
cd backend
node server.js
```

You should see: ✅ **Razorpay configured with real credentials**

## Testing Real Payments

### Test Card Details (Razorpay Sandbox)

| Card Number         | Expiry          | CVV          | Result     |
| ------------------- | --------------- | ------------ | ---------- |
| 4111 1111 1111 1111 | Any future date | Any 3 digits | ✅ Success |
| 4012 8888 8888 1881 | Any future date | Any 3 digits | ✅ Success |
| 5555 5555 5555 4444 | Any future date | Any 3 digits | ✅ Success |

### Test UPI ID

- success@razorpay
- failure@razorpay (for testing failures)

### Test NetBanking

- Select any bank
- Use any credentials
- Click "Success" or "Failure" button

## What's Working in Demo Mode

✅ Complete payment UI flow
✅ Payment method selection
✅ Order creation in MongoDB
✅ Payment verification
✅ Success page with receipt
✅ Database entry in Tbl_Payment

## What's Missing in Demo Mode

❌ Real Razorpay checkout popup
❌ Actual card/UPI processing
❌ Real payment gateway security
❌ Payment webhooks
❌ Refund capabilities

## For Your Presentation Tomorrow

**Option 1: Use Demo Mode**

- Show the complete UI flow
- Mention "This is running in TEST mode"
- Payment completes in 2 seconds automatically
- Receipt is generated and saved

**Option 2: Setup Real Razorpay (Recommended)**

- Takes only 5 minutes
- Shows actual Razorpay checkout
- More impressive and professional
- Can use test cards to demonstrate

## Need Help?

**Error: "Payment failed: Failed to create order"**

- This means you need to either:
  1. Keep demo mode (current setup) ✅
  2. Add real Razorpay keys (5 min setup) 🔑

**Server shows: "⚠️ Razorpay not configured - DEMO MODE ENABLED"**

- This is normal! Your app works in demo mode
- To enable real payments, follow steps above

## Production Deployment

Before going live with real money:

1. Complete Razorpay KYC verification
2. Switch to LIVE API keys (not test)
3. Update .env with live keys
4. Test thoroughly with real payments
5. Enable webhooks for payment confirmations

---

**Current Setup: Perfect for presentation! 🎉**

The demo mode gives you a working payment system without needing Razorpay account right now.
