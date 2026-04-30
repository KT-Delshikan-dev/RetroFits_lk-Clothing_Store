const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const { upload, handleMulterError } = require('../middleware/upload');
const router = express.Router();

// User routes
router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrder);
router.post('/:id/slip', protect, upload.single('slip'), handleMulterError, orderController.uploadPaymentSlip);
router.delete('/:id/cancel', protect, orderController.cancelOrder);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);
router.put('/:id/payment', protect, authorize('admin'), orderController.updatePaymentStatus);
router.delete('/:id', protect, authorize('admin'), orderController.deleteOrder);

module.exports = router;