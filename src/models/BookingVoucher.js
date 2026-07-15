const mongoose = require("mongoose");

const bookingVoucherSchema = new mongoose.Schema(
  {
    voucherId: {
      type: String,
      unique: true,
    },
    hotelLodge: {
      type: String,
      required: true,
      trim: true,
    },
    from: {
      type: String,
      required: true,
      trim: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    nationality: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    roomType: {
      type: String,
      required: true,
      trim: true,
    },
    mealPlan: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: 0,
    },
    numberOfAdults: {
      type: Number,
      required: true,
      min: 0,
    },
    numberOfChildren: {
      type: Number,
      default: 0,
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1,
    },
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-generate sequential voucherId before saving
bookingVoucherSchema.pre("save", async function (next) {
  if (this.isNew && !this.voucherId) {
    try {
      const lastVoucher = await mongoose
        .model("BookingVoucher")
        .findOne({})
        .sort({ createdAt: -1 });

      let nextId = 1;
      if (lastVoucher && lastVoucher.voucherId) {
        const lastNum = parseInt(lastVoucher.voucherId, 10);
        if (!isNaN(lastNum)) {
          nextId = lastNum + 1;
        }
      }

      this.voucherId = String(nextId).padStart(4, "0");
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const BookingVoucher = mongoose.model("BookingVoucher", bookingVoucherSchema);

module.exports = BookingVoucher;
