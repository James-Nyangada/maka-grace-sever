const mongoose = require('mongoose');
const slugify = require('slugify');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  excerpt: {
    type: String,
    maxLength: 300,
  },
  content: {
    type: String,
  },
  category: {
    type: String,
  },
  thumbnailUrl: {
    type: String,
  },
  author: {
    type: String,
    default: 'Maka Grace Team',
  },
  tags: [{
    type: String,
  }],
  isPublished: {
    type: Boolean,
    default: false,
  },
  publishedAt: {
    type: Date,
  },
  readTime: {
    type: Number,
  },
  views: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Pre-save hook to generate slug
BlogSchema.pre('save', async function(next) {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    
    let uniqueSlug = baseSlug;
    let count = 1;
    let existingPost = await mongoose.models.Blog.findOne({ slug: uniqueSlug });
    
    // Check for collision
    while (existingPost && existingPost._id.toString() !== this._id.toString()) {
      uniqueSlug = `${baseSlug}-${++count}`;
      existingPost = await mongoose.models.Blog.findOne({ slug: uniqueSlug });
    }
    
    this.slug = uniqueSlug;
  }
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);
