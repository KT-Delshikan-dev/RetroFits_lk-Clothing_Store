const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', protect, [
  body('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
  body('items.*.product').notEmpty().withMessage('Product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('deliveryAddress.name').notEmpty().withMessage('Delivery name is required'),
  body('deliveryAddress.phone').notEmpty().withMessage('Delivery phone is required'),
  body('deliveryAddress.street').notEmpty().withMessage('Street address is required'),
  body('deliveryAddress.city').notEmpty().withMessage('City is required'),
  body('deliveryAddress.state').notEmpty().withMessage('State is required'),
  body('deliveryAddress.zipCode').notEmpty().withMessage('Zip code is required'),
  body('payment.method').isIn(['card', 'cod']).withMessage('Invalid payment method')
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
      items,
      deliveryAddress,
      payment,
      notes
    } = req.body;

    // Validate and get product details
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" is no longer available`
        });
      }

      // Check size-specific stock if applicable
      if (item.size && product.sizes.length > 0) {
        const sizeData = product.sizes.find(s => s.name === item.size);
        if (!sizeData || sizeData.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Not enough stock for "${product.name}" in size ${item.size}. Available: ${sizeData?.stock || 0}`
          });
        }
        // Decrement size stock
        sizeData.stock -= item.quantity;
      } else if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.name}". Available: ${product.stock}`
        });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        image: product.images[0]?.url || ''
      });

      subtotal += product.price * item.quantity;

      // Update total stock
      product.stock -= item.quantity;
      
      // Mark sizes as modified for Mongoose to detect changes in the array
      if (item.size) {
        product.markModified('sizes');
      }
      
      await product.save();

    }

    // Calculate pricing
    const shipping = subtotal > 5000 ? 0 : 250; // Free shipping over LKR 5000
    const tax = 0; // Removed tax
    const discount = 0;
    const total = subtotal + shipping + tax - discount;

    // Generate order number
    const orderNumber = await Order.generateOrderNumber();

    // Create order
    const order = await Order.create({
      user: req.user.id,
      orderNumber,
      items: orderItems,
      deliveryAddress,
      payment: {
        method: payment.method,
        status: payment.method === 'card' ? 'pending' : 'pending'
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        discount,
        total
      },
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        note: 'Order placed successfully'
      }],
      notes
    });

    // Populate product details
    await order.populate('user', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
      bill: order.generateBill()
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    let query = { user: req.user.id };
    
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .sort('-createdAt')
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order or is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order'
      });
    }

    res.json({
      success: true,
      data: order,
      bill: order.generateBill()
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, authorize('admin'), [
  body('status').isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = status;
    if (note) {
      order.statusHistory.push({
        status,
        note
      });
    }

    // If delivered, mark payment as completed
    if (status === 'delivered') {
      order.payment.status = 'completed';
      order.payment.paidAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated',
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   PUT /api/orders/:id/payment
// @desc    Update payment status (Mock Stripe)
// @access  Private
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Mock payment processing
    order.payment.status = 'completed';
    order.payment.transactionId = transactionId || `TXN${Date.now()}`;
    order.payment.paidAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: 'Payment successful',
      data: order
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/orders/:id/cancel
// @desc    Cancel order
// @access  Private
router.delete('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Can only cancel pending or confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this order'
      });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    order.status = 'cancelled';
    order.payment.status = 'refunded';
    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   GET /api/orders/admin/all
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/admin/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort(sort)
      .limit(Number(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    // Get order statistics
    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' }
        }
      }
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/orders/:id/sms
// @desc    Send SMS confirmation (Mock Twilio)
// @access  Private/Admin
router.post('/:id/sms', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Mock SMS sending
    console.log(`Mock SMS to ${order.user.phone}:`);
    console.log(`Order ${order.orderNumber} - Status: ${order.status}`);
    console.log(`Total: LKR ${order.pricing.total}`);

    order.smsSent = true;
    await order.save();

    res.json({
      success: true,
      message: 'SMS sent successfully (mock)'
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order (Admin only)
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

module.exports = router;