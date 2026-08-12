const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
  },
  customerPhone: {
    type: String,
  },
  packageName: {
    type: String,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  depositPercentage: {
    type: Number,
  },
  depositAmount: {
    type: Number,
  },
  paymentDetails: {
    type: String,
  },
  status: {
    type: String,
    enum: ['unpaid', 'partially_paid', 'paid', 'cancelled'],
    default: 'unpaid',
  },
  currency: {
    type: String,
    default: 'USD',
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
