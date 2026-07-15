const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  nationality: {
    type: String,
  },
  country: {
    type: String,
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
  },
  packageName: {
    type: String,
  },
  travelDateFrom: {
    type: Date,
  },
  travelDateTo: {
    type: Date,
  },
  adults: {
    type: Number,
    min: 1,
  },
  children: {
    type: Number,
    default: 0,
  },
  childrenAges: {
    type: String,
  },
  accommodationPref: {
    type: String,
    enum: ['budget', 'midrange', 'luxury', null, ''],
  },
  specialRequests: {
    type: String,
  },
  howHeard: {
    type: String,
  },
  additionalNotes: {
    type: String,
  },
  agreedToTerms: {
    type: Boolean,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending',
  },
  depositPaid: {
    type: Boolean,
    default: false,
  },
  depositAmount: {
    type: Number,
  },
  paymentMethod: {
    type: String,
  },
  paymentReference: {
    type: String,
  },
  adminNotes: {
    type: String, // internal, never sent to customer
  },
  confirmationEmailSent: {
    type: Boolean,
    default: false,
  },
  adminNotificationSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Never return adminNotes in public output (but admin endpoints will need it, so we handle it at the controller level or specifically where needed, or we just keep it simple here and omit it in public routes)

module.exports = mongoose.model('Booking', BookingSchema);
