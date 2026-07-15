// emailTemplates.js — Premium branded email templates for Richworld Safaris

/**
 * Shared layout wrapper for all emails.
 * Dark luxury header, clean body, branded footer.
 */
function baseLayout(title, bodyContent, { showSignature = true } = {}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f1ec; font-family:'Helvetica Neue',Helvetica,Arial,sans-serif; color:#2d2d2d;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f1ec; padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding:36px 40px; text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="font-size:28px; font-weight:700; color:#c9a84c; letter-spacing:3px; text-transform:uppercase; font-family:Georgia,'Times New Roman',serif;">
                      RICHWORLD SAFARIS
                    </div>
                    <div style="font-size:11px; color:#a0a0b0; letter-spacing:6px; text-transform:uppercase; margin-top:6px;">
                      MAGIC REDEFINED 
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ACCENT BAR -->
          <tr>
            <td style="height:4px; background:linear-gradient(90deg, #c9a84c 0%, #e8d5a3 50%, #c9a84c 100%);"></td>
          </tr>

          <!-- BODY CONTENT -->
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              ${bodyContent}
            </td>
          </tr>

          ${showSignature ? `
          <!-- DIRECTOR SIGNATURE -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <div style="height:1px; background:linear-gradient(90deg, transparent, #c9a84c, transparent); margin-bottom:24px;"></div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0 0 2px 0; font-size:15px; font-weight:700; color:#1a1a2e;">Ken Mumo</p>
                    <p style="margin:0 0 2px 0; font-size:13px; color:#888; font-style:italic;">Director</p>
                    <p style="margin:0 0 2px 0; font-size:13px; color:#1a1a2e; font-weight:600;">Rich World Safaris</p>
                    <p style="margin:6px 0 0 0; font-size:13px; color:#555;">
                      📞 <a href="tel:+254706770371" style="color:#c9a84c; text-decoration:none;">+254 706 770 371</a>
                    </p>
                    <p style="margin:2px 0 0 0; font-size:13px; color:#555;">
                      🌐 <a href="https://www.richworldsafaris.com" style="color:#c9a84c; text-decoration:none;">www.richworldsafaris.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#1a1a2e; padding:28px 40px; text-align:center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <p style="color:#c9a84c; font-size:13px; font-weight:600; letter-spacing:2px; margin:0 0 8px 0; text-transform:uppercase;">
                      Richworld Safaris
                    </p>
                    <p style="color:#8888a0; font-size:12px; line-height:20px; margin:0 0 4px 0;">
                      📧 info@richworldsafaris.com &nbsp;|&nbsp; 🌐 www.richworldsafaris.com
                    </p>
                    <p style="color:#5a5a70; font-size:11px; margin:12px 0 0 0;">
                      © ${new Date().getFullYear()} Richworld Safaris. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Helper: detail row for booking tables ────────────────────────────────
function detailRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 14px; font-size:13px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; border-bottom:1px solid #f0ebe3; width:40%;">
        ${label}
      </td>
      <td style="padding:10px 14px; font-size:14px; color:#2d2d2d; font-weight:500; border-bottom:1px solid #f0ebe3;">
        ${value}
      </td>
    </tr>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1) BOOKING CONFIRMATION — sent to customer
// ═══════════════════════════════════════════════════════════════════════════
function bookingConfirmationTemplate(booking) {
  const travelStart = new Date(booking.travelStartDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const travelEnd = new Date(booking.travelEndDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });

  const body = `
    <!-- Greeting -->
    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#1a1a2e; margin:0 0 8px 0;">
      Booking Confirmed ✨
    </h1>
    <p style="font-size:15px; color:#555; line-height:24px; margin:0 0 24px 0;">
      Hello <strong>${booking.fullName}</strong>, thank you for choosing Richworld Safaris! Your adventure awaits.
    </p>

    <!-- Divider -->
    <div style="height:1px; background:linear-gradient(90deg, transparent, #c9a84c, transparent); margin:0 0 24px 0;"></div>

    <!-- Package highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4; border-radius:8px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px; text-align:center;">
          <div style="font-size:11px; color:#c9a84c; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:6px;">YOUR PACKAGE</div>
          <div style="font-size:20px; font-weight:700; color:#1a1a2e; font-family:Georgia,'Times New Roman',serif;">${booking.selectedPackage}</div>
        </td>
      </tr>
    </table>

    <!-- Booking details table -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe3; border-radius:8px; overflow:hidden;">
      ${detailRow("Booking ID", booking.bookingId || booking._id)}
      ${detailRow("Full Name", booking.fullName)}
      ${detailRow("Email", booking.email)}
      ${detailRow("Phone", booking.phone)}
      ${detailRow("Travel Dates", `${travelStart} — ${travelEnd}`)}
      ${detailRow("Adults", booking.numberOfAdults)}
      ${detailRow("Children", booking.numberOfChildren || 0)}
      ${booking.amount ? detailRow("Amount", `KES ${Number(booking.amount).toLocaleString()}`) : ""}
      ${booking.specialRequests ? detailRow("Special Requests", booking.specialRequests) : ""}
    </table>

    <!-- Call to action note -->
    <div style="margin-top:28px; padding:20px 24px; background:#f0fdf4; border-left:4px solid #16a34a; border-radius:0 8px 8px 0;">
      <p style="margin:0; font-size:14px; color:#166534; line-height:22px;">
        🎉 We've received your booking and our team will be in touch shortly to finalise the details.
      </p>
    </div>

    <p style="font-size:13px; color:#888; margin-top:24px; line-height:20px;">
      If you have any questions, simply reply to this email or reach us at <a href="mailto:info@richworldsafaris.com" style="color:#c9a84c; text-decoration:none; font-weight:600;">info@richworldsafaris.com</a>.
    </p>
  `;

  return baseLayout("Booking Confirmation — Richworld Safaris", body);
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) BOOKING NOTIFICATION — sent to company/admin
// ═══════════════════════════════════════════════════════════════════════════
function bookingNotificationTemplate(booking) {
  const travelStart = new Date(booking.travelStartDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });
  const travelEnd = new Date(booking.travelEndDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });

  const body = `
    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:22px; color:#1a1a2e; margin:0 0 8px 0;">
      📩 New Booking Received
    </h1>
    <p style="font-size:14px; color:#555; line-height:22px; margin:0 0 24px 0;">
      A new booking has been submitted. Details below:
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe3; border-radius:8px; overflow:hidden;">
      ${detailRow("Booking ID", booking.bookingId || booking._id)}
      ${detailRow("Customer", booking.fullName)}
      ${detailRow("Email", booking.email)}
      ${detailRow("Phone", booking.phone)}
      ${detailRow("Package", booking.selectedPackage)}
      ${detailRow("Travel Dates", `${travelStart} — ${travelEnd}`)}
      ${detailRow("Adults", booking.numberOfAdults)}
      ${detailRow("Children", booking.numberOfChildren || 0)}
      ${booking.amount ? detailRow("Amount", `KES ${Number(booking.amount).toLocaleString()}`) : ""}
      ${detailRow("Payment Status", booking.paymentStatus || "pending")}
      ${booking.specialRequests ? detailRow("Special Requests", booking.specialRequests) : ""}
    </table>

    <div style="margin-top:24px; padding:16px 24px; background:#fef9e7; border-left:4px solid #c9a84c; border-radius:0 8px 8px 0;">
      <p style="margin:0; font-size:13px; color:#92750a; line-height:20px;">
        ⚡ Please follow up with the customer promptly to confirm travel arrangements.
      </p>
    </div>
  `;

  return baseLayout("New Booking Alert — Richworld Safaris", body, { showSignature: false });
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) PAYMENT LINK — sent to customer (Pay Later)
// ═══════════════════════════════════════════════════════════════════════════
function paymentLinkTemplate(booking, paymentLink) {
  const travelStart = new Date(booking.travelStartDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" });

  const body = `
    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#1a1a2e; margin:0 0 8px 0;">
      Complete Your Payment 💳
    </h1>
    <p style="font-size:15px; color:#555; line-height:24px; margin:0 0 24px 0;">
      Hello <strong>${booking.fullName}</strong>, thank you for booking <strong>${booking.selectedPackage}</strong>. To secure your spot, please complete your payment below.
    </p>

    <!-- Divider -->
    <div style="height:1px; background:linear-gradient(90deg, transparent, #c9a84c, transparent); margin:0 0 28px 0;"></div>

    <!-- Amount highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e; border-radius:10px; margin-bottom:28px;">
      <tr>
        <td style="padding:28px 24px; text-align:center;">
          <div style="font-size:11px; color:#a0a0b0; font-weight:600; letter-spacing:3px; text-transform:uppercase; margin-bottom:8px;">AMOUNT DUE</div>
          <div style="font-size:32px; font-weight:700; color:#c9a84c; font-family:Georgia,'Times New Roman',serif;">
            KES ${booking.amount ? Number(booking.amount).toLocaleString() : "0"}
          </div>
        </td>
      </tr>
    </table>

    <!-- CTA Button -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:0 0 28px 0;">
          <a href="${paymentLink}"
             style="display:inline-block; background:linear-gradient(135deg, #16a34a, #15803d); color:#ffffff; text-decoration:none; padding:16px 48px; border-radius:8px; font-size:16px; font-weight:700; letter-spacing:0.5px; box-shadow:0 4px 14px rgba(22,163,74,0.3);">
            Pay Now →
          </a>
        </td>
      </tr>
    </table>

    <!-- Booking summary -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe3; border-radius:8px; overflow:hidden;">
      ${detailRow("Booking ID", booking.bookingId || booking._id)}
      ${detailRow("Package", booking.selectedPackage)}
      ${detailRow("Travel Date", travelStart)}
      ${booking.amount ? detailRow("Amount", `KES ${Number(booking.amount).toLocaleString()}`) : ""}
    </table>

    <p style="font-size:12px; color:#999; margin-top:20px; line-height:18px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${paymentLink}" style="color:#c9a84c; word-break:break-all;">${paymentLink}</a>
    </p>

    <p style="font-size:13px; color:#888; margin-top:20px; line-height:20px;">
      This payment link does not expire — you can pay at any time. If you have already paid, please disregard this email.
    </p>
  `;

  return baseLayout("Complete Your Payment — Richworld Safaris", body);
}

// ═══════════════════════════════════════════════════════════════════════════
// 4) VERIFICATION CODE — sent during auth
// ═══════════════════════════════════════════════════════════════════════════
function verificationCodeTemplate(code) {
  const body = `
    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#1a1a2e; margin:0 0 8px 0;">
      Verify Your Email 🔐
    </h1>
    <p style="font-size:15px; color:#555; line-height:24px; margin:0 0 28px 0;">
      Hello 👋, thanks for signing up! Use the code below to verify your email address.
    </p>

    <!-- Code block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <div style="display:inline-block; background:#1a1a2e; border-radius:10px; padding:24px 48px;">
            <span style="font-size:36px; font-weight:700; color:#c9a84c; letter-spacing:10px; font-family:'Courier New',monospace;">
              ${code}
            </span>
          </div>
        </td>
      </tr>
    </table>

    <div style="padding:16px 24px; background:#fef2f2; border-left:4px solid #ef4444; border-radius:0 8px 8px 0;">
      <p style="margin:0; font-size:13px; color:#991b1b; line-height:20px;">
        ⏱ This code will expire in <strong>10 minutes</strong>. Do not share it with anyone.
      </p>
    </div>

    <p style="font-size:13px; color:#888; margin-top:24px; line-height:20px;">
      If you didn't request this code, you can safely ignore this email.
    </p>
  `;

  return baseLayout("Verify Your Email — Richworld Safaris", body);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5) BOOKING UPDATED NOTIFICATION — sent to customer
// ═══════════════════════════════════════════════════════════════════════════
function bookingUpdatedTemplate(booking) {
  const travelStart = booking.travelStartDate ? new Date(booking.travelStartDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" }) : "N/A";
  const travelEnd = booking.travelEndDate ? new Date(booking.travelEndDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "long", day: "numeric" }) : "N/A";

  const body = `
    <!-- Greeting -->
    <h1 style="font-family:Georgia,'Times New Roman',serif; font-size:24px; color:#1a1a2e; margin:0 0 8px 0;">
      Booking Updated 🔄
    </h1>
    <p style="font-size:15px; color:#555; line-height:24px; margin:0 0 24px 0;">
      Hello <strong>${booking.fullName}</strong>, we have updated your booking details for your upcoming trip with Richworld Safaris.
    </p>

    <!-- Divider -->
    <div style="height:1px; background:linear-gradient(90deg, transparent, #c9a84c, transparent); margin:0 0 24px 0;"></div>

    <!-- Package highlight -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f4; border-radius:8px; margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px; text-align:center;">
          <div style="font-size:11px; color:#c9a84c; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin-bottom:6px;">YOUR PACKAGE</div>
          <div style="font-size:20px; font-weight:700; color:#1a1a2e; font-family:Georgia,'Times New Roman',serif;">${booking.selectedPackage || booking.packageName || 'Custom Package'}</div>
        </td>
      </tr>
    </table>

    <!-- Booking details table -->
    <p style="font-size:14px; font-weight:bold; color:#1a1a2e; margin:0 0 12px 0;">Here are your current booking details:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #f0ebe3; border-radius:8px; overflow:hidden;">
      ${detailRow("Booking ID", booking.bookingId || booking._id)}
      ${detailRow("Full Name", booking.fullName)}
      ${detailRow("Email", booking.email)}
      ${detailRow("Phone", booking.phone)}
      ${detailRow("Travel Dates", `${travelStart} — ${travelEnd}`)}
      ${detailRow("Adults", booking.numberOfAdults || booking.adults || 0)}
      ${detailRow("Children", booking.numberOfChildren || booking.children || 0)}
      ${booking.amount || booking.totalAmount ? detailRow("Amount", \`KES \${Number(booking.amount || booking.totalAmount).toLocaleString()}\`) : ""}
      ${booking.specialRequests ? detailRow("Special Requests", booking.specialRequests) : ""}
    </table>

    <!-- Call to action note -->
    <div style="margin-top:28px; padding:20px 24px; background:#f0fdf4; border-left:4px solid #16a34a; border-radius:0 8px 8px 0;">
      <p style="margin:0; font-size:14px; color:#166534; line-height:22px;">
        ✅ Your booking details have been successfully saved. No further action is required from you unless specified otherwise.
      </p>
    </div>

    <p style="font-size:13px; color:#888; margin-top:24px; line-height:20px;">
      If you have any questions, simply reply to this email or reach us at <a href="mailto:info@richworldsafaris.com" style="color:#c9a84c; text-decoration:none; font-weight:600;">info@richworldsafaris.com</a>.
    </p>
  `;

  return baseLayout("Booking Updated — Richworld Safaris", body);
}

module.exports = {
  bookingConfirmationTemplate,
  bookingNotificationTemplate,
  paymentLinkTemplate,
  verificationCodeTemplate,
  bookingUpdatedTemplate,
};
