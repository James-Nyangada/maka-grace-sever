const express = require("express");
const multer = require("multer");
const {
  uploadGalleryImages,
  getAllGalleryImages,
  getVisibleGalleryImages,
  toggleVisibility,
  deleteGalleryImage,
} = require("../controllers/galleryController");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CRUD routes
router.post("/", upload.array("images"), uploadGalleryImages);
router.get("/", getAllGalleryImages);
router.get("/visible", getVisibleGalleryImages);
router.patch("/:id/visibility", toggleVisibility);
router.delete("/:id", deleteGalleryImage);

module.exports = router;
