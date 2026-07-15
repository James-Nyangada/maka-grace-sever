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

const app = express();

// Enable CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.makagracetravel.co.ke',
  'https://makagracetravel.co.ke'
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
