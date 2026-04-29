const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// User routes
router.post('/', protect, orderController.createOrder);
router.get('/', protect, orderController.getMyOrders);
router.get('/:id', protect, orderController.getOrder);

// Admin routes
router.get('/admin/all', protect, authorize('admin'), orderController.getAllOrders);
router.put('/:id/status', protect, authorize('admin'), orderController.updateOrderStatus);
router.delete('/:id', protect, authorize('admin'), orderController.deleteOrder);

module.exports = router;