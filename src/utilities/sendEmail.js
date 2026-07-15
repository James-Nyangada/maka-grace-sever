// sendEmail.js — Verification code email via Resend
const { Resend } = require("resend");
const { verificationCodeTemplate } = require("./emailTemplates");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = "Richworld Safaris <info@richworldsafaris.com>";

module.exports = async (to, code) => {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Your Verification Code",
    html: verificationCodeTemplate(code),
  });

  if (error) {
    console.error("Resend – Verification Code Error:", error);
    throw new Error(error.message);
  }
};
