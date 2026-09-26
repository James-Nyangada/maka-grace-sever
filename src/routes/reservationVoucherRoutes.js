const express = require("express");
const router = express.Router();
const c = require("../controllers/reservationVoucherController");

router.get("/", c.getAllReservationVouchers);
router.post("/", c.createReservationVoucher);
router.get("/:id", c.getReservationVoucherById);
router.put("/:id", c.updateReservationVoucher);
router.delete("/:id", c.deleteReservationVoucher);

module.exports = router;
