const Testimonial = require('../models/Testimonial');

// GET /api/testimonials (public)
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true }).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/testimonials/featured (public)
const getFeaturedTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: true, isFeatured: true }).limit(3);
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/testimonials/admin (protected)
const getTestimonialsAdmin = async (req, res) => {
  try {
    const { isApproved, isFeatured, platform } = req.query;
    let query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (platform) query.platform = platform;

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/testimonials (protected)
const createTestimonial = async (req, res) => {
  try {
    const testimonial = new Testimonial({ ...req.body, isApproved: false, isFeatured: false });
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/testimonials/submit (public)
const submitTestimonial = async (req, res) => {
  try {
    // We only take specific fields for security, ignoring any isApproved or isFeatured sent by the user
    const { name, location, packageBooked, travelDate, rating, review } = req.body;
    const testimonial = new Testimonial({
      name,
      location,
      packageBooked,
      travelDate,
      rating,
      review,
      isApproved: false,
      isFeatured: false,
      platform: 'website'
    });
    await testimonial.save();
    res.status(201).json({ message: 'Review submitted successfully and is pending approval.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/testimonials/:id (protected)
const updateTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    res.status(200).json(testimonial);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PATCH /api/testimonials/:id/approve (protected)
const toggleApprove = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    
    testimonial.isApproved = !testimonial.isApproved;
    if (!testimonial.isApproved) {
      testimonial.isFeatured = false; // Cannot be featured if not approved
    }
    await testimonial.save();
    
    res.status(200).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/testimonials/:id/feature (protected)
const toggleFeature = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    
    if (!testimonial.isApproved && !testimonial.isFeatured) {
      return res.status(400).json({ error: 'Only approved testimonials can be featured' });
    }

    testimonial.isFeatured = !testimonial.isFeatured;
    await testimonial.save();
    
    res.status(200).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/testimonials/:id (protected, super-admin only)
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' });
    res.status(200).json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTestimonials,
  getFeaturedTestimonials,
  getTestimonialsAdmin,
  createTestimonial,
  submitTestimonial,
  updateTestimonial,
  toggleApprove,
  toggleFeature,
  deleteTestimonial
};
