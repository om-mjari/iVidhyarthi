# 📦 Required NPM Packages for Razorpay Integration

## Backend Dependencies

Add these to your `backend/package.json`:

```bash
cd backend
npm install razorpay
```

The `crypto` module is built-in with Node.js, no installation needed.

## Verify Installation

Check `backend/package.json` should include:

```json
{
  "dependencies": {
    "razorpay": "^2.9.2",
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    ...other dependencies
  }
}
```

## Frontend

No additional packages needed! Razorpay checkout script loads from CDN:

```javascript
https://checkout.razorpay.com/v1/checkout.js
```

This is loaded dynamically in `PaymentGateway.jsx`.

---

✅ **Ready to use!**
