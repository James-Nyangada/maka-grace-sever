const express = require("express");
const router = express.Router();
const bookingVoucherController = require("../controllers/bookingVoucherController");

router.get("/", bookingVoucherController.getAllBookingVouchers);
router.post("/", bookingVoucherController.createBookingVoucher);
router.get("/:id", bookingVoucherController.getBookingVoucherById);
router.delete("/:id", bookingVoucherController.deleteBookingVoucher);

module.exports = router;
