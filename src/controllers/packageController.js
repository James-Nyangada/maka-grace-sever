const Package = require('../models/Package');

// GET /api/packages (public)
const getPackages = async (req, res) => {
  try {
    const { category, destination, minPrice, maxPrice, search, featured, page = 1, limit = 12, sort } = req.query;
    
    let query = { isActive: true, isDeleted: { $ne: true }, isDraft: { $ne: true } };

    if (category) query.category = category;
    if (featured === 'true') query.isFeatured = true;
    if (minPrice || maxPrice) {
      query.priceFrom = {};
      if (minPrice) query.priceFrom.$gte = Number(minPrice);
      if (maxPrice) query.priceFrom.$lte = Number(maxPrice);
    }
    if (destination) {
      query.destination = { $regex: destination, $options: 'i' };
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { overview: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = {};
    if (sort === 'price_asc') sortOptions.priceFrom = 1;
    else if (sort === 'price_desc') sortOptions.priceFrom = -1;
    else if (sort === 'rating') sortOptions.rating = -1;
    else sortOptions.createdAt = -1; // newest by default

    const skip = (Number(page) - 1) * Number(limit);
    
    const packages = await Package.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Package.countDocuments(query);

    res.status(200).json({
      packages,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/packages/featured (public)
const getFeaturedPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true, isFeatured: true, isDeleted: { $ne: true }, isDraft: { $ne: true } }).limit(8);
    res.status(200).json(packages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/packages/:slug (public)
const getPackageBySlug = async (req, res) => {
  try {
    const pkg = await Package.findOne({ slug: req.params.slug, isActive: true, isDeleted: { $ne: true }, isDraft: { $ne: true } });
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/packages/:id/admin (protected)
const getPackageByIdAdmin = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) {
      return res.status(404).json({ error: 'Package not found' });
    }
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/packages (protected)
const createPackage = async (req, res) => {
  try {
    const newPackage = await Package.create(req.body);
    res.status(201).json(newPackage);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/packages/:id (protected)
const updatePackage = async (req, res) => {
  try {
    // If name changes, it will trigger the pre-save hook for slug regeneration because we use findById and save
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    
    Object.assign(pkg, req.body);
    await pkg.save();
    
    res.status(200).json(pkg);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// PATCH /api/packages/:id/toggle (protected)
const togglePackageActive = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    
    pkg.isActive = !pkg.isActive;
    await pkg.save();
    
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/packages/:id/feature (protected)
const togglePackageFeature = async (req, res) => {
  try {
    const pkg = await Package.findById(req.params.id);
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    
    pkg.isFeatured = !pkg.isFeatured;
    await pkg.save();
    
    res.status(200).json(pkg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/packages/:id/view (public)
const incrementPackageView = async (req, res) => {
  try {
    await Package.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.status(200).json({ message: 'View incremented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/packages/:id (super-admin only)
const deletePackage = async (req, res) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// For Admin Table (GET all packages including inactive)
const getAllPackagesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const packages = await Package.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
      
    const total = await Package.countDocuments({ isDeleted: { $ne: true } });
    
    res.status(200).json({
      packages,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPackages,
  getFeaturedPackages,
  getPackageBySlug,
  getPackageByIdAdmin,
  createPackage,
  updatePackage,
  togglePackageActive,
  togglePackageFeature,
  incrementPackageView,
  deletePackage,
  getAllPackagesAdmin
};
