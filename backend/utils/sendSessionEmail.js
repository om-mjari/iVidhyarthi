const nodemailer = require("nodemailer");

/**
 * Send session notification email to enrolled students
 * @param {Array} studentEmails - Array of student email addresses
 * @param {Object} sessionDetails - Session information
 * @param {String} emailType - 'created' or 'started'
 */
const sendSessionEmail = async (studentEmails, sessionDetails, emailType) => {
  try {
    if (!studentEmails || studentEmails.length === 0) {
      console.log("⚠️ No student emails to send to");
      return { success: true, message: "No recipients" };
    }

    let transporter;
    const hasSmtpEnvs =
      process.env.HOST || process.env.SERVICE || process.env.EMAIL_USER;

    if (hasSmtpEnvs) {
      transporter = nodemailer.createTransport({
        host: process.env.HOST || "smtp.gmail.com",
        service: process.env.SERVICE,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Boolean(process.env.SECURE || false),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });
    } else {
      // Development fallback: Ethereal test SMTP
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const {
      courseTitle,
      sessionTitle,
      scheduledAt,
      duration,
      sessionUrl,
      description,
    } = sessionDetails;

    // Format date and time
    const sessionDate = new Date(scheduledAt);
    const formattedDate = sessionDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = sessionDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    let subject, emailContent;

    if (emailType === "created") {
      subject = `New Session Scheduled: ${sessionTitle}`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">iVidhyarthi</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Learn. Build. Shine.</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin: 0 0 20px 0;">📅 New Session Scheduled!</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
              A new session has been scheduled for your course <strong>${courseTitle}</strong>.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
              <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 20px;">${sessionTitle}</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">📆 Date:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">🕒 Time:</td>
                  <td style="padding: 8px 0; color: #333;">${formattedTime}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #666; font-weight: bold;">⏱️ Duration:</td>
                  <td style="padding: 8px 0; color: #333;">${duration} minutes</td>
                </tr>
              </table>
              ${
                description
                  ? `<p style="margin: 15px 0 0 0; color: #666; line-height: 1.6;"><strong>Description:</strong> ${description}</p>`
                  : ""
              }
            </div>

            ${
              sessionUrl
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sessionUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                🔗 Join Session Link
              </a>
            </div>
            <p style="color: #999; font-size: 13px; text-align: center; margin: 10px 0;">
              (Join link will be available when the session starts)
            </p>
            `
                : ""
            }

            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              Please mark your calendar and join on time. Don't miss this important session!
            </p>
          </div>
        </div>
      `;
    } else if (emailType === "started") {
      subject = `Session Started: ${sessionTitle} - Join Now!`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">iVidhyarthi</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Learn. Build. Shine.</p>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #059669; margin: 0 0 20px 0;">🎥 Session is Now Live!</h2>
            <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0; font-size: 18px;">
              The session <strong>${sessionTitle}</strong> for <strong>${courseTitle}</strong> has started!
            </p>
            
            <div style="background: #d1fae5; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0; text-align: center;">
              <p style="color: #065f46; margin: 0 0 15px 0; font-size: 16px; font-weight: bold;">
                🚀 Join the session now to not miss any content!
              </p>
              <p style="color: #047857; margin: 0; font-size: 14px;">
                Duration: ${duration} minutes
              </p>
            </div>

            ${
              sessionUrl
                ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${sessionUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 18px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                🎥 JOIN SESSION NOW
              </a>
            </div>
            `
                : `
            <div style="text-align: center; margin: 30px 0;">
              <p style="color: #666; font-size: 16px;">Please check your dashboard to join the session.</p>
            </div>
            `
            }

            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              This is an automated notification. The session is currently ongoing.
            </p>
          </div>
        </div>
      `;
    }

    // Send email to all students (BCC for privacy)
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER || "no-reply@ividhyarthi.local",
      bcc: studentEmails.join(", "), // Use BCC to keep emails private
      subject: subject,
      html: emailContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl?.(info);
    if (previewUrl) {
      console.log("📧 Ethereal preview URL:", previewUrl);
    }

    console.log(
      `✅ Session ${emailType} email sent to ${studentEmails.length} students`
    );
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending session email:", error);
    return { success: false, error: error.message };
  }
};

module.exports = sendSessionEmail;
