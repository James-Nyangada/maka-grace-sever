const mongoose = require("mongoose");

const accommodationSchema = new mongoose.Schema(
  {
    hotel: { type: String, required: true, trim: true },
    roomType: { type: String, required: true, trim: true },
    units: { type: Number, required: true, min: 1 },
    nights: { type: Number, required: true, min: 1 },
    foodPlan: { type: String, trim: true, default: "" },
    meals: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const destinationSchema = new mongoose.Schema(
  {
    hotel: { type: String, required: true, trim: true },
    hotelName: { type: String, required: true, trim: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
  },
  { _id: false }
);

const reservationVoucherSchema = new mongoose.Schema(
  {
    voucherNumber: { type: String, unique: true },
    bookingNames: { type: String, required: true, trim: true },
    residency: { type: String, trim: true, default: "Non-Residents" },
    numberOfAdults: { type: Number, required: true, min: 0 },
    teenagers: { type: String, trim: true, default: "" },
    numberOfChildren: { type: String, trim: true, default: "" },
    childrenDetails: { type: String, trim: true, default: "" },
    whoToCharge: { type: String, trim: true, default: "" },
    voucherDate: { type: Date, default: Date.now },
    createdByName: { type: String, trim: true, default: "" },
    createdByEmail: { type: String, trim: true, default: "" },
    destinations: {
      type: [destinationSchema],
      validate: [(v) => v.length > 0, "At least one destination is required"],
    },
    accommodations: {
      type: [accommodationSchema],
      validate: [(v) => v.length > 0, "At least one accommodation is required"],
    },
    extras: { type: String, trim: true, default: "" },
    transfers: { type: String, trim: true, default: "" },
    specialInstructions: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
const randomNumber = () =>
  "V" + Array.from({ length: 6 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");

reservationVoucherSchema.pre("save", async function (next) {
  if (this.isNew && !this.voucherNumber) {
    try {
      const Model = mongoose.model("ReservationVoucher");
      let candidate;
      do {
        candidate = randomNumber();
      } while (await Model.exists({ voucherNumber: candidate }));
      this.voucherNumber = candidate;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("ReservationVoucher", reservationVoucherSchema);
