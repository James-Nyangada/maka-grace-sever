const express = require('express');
const {
  getBlogs,
  getBlogBySlug,
  getBlogsAdmin,
  getBlogByIdAdmin,
  createBlog,
  updateBlog,
  togglePublish,
  deleteBlog
} = require('../controllers/blogController');
const requireAuth = require('../middleware/authMiddleware');
const { requireSuperAdmin } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getBlogs);
router.get('/slug/:slug', getBlogBySlug);

// Protected routes
router.use(requireAuth);
router.get('/admin/all', getBlogsAdmin);
router.get('/admin/:id', getBlogByIdAdmin);
router.post('/', upload.single('coverImage'), createBlog);
router.put('/:id', upload.single('coverImage'), updateBlog);
router.patch('/:id/publish', togglePublish);

// Super-admin route
router.delete('/:id', requireSuperAdmin, deleteBlog);

module.exports = router;
