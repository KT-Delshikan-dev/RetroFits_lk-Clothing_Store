const express = require('express');
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

/**
 * Product Routes
 */

// Public routes
router.get('/', productController.getProducts);
router.get('/subcategories', productController.getSubcategories);
router.get('/:id', productController.getProductById);

// Admin only routes
router.post('/', protect, authorize('admin'), upload.array('images', 4), handleMulterError, productController.createProduct);
router.put('/:id', protect, authorize('admin'), upload.array('images', 4), handleMulterError, productController.updateProduct);
router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);
router.delete('/:id/images/:index', protect, authorize('admin'), productController.removeProductImage);

module.exports = router;
