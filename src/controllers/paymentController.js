const PaystackService = require('../services/paystackService');
const Booking = require('../models/Booking'); 
const crypto = require('crypto');

/**
 * GET /api/payments/verify/:reference
 * Called by the frontend success page after Paystack redirects back.
 * Verifies the transaction with Paystack and updates the booking.
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { reference } = req.params;
        
        // 1. Verify with Paystack API
        const paymentData = await PaystackService.verifyPayment(reference);
        
        // 2. Extract booking ID from reference (format: bookingId_timestamp)
        const bookingId = reference.split('_')[0];

        if (bookingId === 'MANUAL') {
            if (paymentData.status === 'success') {
                console.log(`✅ Manual Payment verified: ${reference}`);
                return res.json({ 
                    message: "Payment verified successfully", 
                    paymentStatus: 'paid'
                });
            } else {
                console.log(`❌ Manual Payment verification failed: ${paymentData.status}`);
                return res.status(400).json({ 
                    error: "Payment not successful", 
                    status: paymentData.status 
                });
            }
        }
        
        if (paymentData.status === 'success') {
            // 3. Update booking: confirmed + paid
            const booking = await Booking.findByIdAndUpdate(bookingId, {
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentMethod: paymentData.channel || 'Paystack',
                paystackReference: reference,
            }, { new: true });

            if (!booking) {
                return res.status(404).json({ error: "Booking not found" });
            }

            console.log(`✅ Payment verified & booking confirmed: ${bookingId}`);
            return res.json({ 
                message: "Payment verified successfully", 
                booking,
                paymentStatus: 'paid',
                bookingStatus: 'confirmed'
            });
        } else {
            // Payment was not successful
            await Booking.findByIdAndUpdate(bookingId, {
                paymentStatus: 'failed',
            });
            
            console.log(`❌ Payment verification failed for ${bookingId}: ${paymentData.status}`);
            return res.status(400).json({ 
                error: "Payment not successful", 
                status: paymentData.status 
            });
        }
    } catch (error) {
        console.error("Verify Payment Error:", error.message);
        res.status(500).json({ error: "Payment verification failed" });
    }
};

/**
 * POST /api/payments/webhook
 * Paystack sends a POST request here when payment status changes.
 * This is a backup — the primary verification happens via the redirect callback.
 */
exports.webhook = async (req, res) => {
    // 1. Validate Signature (Security)
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return res.status(500).send("Server Misconfigured");

    const hash = crypto.createHmac('sha512', secret)
                       .update(JSON.stringify(req.body))
                       .digest('hex');

    if (hash !== req.headers['x-paystack-signature']) {
        return res.status(400).send('Invalid Signature');
    }

    // 2. Process Event
    const event = req.body;
    if (event.event === 'charge.success') {
        const { reference } = event.data;
        // Reference format: bookingId_timestamp
        const bookingId = reference.split('_')[0];
        
        if (bookingId === 'MANUAL') {
            console.log(`[Webhook] Manual Payment Successful (ref: ${reference})`);
            return res.sendStatus(200);
        }
        
        console.log(`[Webhook] Payment Successful for Booking: ${bookingId} (ref: ${reference})`);
        
        try {
            await Booking.findByIdAndUpdate(bookingId, { 
                status: 'confirmed',
                paymentStatus: 'paid',
                paymentMethod: event.data.channel, // 'card' or 'mobile_money'
                paystackReference: reference,
            });
        } catch (err) {
            console.error("Error updating booking:", err);
        }
    }

    res.sendStatus(200); // Always return 200 OK
};

/**
 * POST /api/payments/generate-link
 * Generates a manual payment link for clients
 */
exports.generatePaymentLink = async (req, res) => {
    try {
        const { amount, email, phone, description } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        // If amount is provided, use initializePayment (specific transaction)
        // If amount is NOT provided, use createPaymentPage (open amount link)
        if (amount) {
            const ref = `MANUAL_${crypto.randomBytes(4).toString('hex')}`;
            const paymentData = await PaystackService.initializePayment({
                amount,
                email,
                phone,
                ref,
                callbackUrl: process.env.APP_BASE_URL ? `${process.env.APP_BASE_URL}` : 'https://richworldsafaris.com'
            });

            console.log("Paystack Initialize Success:", paymentData.authorization_url);

            return res.json({
                message: "Specific payment link generated",
                paymentUrl: paymentData.authorization_url,
                reference: paymentData.reference
            });
        } else {
            // Open amount link using Payment Page
            const pageData = await PaystackService.createPaymentPage({
                name: `Payment for ${email}`,
                description: description || "Custom payment to Richworld Safaris",
                email
            });

            console.log("Paystack Page Success:", pageData.hosted_url || pageData.url);

            return res.json({
                message: "Open-amount payment link generated",
                paymentUrl: pageData.hosted_url || pageData.url, // Try hosted_url fallback
                slug: pageData.slug
            });
        }
    } catch (error) {
        console.error("Generate Payment Link Error:", error.message);
        res.status(500).json({ error: "Failed to generate payment link" });
    }
};
