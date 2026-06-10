const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Test connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.log("❌ Email config error:", error.message);
  } else {
    console.log("✅ Email server ready:", process.env.EMAIL_USER);
  }
});

const sendOTPEmail = async ({ to, name, otp }) => {
  console.log("Sending OTP email to:", to);

  const mailOptions = {
    from: `"i-SOFTZONE EMS" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Password Reset OTP: ${otp}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e0e0e0;">

        <!-- Header -->
        <div style="background:#1d4ed8;padding:20px 32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:800;letter-spacing:1px;">
            <img src="https://images.jdmagicbox.com/comp/indore/s9/0731px731.x731.170921193503.a4s9/catalogue/i-softzone-mg-road-indore-indore-barcode-computer-software-dealers-rd3jw85c1d.jpg" alt="i-SOFTZONE" height={28} />
          </h1>
          <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px;">
            Enterprise Management System
          </p>
        </div>

        <!-- Subject line like bigbasket -->
        <div style="background:#f5f5f5;padding:16px 32px;border-bottom:1px solid #e0e0e0;">
          <p style="margin:0;font-size:16px;color:#333;">
            Reset your password using OTP: <strong style="color:#1d4ed8;">${otp}</strong>
          </p>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
          <p style="font-size:15px;color:#333;margin:0 0 8px;">Hi <strong>${name}</strong>,</p>
          <p style="font-size:15px;color:#333;margin:0 0 20px;">
            Use the OTP <strong style="color:#1d4ed8;">${otp}</strong> to reset your password.
          </p>
          <p style="font-size:15px;color:#333;margin:0 0 20px;">
            The code is valid for <strong>15 minutes</strong> and can be used only once.
          </p>

          <!-- OTP Box -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:20px;text-align:center;margin:24px 0;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;">Your One-Time Password</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#1d4ed8;font-family:monospace;">
              ${otp}
            </div>
            <p style="color:#dc2626;font-size:12px;margin:10px 0 0;">
              ⏰ Valid for 15 minutes only
            </p>
          </div>

          <p style="font-size:13px;color:#666;margin:0;">
            If you did not request a password reset, please ignore this email.
            Your password will remain unchanged.
          </p>
        </div>

        <!-- Divider -->
        <div style="border-top:1px solid #e0e0e0;margin:0 32px;"></div>

        <!-- Sign off like bigbasket -->
        <div style="padding:20px 32px;">
          <p style="font-size:14px;color:#333;margin:0 0 4px;">See you soon,</p>
          <p style="font-size:14px;color:#333;margin:0;font-weight:700;">Team i-SOFTZONE</p>
        </div>

        <!-- Divider -->
        <div style="border-top:1px solid #e0e0e0;"></div>

        <!-- Help section like bigbasket -->
        <div style="padding:20px 32px;text-align:center;">
          <p style="font-size:14px;font-weight:700;color:#333;margin:0 0 8px;">Need any help?</p>
          <p style="font-size:13px;color:#666;margin:0 0 12px;">
            Contact us any day between 9 AM to 6 PM. We are happy to help.
          </p>
          <div style="display:inline-flex;gap:16px;font-size:13px;">
            <a href="mailto:${process.env.EMAIL_USER}" style="color:#1d4ed8;text-decoration:none;font-weight:600;">
              Email Us
            </a>
            <span style="color:#ccc;">|</span>
            <a href="#" style="color:#1d4ed8;text-decoration:none;font-weight:600;">
              Support Portal
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#f5f5f5;padding:16px 32px;text-align:center;border-top:1px solid #e0e0e0;">
          <p style="color:#999;font-size:12px;margin:0 0 6px;">
            © 2026 i-SOFTZONE Technologies Pvt. Ltd. All rights reserved.
          </p>
          <p style="color:#bbb;font-size:11px;margin:0;">
            Indore, Madhya Pradesh, India
          </p>
        </div>

      </div>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Email sent:", info.messageId);
  return info;
};

module.exports = sendOTPEmail;