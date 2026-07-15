const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// GET /api/payments/verify/:reference (Frontend callback verification)
router.get('/payments/verify/:reference', paymentController.verifyPayment);

// POST /api/payments/webhook (The Webhook)
router.post('/payments/webhook', paymentController.webhook);

// POST /api/payments/generate-link (Generate manual payment link)
router.post('/payments/generate-link', paymentController.generatePaymentLink);

module.exports = router;
