const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products with filtering, sorting, and pagination
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = req.user && req.user.role === 'admin' ? 1000 : 12,
      sort = '-createdAt',
      category,
      minPrice,
      maxPrice,
      search,
      featured,
      tags,
      subCategory
    } = req.query;

    // Build query
    let query = {};
    
    // Only filter active products for non-admins
    if (!req.user || req.user.role !== 'admin') {
      query.isActive = true;
    }

    // Category filter
    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    // Sub-category filter
    if (subCategory) {
      query.subCategory = { $regex: new RegExp(`^${subCategory}$`, 'i') };
    }



    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Featured filter
    if (featured === 'true') {
      query.featured = true;
    }

    // Tags filter
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }

    // New Arrivals filter (Last 14 days + Featured)
    if (req.query.newArrivals === 'true') {
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      query.createdAt = { $gte: fourteenDaysAgo };
      query.featured = true; // Must be featured to be in new arrivals
      query.excludeFromNewArrivals = { $ne: true };
    }

    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    // Get total count
    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/products/subcategories
// @desc    Get all unique subcategories grouped by category
// @access  Public
router.get('/subcategories', async (req, res) => {
  try {
    const subcategories = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          subCategories: { $addToSet: "$subCategory" }
        }
      }
    ]);

    const result = {};
    subcategories.forEach(item => {
      if (item._id) {
        // Filter out null/empty strings
        result[item._id] = item.subCategories.filter(sub => sub && sub.trim() !== '');
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/products/category/:category
// @desc    Get products by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      isActive: true
    }).sort('-createdAt');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({
      featured: true,
      isActive: true
    }).limit(12).sort('category -createdAt');

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/products
// @desc    Create new product (Admin only)
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.array('images', 4), handleMulterError, [

  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').isIn(['Men', 'Women', 'Accessories', 'Footwear', 'Jerseys']).withMessage('Invalid category'),

  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subCategory,
      sizes,
      colors,
      stock,
      sku,
      tags,
      featured
    } = req.body;


    // Process uploaded images
    const images = req.files ? req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      alt: `${name} image`
    })) : [];

    // Parse JSON strings safely
    const parsedSizes = (sizes && sizes !== 'undefined' && sizes !== 'null') ? JSON.parse(sizes) : [];
    const parsedColors = (colors && colors !== 'undefined' && colors !== 'null') ? JSON.parse(colors) : [];
    const parsedTags = (tags && tags !== 'undefined' && tags !== 'null') ? JSON.parse(tags) : [];


    // Calculate total stock from sizes if provided
    let totalStock = parseInt(stock) || 0;
    if (parsedSizes.length > 0) {
      totalStock = parsedSizes.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
    }

    const product = await Product.create({
      name,
      description,
      price,
      originalPrice,
      images,
      category,
      subCategory,
      sizes: parsedSizes,
      colors: parsedColors,
      stock: totalStock,
      sku,
      tags: parsedTags,
      featured: featured === 'true'
    });



    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });

  }
});

// @route   PUT /api/products/:id
// @desc    Update product (Admin only)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.array('images', 4), handleMulterError, [

  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category').optional().isIn(['Men', 'Women', 'Accessories', 'Footwear', 'Jerseys']).withMessage('Invalid category'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')


], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const {
      name,
      description,
      price,
      originalPrice,
      category,
      subCategory,
      sizes,
      colors,
      stock,
      sku,
      tags,
      featured,
      isActive
    } = req.body;


    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (category !== undefined) product.category = category;

    
    if (sizes) {
      const parsedSizes = (sizes && sizes !== 'undefined' && sizes !== 'null') ? JSON.parse(sizes) : [];
      product.sizes = parsedSizes;
      // Update total stock from sizes
      product.stock = parsedSizes.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
    } else if (stock !== undefined) {
      product.stock = parseInt(stock) || 0;
    }

    if (colors) product.colors = (colors && colors !== 'undefined' && colors !== 'null') ? JSON.parse(colors) : [];
    if (sku) product.sku = sku;
    if (subCategory) product.subCategory = subCategory;
    if (tags) product.tags = (tags && tags !== 'undefined' && tags !== 'null') ? JSON.parse(tags) : [];


    if (featured !== undefined) product.featured = featured === 'true';
    if (isActive !== undefined) product.isActive = isActive === 'true';


    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: `${name || product.name} image`
      }));
      // Keep existing images and add new ones
      product.images = [...product.images, ...newImages];
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'

    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Hard delete
    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/products/:id/images/:imageIndex
// @desc    Remove an image from a product by index
// @access  Private/Admin
router.delete('/:id/images/:index', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0 || index >= product.images.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image index'
      });
    }

    // Remove the image at the specified index
    product.images.splice(index, 1);
    await product.save();

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: product
    });
  } catch (error) {
    console.error('Remove image error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});


module.exports = router;