const Booking = require('../models/Booking');
const Package = require('../models/Package');
const Enquiry = require('../models/Enquiry');
const Testimonial = require('../models/Testimonial');
const Blog = require('../models/Blog');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
      totalPackages,
      activePackages,
      totalEnquiries,
      unreadEnquiries,
      totalTestimonials,
      approvedTestimonials,
      publishedBlogPosts,
      bookingsThisMonth,
      bookingsLastMonth,
      topPackages
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Package.countDocuments(),
      Package.countDocuments({ isActive: true }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ isRead: false }),
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ isApproved: true }),
      Blog.countDocuments({ isPublished: true }),
      Booking.countDocuments({ createdAt: { $gte: firstDayThisMonth } }),
      Booking.countDocuments({ createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth } }),
      Package.find().sort({ views: -1, reviewCount: -1 }).limit(5).select('name views reviewCount rating')
    ]);

    res.status(200).json({
      bookings: {
        total: totalBookings,
        pending: pendingBookings,
        confirmed: confirmedBookings,
        cancelled: cancelledBookings,
        thisMonth: bookingsThisMonth,
        lastMonth: bookingsLastMonth
      },
      packages: {
        total: totalPackages,
        active: activePackages,
        top: topPackages
      },
      enquiries: {
        total: totalEnquiries,
        unread: unreadEnquiries
      },
      testimonials: {
        total: totalTestimonials,
        approved: approvedTestimonials
      },
      blog: {
        published: publishedBlogPosts
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/dashboard/recent
const getRecent = async (req, res) => {
  try {
    const [recentBookings, recentEnquiries] = await Promise.all([
      Booking.find().sort({ createdAt: -1 }).limit(5),
      Enquiry.find().sort({ createdAt: -1 }).limit(5)
    ]);

    res.status(200).json({
      bookings: recentBookings,
      enquiries: recentEnquiries
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStats,
  getRecent
};
