const Booking = require('../models/Booking');
const { 
  sendBookingReceivedEmail, 
  sendNewBookingNotification, 
  sendBookingConfirmedEmail, 
  sendBookingCompletedEmail,
  sendBookingCancelledEmail,
  sendBookingUpdatedEmail,
  sendCustomEmail 
} = require('../services/emailService');

// POST /api/bookings (public)
const createBooking = async (req, res) => {
  try {
    const booking = new Booking({
      ...req.body,
      status: 'pending'
    });
    await booking.save();

    // Send emails without blocking the response
    Promise.all([
      sendBookingReceivedEmail(booking).then(result => {
        if (result.success) {
          booking.confirmationEmailSent = true;
        }
      }),
      sendNewBookingNotification(booking).then(result => {
        if (result.success) {
          booking.adminNotificationSent = true;
        }
      })
    ]).then(() => booking.save()).catch(err => console.error('Email promises failed:', err));

    res.status(201).json({ message: 'Booking created successfully', booking });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// GET /api/bookings (protected)
const getBookings = async (req, res) => {
  try {
    const { status, search, dateFrom, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (dateFrom) query.travelDateFrom = { $gte: new Date(dateFrom) };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Booking.countDocuments(query);

    res.status(200).json({
      bookings,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/bookings/export (protected)
const exportBookings = async (req, res) => {
  try {
    const { status, search, dateFrom } = req.query;
    let query = {};
    if (status) query.status = status;
    if (dateFrom) query.travelDateFrom = { $gte: new Date(dateFrom) };
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const bookings = await Booking.find(query).sort({ createdAt: -1 });

    const csvLines = [
      'ID,Full Name,Email,Phone,Nationality,Country,Package,Travel Date From,Travel Date To,Adults,Children,Accommodation,Status,Deposit Paid,Created At'
    ];

    bookings.forEach(b => {
      const line = [
        b._id,
        `"${b.fullName || ''}"`,
        `"${b.email || ''}"`,
        `"${b.phone || ''}"`,
        `"${b.nationality || ''}"`,
        `"${b.country || ''}"`,
        `"${b.packageName || ''}"`,
        b.travelDateFrom ? b.travelDateFrom.toISOString().split('T')[0] : '',
        b.travelDateTo ? b.travelDateTo.toISOString().split('T')[0] : '',
        b.adults || 0,
        b.children || 0,
        b.accommodationPref || '',
        b.status || '',
        b.depositPaid ? 'Yes' : 'No',
        b.createdAt ? b.createdAt.toISOString().split('T')[0] : ''
      ];
      csvLines.push(line.join(','));
    });

    const csvData = csvLines.join('\n');
    const dateStr = new Date().toISOString().split('T')[0];
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bookings_${dateStr}.csv`);
    res.status(200).send(csvData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/bookings/:id (protected)
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/bookings/:id/status (protected)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const normalizedStatus = status.toLowerCase();
    booking.status = normalizedStatus;
    await booking.save();
    
    if (normalizedStatus === 'confirmed') {
      sendBookingConfirmedEmail(booking).catch(err => console.error('Confirmation email failed:', err));
    } else if (normalizedStatus === 'completed') {
      sendBookingCompletedEmail(booking).catch(err => console.error('Completed email failed:', err));
    } else if (normalizedStatus === 'cancelled') {
      sendBookingCancelledEmail(booking).catch(err => console.error('Cancelled email failed:', err));
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/bookings/:id (protected)
const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    // Don't allow changing _id or createdAt
    const { _id, createdAt, ...updateData } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(
      bookingId, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Send email notification to user
    sendBookingUpdatedEmail(booking).catch(err => console.error('Update email failed:', err));

    res.status(200).json(booking);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};

// PUT /api/bookings/:id/notes (protected)
const updateBookingNotes = async (req, res) => {
  try {
    const { adminNotes } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id, 
      { adminNotes }, 
      { new: true }
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/bookings/:id/email (protected)
const sendBookingEmail = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const result = await sendCustomEmail(booking.email, subject, message);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send email', details: result.error });
    }

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/bookings/:id (super-admin only)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createBooking,
  getBookings,
  exportBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  updateBookingNotes,
  sendBookingEmail,
  deleteBooking
};