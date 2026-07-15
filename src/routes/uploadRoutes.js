const express = require('express');
const { uploadImage, uploadGallery, deleteImage } = require('../controllers/uploadController');
const upload = require('../middleware/uploadMiddleware');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

router.use(requireAuth);

router.post('/image', upload.single('image'), uploadImage);
router.post('/gallery', upload.array('images', 10), uploadGallery);
router.delete('/', deleteImage);

module.exports = router;
