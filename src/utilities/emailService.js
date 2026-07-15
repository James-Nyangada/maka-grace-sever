// emailService.js — Booking emails via Resend
const { Resend } = require("resend");
const {
  bookingConfirmationTemplate,
  bookingNotificationTemplate,
  paymentLinkTemplate,
} = require("./emailTemplates");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = "Richworld Safaris <info@richworldsafaris.com>";

// Send booking confirmation to customer
async function sendBookingConfirmation(to, booking) {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Booking Confirmation — " + booking.selectedPackage,
    html: bookingConfirmationTemplate(booking),
  });

  if (error) {
    console.error("Resend – Booking Confirmation Error:", error);
    throw new Error(error.message);
  }
}

// Send booking notification to company
async function sendBookingNotification(to, booking) {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "New Booking — " + booking.selectedPackage,
    html: bookingNotificationTemplate(booking),
  });

  if (error) {
    console.error("Resend – Booking Notification Error:", error);
    throw new Error(error.message);
  }
}

// Send payment link to customer (for Pay Later)
async function sendPaymentLinkEmail(to, booking, paymentLink) {
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: "Complete Your Payment — " + booking.selectedPackage,
    html: paymentLinkTemplate(booking, paymentLink),
  });

  if (error) {
    console.error("Resend – Payment Link Error:", error);
    throw new Error(error.message);
  }
}

module.exports = { sendBookingConfirmation, sendBookingNotification, sendPaymentLinkEmail };
