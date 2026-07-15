const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    totalAmount: {
        type: Number,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'PENDING', // PENDING, PAID, FAILED
        enum: ['PENDING', 'PAID', 'FAILED']
    },
    pesapalTrackingId: {
        type: String
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
