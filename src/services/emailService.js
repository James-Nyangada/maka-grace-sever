const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const BRAND_COLORS = {
  forestGreen: '#1A4731',
  maasaiGold: '#E8C547',
  boneSand: '#F5F0E8',
  white: '#FFFFFF',
  darkText: '#333333'
};

const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f9f9f9; color: ${BRAND_COLORS.darkText}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND_COLORS.white}; }
    .header { background-color: ${BRAND_COLORS.forestGreen}; padding: 30px 20px; text-align: center; }
    .header h1 { color: ${BRAND_COLORS.white}; margin: 0; font-size: 24px; }
    .header p { color: ${BRAND_COLORS.maasaiGold}; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 30px 20px; line-height: 1.6; }
    .footer { background-color: ${BRAND_COLORS.boneSand}; padding: 20px; text-align: center; font-size: 12px; color: ${BRAND_COLORS.darkText}; }
    .btn { display: inline-block; padding: 10px 20px; background-color: ${BRAND_COLORS.maasaiGold}; color: ${BRAND_COLORS.forestGreen}; text-decoration: none; font-weight: bold; border-radius: 4px; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Maka Grace Tours and Travel</h1>
      <p>Your Gateway to the Wild</p>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Maka Grace Tours and Travel<br/>
      Email: info@makagracetravel.co.ke | Phone/WhatsApp: +254 705 794 254<br/>
      Nairobi, Kenya</p>
    </div>
  </div>
</body>
</html>
`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Maka Grace <info@makagracetravel.co.ke>',
      to: to,
      subject: subject,
      html: emailWrapper(html),
    });
    return { success: true, data };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

const sendBookingReceivedEmail = async (booking) => {
  const html = `
    <p>Dear ${booking.fullName},</p>
    <p>Thank you for choosing Maka Grace Tours and Travel! We have received your booking request for the <strong>${booking.packageName}</strong>.</p>
    <p><strong>Booking Details:</strong></p>
    <ul>
      <li>Travel Dates: ${new Date(booking.travelDateFrom).toLocaleDateString()} to ${new Date(booking.travelDateTo).toLocaleDateString()}</li>
      <li>Travellers: ${booking.adults} Adults, ${booking.children} Children</li>
      <li>Accommodation: ${booking.accommodationPref || 'Not specified'}</li>
    </ul>
    <p>Our team will be in touch within 24 hours to proceed with your booking.</p>
    <p>If you have any urgent questions, feel free to reach us via WhatsApp at <strong>+254 705 794 254</strong> or email us at <strong>makagraceholdings@gmail.com</strong>.</p>
    <p>Warm regards,<br/>The Maka Grace Team</p>
  `;
  return await sendEmail({
    to: booking.email,
    subject: `Your Booking Request Has Been Received — ${booking.packageName} | Maka Grace`,
    html
  });
};

const sendNewBookingNotification = async (booking) => {
  const html = `
    <p>Hello Admin,</p>
    <p>A new booking has been submitted.</p>
    <p><strong>Customer:</strong> ${booking.fullName} (${booking.email})</p>
    <p><strong>Phone:</strong> ${booking.phone}</p>
    <p><strong>Package:</strong> ${booking.packageName}</p>
    <p><strong>Travel Dates:</strong> ${new Date(booking.travelDateFrom).toLocaleDateString()} to ${new Date(booking.travelDateTo).toLocaleDateString()}</p>
    <p><strong>Special Requests:</strong> ${booking.specialRequests || 'None'}</p>
    <p>Please log in to the admin dashboard to review and confirm this booking.</p>
  `;
  return await sendEmail({
    to: 'info@makagracetravel.co.ke', // Default admin receiving address
    subject: `[New Booking] ${booking.fullName} — ${booking.packageName}`,
    html
  });
};

const sendBookingConfirmedEmail = async (booking) => {
  const html = `
    <p>Dear ${booking.fullName},</p>
    <p>Great news! Your trip for the <strong>${booking.packageName}</strong> is confirmed.</p>
    <p>To secure your booking completely, a 25% deposit is required.</p>
    <p><strong>Payment Instructions (M-Pesa):</strong></p>
    <p>Please pay to <strong>+254 705 794 254 (Marykala)</strong>.</p>
    <p>Once paid, kindly send us the payment reference via WhatsApp or reply to this email so we can update your file.</p>
    <p>We look forward to hosting you!</p>
    <p>Warm regards,<br/>The Maka Grace Team</p>
  `;
  return await sendEmail({
    to: booking.email,
    subject: `Your Trip is Confirmed! — ${booking.packageName} | Maka Grace`,
    html
  });
};

const sendBookingCompletedEmail = async (booking) => {
  const html = `
    <p>Dear ${booking.fullName},</p>
    <p>Your booking for the <strong>${booking.packageName}</strong> has been marked as completed.</p>
    <p>We hope you had a fantastic time with us. Thank you for traveling with Maka Grace Tours and Travel!</p>
    <p>Warm regards,<br/>The Maka Grace Team</p>
  `;
  return await sendEmail({
    to: booking.email,
    subject: `Your Trip is Completed — ${booking.packageName} | Maka Grace`,
    html
  });
};

const sendBookingCancelledEmail = async (booking) => {
  const html = `
    <p>Dear ${booking.fullName},</p>
    <p>Your booking for the <strong>${booking.packageName}</strong> has been cancelled.</p>
    <p>If you have any questions or if this was done in error, please reach out to us at info@makagracetravel.co.ke.</p>
    <p>Warm regards,<br/>The Maka Grace Team</p>
  `;
  return await sendEmail({
    to: booking.email,
    subject: `Booking Cancelled — ${booking.packageName} | Maka Grace`,
    html
  });
};

const sendCustomEmail = async (to, subject, message) => {
  const html = `
    <p>${message.replace(/\\n/g, '<br/>')}</p>
  `;
  return await sendEmail({
    to,
    subject,
    html
  });
};

const sendReviewRequestEmail = async (booking) => {
  const html = `
    <p>Dear ${booking.fullName},</p>
    <p>We hope you had a wonderful experience on your recent trip to Kenya!</p>
    <p>Your feedback means the world to us. If you enjoyed your time with Maka Grace Tours and Travel, we would be incredibly grateful if you could share your experience with others by leaving a quick review.</p>
    <a href="#" class="btn">Leave a Google Review</a>
    <p>Thank you for traveling with us, and we hope to welcome you back again soon!</p>
    <p>Warm regards,<br/>The Maka Grace Team</p>
  `;
  return await sendEmail({
    to: booking.email,
    subject: `How Was Your Kenya Trip? Share Your Experience`,
    html
  });
};

module.exports = {
  sendEmail,
  sendBookingReceivedEmail,
  sendNewBookingNotification,
  sendBookingConfirmedEmail,
  sendBookingCompletedEmail,
  sendBookingCancelledEmail,
  sendCustomEmail,
  sendReviewRequestEmail
};
