const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() { return !this.isDraft; },
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
  },
  destination: {
    type: String,
  },
  category: {
    type: String,
    enum: ['Safaris', 'Beach', 'Hiking', 'Cultural', 'Honeymoon', 'Corporate', 'Weekend', 'International'],
  },
  duration: {
    type: String,
  },
  groupSize: {
    type: String,
  },
  route: {
    type: String,
  },
  tourClass: {
    type: String,
  },
  highlights: [{ type: String }],
  packageActivities: [{ type: String }],
  pricing: [{
    title: { type: String },
    price: { type: Number },
    priceKSH: { type: Number }
  }],
  priceFrom: {
    type: Number,
  },
  priceFromKSH: {
    type: Number,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  badge: {
    type: String,
    enum: ['popular', 'limited', 'new', 'null', null, ''],
    default: 'null'
  },
  overview: {
    type: String,
  },
  itinerary: [{
    dayNumber: { type: Number },
    title: { type: String },
    description: { type: String },
    activities: [{ type: String }]
  }],
  inclusions: [{ type: String }],
  exclusions: [{ type: String }],
  meals: { type: String },
  transport: { type: String },
  accommodation: { type: String },
  imageUrl: { type: String },
  galleryUrls: [{ type: String }],
  isActive: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['active', 'on-offer', 'inactive'],
    default: 'active'
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isDraft: {
    type: Boolean,
    default: false,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Pre-save hook to create slug from name and calculate lowest price
PackageSchema.pre('save', async function(next) {
  if (this.pricing && this.pricing.length > 0) {
    const validPrices = this.pricing.map(p => p.price).filter(p => typeof p === 'number' && !isNaN(p));
    if (validPrices.length > 0) {
      this.priceFrom = Math.min(...validPrices);
    }
    const validPricesKSH = this.pricing.map(p => p.priceKSH).filter(p => typeof p === 'number' && !isNaN(p));
    if (validPricesKSH.length > 0) {
      this.priceFromKSH = Math.min(...validPricesKSH);
    }
  }

  if (this.isModified('name') || !this.slug) {
    let baseSlug = (this.name || 'draft-package')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
      
    let uniqueSlug = baseSlug;
    let count = 1;
    let existingPackage = await mongoose.models.Package.findOne({ slug: uniqueSlug });
    
    // Check for collision
    while (existingPackage && existingPackage._id.toString() !== this._id.toString()) {
      uniqueSlug = `${baseSlug}-${++count}`;
      existingPackage = await mongoose.models.Package.findOne({ slug: uniqueSlug });
    }
    
    this.slug = uniqueSlug;
  }
  next();
});

module.exports = mongoose.model('Package', PackageSchema);
