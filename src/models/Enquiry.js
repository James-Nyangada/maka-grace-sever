const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  destination: {
    type: String,
    trim: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isReplied: {
    type: Boolean,
    default: false,
  },
  repliedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('Enquiry', EnquirySchema);
