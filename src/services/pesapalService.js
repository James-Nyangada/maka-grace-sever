const axios = require('axios');

// Select URL based on Environment
const BASE_URL = process.env.PESAPAL_ENV === 'live' 
    ? process.env.PESAPAL_URL_LIVE 
    : process.env.PESAPAL_URL_SANDBOX;

/**
 * 1. Authenticate and get Bearer Token
 * Tokens expire in 5 minutes. Call this before every transaction.
 */
const getPesapalToken = async () => {
    try {
        const response = await axios.post(`${BASE_URL}/Auth/GetPesapalToken`, {
            consumer_key: process.env.PESAPAL_KEY,
            consumer_secret: process.env.PESAPAL_SECRET
        }, {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });
        return response.data.token;
    } catch (error) {
        console.error("PesaPal Auth Error:", error.response?.data || error.message);
        throw new Error("Failed to authenticate with PesaPal");
    }
};

/**
 * 2. Register IPN (Instant Payment Notification)
 * This connects a transaction to a specific URL on our server.
 */
const registerIPN = async (token) => {
    try {
        const response = await axios.post(`${BASE_URL}/URLSetup/RegisterIPN`, {
            url: `${process.env.APP_BASE_URL}/api/payments/ipn`, // Our Webhook Route
            ipn_notification_type: 'GET'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.ipn_id; 
    } catch (error) {
        // If IPN is already registered, PesaPal might return the existing ID or error.
        // In a robust app, cache this IPN_ID in Redis or Config to avoid re-registering.
        console.error("IPN Registration Error:", error.response?.data);
        throw error;
    }
};

/**
 * 3. Submit Order Request
 * Sends customer & amount details to PesaPal and gets a Redirect URL.
 */
const submitOrder = async (orderDeps) => {
    const { amount, email, phone, name, ref } = orderDeps;
    const token = await getPesapalToken();
    const ipn_id = await registerIPN(token); 

    const payload = {
        id: ref, // Unique Merchant Reference (e.g., ORDER_123)
        currency: "KES",
        amount: amount,
        description: `Payment for Order ${ref}`,
        callback_url: `${process.env.APP_BASE_URL}/payment-success`, // UI Redirect after payment
        notification_id: ipn_id, // Connects to the Webhook
        billing_address: {
            email_address: email,
            phone_number: phone, // Crucial for auto-populating M-Pesa Prompt
            first_name: name,
            country_code: "KE"
        }
    };

    const response = await axios.post(`${BASE_URL}/Transactions/SubmitOrderRequest`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });

    return response.data; // Contains { redirect_url, order_tracking_id }
};

/**
 * 4. Get Transaction Status
 * Used by the IPN route to verify payment status.
 */
const getTransactionStatus = async (orderTrackingId) => {
    const token = await getPesapalToken();
    const response = await axios.get(`${BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

module.exports = { submitOrder, getTransactionStatus };
