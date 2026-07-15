const Gallery = require("../models/Gallery");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Helper: upload buffer to Cloudinary
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "gallery" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @desc Upload multiple gallery images
exports.uploadGalleryImages = async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    if (!caption || !caption.trim()) {
      return res.status(400).json({ message: "Caption is required" });
    }

    const savedImages = [];

    for (const file of req.files) {
      const result = await streamUpload(file.buffer);
      const galleryImage = await Gallery.create({
        imageUrl: result.secure_url,
        caption: caption.trim(),
        isVisible: false,
      });
      savedImages.push(galleryImage);
    }

    res.status(201).json(savedImages);
  } catch (error) {
    console.error("Error uploading gallery images:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc Get all gallery images (admin)
exports.getAllGalleryImages = async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching gallery images" });
  }
};

// @desc Get visible gallery images with pagination (frontend)
exports.getVisibleGalleryImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const total = await Gallery.countDocuments({ isVisible: true });
    const images = await Gallery.find({ isVisible: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      images,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalImages: total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching visible gallery images" });
  }
};

// @desc Toggle visibility of a gallery image
exports.toggleVisibility = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Gallery image not found" });
    }

    image.isVisible = !image.isVisible;
    await image.save();

    res.json(image);
  } catch (error) {
    res.status(500).json({ message: "Error toggling visibility", error: error.message });
  }
};

// @desc Update a gallery image
exports.updateGalleryImage = async (req, res) => {
  try {
    const { caption, isVisible } = req.body;
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Gallery image not found" });
    }

    if (caption !== undefined) {
      image.caption = caption.trim();
    }
    
    if (isVisible !== undefined) {
      image.isVisible = isVisible;
    }

    await image.save();
    res.json(image);
  } catch (error) {
    res.status(500).json({ message: "Error updating gallery image", error: error.message });
  }
};

// @desc Delete a gallery image
exports.deleteGalleryImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Gallery image not found" });
    }

    // Extract Cloudinary public_id from URL and delete from Cloudinary
    try {
      const urlParts = image.imageUrl.split("/");
      const fileWithExt = urlParts[urlParts.length - 1];
      const publicId = `gallery/${fileWithExt.split(".")[0]}`;
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudErr) {
      console.error("Error deleting from Cloudinary:", cloudErr);
      // Continue with DB deletion even if Cloudinary fails
    }

    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Gallery image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting gallery image" });
  }
};
