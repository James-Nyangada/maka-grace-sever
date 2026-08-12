const nodemailer = require('nodemailer');

const sendPasswordResetEmail = async (to, resetLink) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `Maka Grace Admin <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Maka Grace admin account.</p>
        <p>Click the button below to reset your password. This link will expire in 10 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #1A4731; text-decoration: none; border-radius: 5px; margin-top: 20px;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 12px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendPasswordResetEmail;
