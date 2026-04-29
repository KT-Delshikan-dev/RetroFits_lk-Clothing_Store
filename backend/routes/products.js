const express = require('express');
const { body, validationResult } = require('express-validator');
const productRepository = require('../repositories/productRepository');
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
      category,
      minPrice,
      maxPrice,
      search,
      featured,
      tags,
      subCategory
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build filter options for repository
    const filterOptions = {
        limit: parseInt(limit),
        offset,
        category,
        subCategory,
        minPrice,
        maxPrice,
        featured: featured === 'true' ? true : undefined,
        search,
        tags: tags ? tags.split(',') : undefined,
        isActive: (!req.user || req.user.role !== 'admin') ? true : undefined
    };

    // Execute query
    const { documents, total } = await productRepository.getAll(filterOptions);

    res.json({
      success: true,
      data: documents,
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
    // Appwrite doesn't support aggregation easily, so we'll fetch all active products
    // and group them in-memory. For a larger catalog, a separate collection is better.
    const { documents } = await productRepository.getAll({ limit: 5000, isActive: true });

    const result = {};
    documents.forEach(doc => {
      if (doc.category && doc.subCategory) {
        if (!result[doc.category]) {
          result[doc.category] = new Set();
        }
        result[doc.category].add(doc.subCategory);
      }
    });

    // Convert Sets back to Arrays
    const data = {};
    Object.keys(result).forEach(cat => {
      data[cat] = Array.from(result[cat]);
    });

    res.json({
      success: true,
      data
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
    const { documents } = await productRepository.getAll({
      category: req.params.category,
      isActive: true,
      limit: 100
    });

    res.json({
      success: true,
      data: documents
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
    const { documents } = await productRepository.getAll({
      featured: true,
      isActive: true,
      limit: 12
    });

    res.json({
      success: true,
      data: documents
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
    const product = await productRepository.getById(req.params.id);

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
  body('category').isIn(['Men', 'Women', 'Accessories', 'Jerseys']).withMessage('Invalid category'),
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

    const productData = {
      name,
      description,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
      images,
      category,
      subCategory,
      sizes: parsedSizes,
      colors: parsedColors,
      stock: totalStock,
      sku,
      tags: parsedTags,
      featured: featured === 'true',
      isActive: true
    };

    const product = await productRepository.create(productData);

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
  body('category').optional().isIn(['Men', 'Women', 'Accessories', 'Jerseys']).withMessage('Invalid category'),
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

    let product = await productRepository.getById(req.params.id);

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

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (originalPrice !== undefined) updateData.originalPrice = parseFloat(originalPrice);
    if (category !== undefined) updateData.category = category;
    if (subCategory !== undefined) updateData.subCategory = subCategory;
    if (sku !== undefined) updateData.sku = sku;

    if (sizes) {
      const parsedSizes = (sizes && sizes !== 'undefined' && sizes !== 'null') ? JSON.parse(sizes) : [];
      updateData.sizes = parsedSizes;
      updateData.stock = parsedSizes.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0);
    } else if (stock !== undefined) {
      updateData.stock = parseInt(stock) || 0;
    }

    if (colors) updateData.colors = (colors && colors !== 'undefined' && colors !== 'null') ? JSON.parse(colors) : [];
    if (tags) updateData.tags = (tags && tags !== 'undefined' && tags !== 'null') ? JSON.parse(tags) : [];
    if (featured !== undefined) updateData.featured = featured === 'true';
    if (isActive !== undefined) updateData.isActive = isActive === 'true';

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        alt: `${name || product.name} image`
      }));
      updateData.images = [...product.images, ...newImages];
    }

    const updatedProduct = await productRepository.update(req.params.id, updateData);

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
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
    const product = await productRepository.getById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    await productRepository.delete(req.params.id);

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
    const product = await productRepository.getById(req.params.id);

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
    const updatedImages = [...product.images];
    updatedImages.splice(index, 1);
    
    const updatedProduct = await productRepository.update(req.params.id, { images: updatedImages });

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: updatedProduct
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