const Blog = require('../models/Blog');
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

// GET /api/blog (public)
const getBlogs = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12 } = req.query;
    
    let query = { isPublished: true };
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Blog.countDocuments(query);

    res.status(200).json({
      blogs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/blog/:slug (public)
const getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOneAndUpdate(
      { slug: req.params.slug, isPublished: true },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/blog/admin/all (protected)
const getBlogsAdmin = async (req, res) => {
  try {
    const { isPublished, search, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    
    const blogs = await Blog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Blog.countDocuments(query);

    res.status(200).json({
      blogs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/blog/admin/:id (protected)
const getBlogByIdAdmin = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/blog (protected)
const createBlog = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.status) {
      data.isPublished = data.status === 'Published';
    }
    if (data.isPublished) {
      data.publishedAt = new Date();
    }
    if (req.file) {
      const cloudResult = await streamUpload(req.file.buffer, 'makagrace');
      data.thumbnailUrl = cloudResult.secure_url;
    }
    const blog = new Blog(data);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/blog/:id (protected)
const updateBlog = async (req, res) => {
  try {
    const data = { ...req.body };
    const existing = await Blog.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Blog post not found' });

    if (data.status) {
      data.isPublished = data.status === 'Published';
    }

    if (data.isPublished === true && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    if (req.file) {
      const cloudResult = await streamUpload(req.file.buffer, 'makagrace');
      data.thumbnailUrl = cloudResult.secure_url;
    }

    Object.assign(existing, data);
    await existing.save(); // triggers pre-save hook for slug regeneration if title changed

    res.status(200).json(existing);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PATCH /api/blog/:id/publish (protected)
const togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    
    blog.isPublished = !blog.isPublished;
    if (blog.isPublished && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
    
    await blog.save();
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/blog/:id (protected, super-admin only)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog post not found' });
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  getBlogsAdmin,
  getBlogByIdAdmin,
  createBlog,
  updateBlog,
  togglePublish,
  deleteBlog
};
