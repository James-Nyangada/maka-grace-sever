const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.PAYSTACK_URL || 'https://api.paystack.co';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        'Content-Type': 'application/json'
    }
});

/**
 * 1. Initialize Transaction
 * Generates the Checkout Link
 */
exports.initializePayment = async (data) => {
    try {
        const { amount, email, ref, callbackUrl, phone } = data;

        // Generate unique reference per attempt to avoid Paystack duplicate reference errors
        const uniqueRef = `${ref}_${Date.now()}`;

        const response = await api.post('/transaction/initialize', {
            email: email,
            amount: Math.ceil(amount * 100), // CRITICAL: Convert to kobo/cents. Using Math.ceil to avoid floating point issues
            reference: uniqueRef, // Unique per payment attempt
            currency: 'KES',
            callback_url: callbackUrl, // Where user goes after payment
            channels: ['card', 'mobile_money'], // Explicitly allow M-Pesa & Card
            metadata: {
                custom_fields: [
                    {
                        display_name: "Order ID",
                        variable_name: "order_id",
                        value: ref
                    },
                    {
                        display_name: "Phone Number",
                        variable_name: "phone_number",
                        value: phone || ""
                    }
                ]
            }
        });

        return response.data.data; // Contains { authorization_url, access_code, reference }
    } catch (error) {
        console.error("Paystack Init Error:", error.response?.data || error.message);
        throw new Error("Payment initialization failed");
    }
};

/**
 * 2. Verify Transaction
 * Called by the Frontend Redirect or Webhook to confirm status
 */
exports.verifyPayment = async (reference) => {
    try {
        const response = await api.get(`/transaction/verify/${reference}`);
        return response.data.data; // Contains status: 'success' | 'failed' | 'abandoned'
    } catch (error) {
        console.error("Paystack Verify Error:", error.response?.data || error.message);
        throw new Error("Payment verification failed");
    }
};
/**
 * 3. Create Payment Page
 * For open-amount payments
 */
exports.createPaymentPage = async (data) => {
    try {
        const { name, description, amount, email } = data;
        const response = await api.post('/page', {
            name: name || "Payment to Richworld Safaris",
            description: description || "Custom Payment",
            amount: amount ? Math.ceil(amount * 100) : undefined, // Open amount if not provided
            // collect_phone: true
        });
        return response.data.data; // Contains { name, slug, url, ... }
    } catch (error) {
        console.error("Paystack Page Error:", error.response?.data || error.message);
        throw new Error("Failed to create payment page");
    }
};
