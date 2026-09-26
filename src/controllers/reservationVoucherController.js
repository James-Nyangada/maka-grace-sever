const ReservationVoucher = require("../models/ReservationVoucher");

const EDITABLE = [
  "bookingNames", "residency", "numberOfAdults", "teenagers", "numberOfChildren",
  "childrenDetails", "whoToCharge", "voucherDate", "createdByName", "createdByEmail",
  "destinations", "accommodations", "extras", "transfers", "specialInstructions",
];

const pick = (body) =>
  EDITABLE.reduce((acc, k) => (body[k] !== undefined ? { ...acc, [k]: body[k] } : acc), {});

exports.createReservationVoucher = async (req, res) => {
  try {
    const voucher = new ReservationVoucher(pick(req.body));
    await voucher.save();
    res.status(201).json(voucher);
  } catch (err) {
    console.error("Create Reservation Voucher Error:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.getAllReservationVouchers = async (req, res) => {
  try {
    res.json(await ReservationVoucher.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReservationVoucherById = async (req, res) => {
  try {
    const voucher = await ReservationVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReservationVoucher = async (req, res) => {
  try {
    const voucher = await ReservationVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    voucher.set(pick(req.body));
    await voucher.save();
    res.json(voucher);
  } catch (err) {
    console.error("Update Reservation Voucher Error:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteReservationVoucher = async (req, res) => {
  try {
    const voucher = await ReservationVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) return res.status(404).json({ error: "Voucher not found" });
    res.json({ message: "Voucher deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
