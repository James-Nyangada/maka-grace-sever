const BookingVoucher = require("../models/BookingVoucher");

// Create a new booking voucher
exports.createBookingVoucher = async (req, res) => {
  try {
    const voucher = new BookingVoucher(req.body);
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    console.error("Create Voucher Error:", err);
    res.status(400).json({ error: err.message });
  }
};

// Get all booking vouchers
exports.getAllBookingVouchers = async (req, res) => {
  try {
    const vouchers = await BookingVoucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single booking voucher by ID
exports.getBookingVoucherById = async (req, res) => {
  try {
    const voucher = await BookingVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a booking voucher
exports.deleteBookingVoucher = async (req, res) => {
  try {
    const voucher = await BookingVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
