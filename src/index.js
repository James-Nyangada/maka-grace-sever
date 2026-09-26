const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
const dbConnect = require("./config/dbConnect");
const seedAdminUsers = require('./utilities/seeder');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const packageRoutes = require('./routes/packageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const blogRoutes = require('./routes/blogRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const settingRoutes = require('./routes/settingRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const bookingVoucherRoutes = require('./routes/bookingVoucherRoutes');
const reservationVoucherRoutes = require('./routes/reservationVoucherRoutes');

const app = express();

// Enable CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.makagracetravel.co.ke',
  'https://makagracetravel.co.ke',
  'https://dashboard.makagracetravel.co.ke'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../../server/public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/booking-vouchers', bookingVoucherRoutes);
app.use('/api/reservation-vouchers', reservationVoucherRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Maka Grace API is running');
});

// Global Error Handler (must be after all routes)
app.use(errorHandler);

// Start server and db connection
const PORT = process.env.PORT || 5000;

dbConnect().then(async () => {
  await seedAdminUsers();
  app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Database connection failed", err);
});
