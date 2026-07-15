const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  packageBooked: {
    type: String,
  },
  travelDate: {
    type: String,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
  },
  photoUrl: {
    type: String,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  platform: {
    type: String,
    enum: ['website', 'google', 'tripadvisor', 'facebook'],
    default: 'website',
  },
}, { timestamps: true });

module.exports = mongoose.model('Testimonial', TestimonialSchema);
