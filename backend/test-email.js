require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '***' + process.env.EMAIL_APP_PASSWORD.slice(-4) : 'NOT SET');

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email configuration error:', error);
    console.error('\n⚠️  You need to:');
    console.error('1. Go to https://myaccount.google.com/apppasswords');
    console.error('2. Sign in with:', process.env.EMAIL_USER);
    console.error('3. Generate a new App Password');
    console.error('4. Update EMAIL_APP_PASSWORD in backend/.env (remove spaces)');
  } else {
    console.log('✅ Email server is ready to send messages');
    
    // Send a test email
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email - iVidhyarthi',
      html: '<h2>✅ Email Configuration Successful!</h2><p>Your email setup is working correctly.</p>'
    }, (err, info) => {
      if (err) {
        console.error('❌ Error sending test email:', err);
      } else {
        console.log('✅ Test email sent successfully!');
        console.log('Message ID:', info.messageId);
      }
      process.exit(0);
    });
  }
});
