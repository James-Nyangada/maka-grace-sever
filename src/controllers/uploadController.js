const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Helper: upload buffer to Cloudinary
const streamUpload = (buffer, folder = 'makagrace') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// POST /api/upload/image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await streamUpload(req.file.buffer, 'makagrace');
    res.status(201).json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// POST /api/upload/gallery
const uploadGallery = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const urls = [];
    for (const file of req.files) {
      const result = await streamUpload(file.buffer, 'makagrace');
      urls.push(result.secure_url);
    }

    res.status(201).json({ urls });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/upload
const deleteImage = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'No URL provided' });
    }

    // Extract public_id from Cloudinary URL
    // e.g. https://res.cloudinary.com/xxx/image/upload/v123/makagrace/abc123.jpg
    // public_id = makagrace/abc123
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      const pathAfterUpload = parts[1]; // e.g. v123/makagrace/abc123.jpg
      // Remove the version prefix (v123/) if present
      const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
      // Remove file extension
      const publicId = withoutVersion.replace(/\.[^/.]+$/, '');

      const result = await cloudinary.uploader.destroy(publicId);
      return res.status(200).json({ message: 'File deleted successfully', result });
    }

    return res.status(400).json({ error: 'Invalid Cloudinary URL format' });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  uploadImage,
  uploadGallery,
  deleteImage
};
