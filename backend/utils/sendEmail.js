const nodemailer = require("nodemailer");

module.exports = async (email, subject, text) => {
  try {
    let transporter;
    const hasSmtpEnvs =
      process.env.HOST || process.env.SERVICE || process.env.USER;

    if (hasSmtpEnvs) {
      transporter = nodemailer.createTransport({
        host: process.env.HOST,
        service: process.env.SERVICE,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Boolean(process.env.SECURE || false),
        auth: {
          user: process.env.USER,
          pass: process.env.PASS,
        },
      });
    } else {
      // Development fallback: Ethereal test SMTP (emails go to preview URL)
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.USER || "no-reply@ividhyarthi.local",
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">iVidhyarthi</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Learn. Build. Shine.</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin: 0 0 20px 0;">Email Verification</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for registering with iVidhyarthi! Please click the button below to verify your email address and activate your account.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${text}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
              If the button doesn't work, you can copy and paste this link into your browser:<br>
              <a href="${text}" style="color: #667eea; word-break: break-all;">${text}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              This verification link will expire in 1 hour. If you didn't create an account with iVidhyarthi, please ignore this email.
            </p>
          </div>
        </div>
      `,
    });
    const previewUrl = nodemailer.getTestMessageUrl?.(info);
    if (previewUrl) {
      console.log("📧 Ethereal preview URL:", previewUrl);
    }
    console.log("Email sent successfully to:", email);
  } catch (error) {
    console.log("Email not sent:", error);
    return error;
  }
};
