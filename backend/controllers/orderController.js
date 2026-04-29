const orderService = require('../services/orderService');

const orderController = {
    async createOrder(req, res) {
        try {
            const order = await orderService.createOrder({ ...req.body, user: req.user.id });
            res.status(201).json({ success: true, data: order });
        } catch (error) {
            console.error('Order creation error in controller:', error);
            res.status(400).json({ 
                success: false, 
                message: 'Failed to create order', 
                error: error.message,
                details: error.response?.message || error.response || null
            });
        }
    },

    async getMyOrders(req, res) {
        try {
            const orders = await orderService.getUserOrders(req.user.id);
            res.json({ success: true, data: orders });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
    },

    async getOrder(req, res) {
        try {
            const order = await orderService.getOrderById(req.params.id);
            if (order.user !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            }
            res.json({ success: true, data: order });
        } catch (error) {
            res.status(404).json({ success: false, message: 'Order not found' });
        }
    },

    async getAllOrders(req, res) {
        try {
            const { status, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            
            const result = await orderService.getAllOrders({ status, limit: parseInt(limit), offset });
            res.json({ 
                success: true, 
                data: result.orders,
                total: result.total,
                page: parseInt(page),
                totalPages: Math.ceil(result.total / limit)
            });
        } catch (error) {
            console.error('Error in getAllOrders:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch orders' });
        }
    },

    async updateOrderStatus(req, res) {
        try {
            const { status } = req.body;
            const order = await orderService.updateOrderStatus(req.params.id, status);
            res.json({ success: true, message: 'Order status updated', data: order });
        } catch (error) {
            console.error('Error in updateOrderStatus:', error);
            res.status(400).json({ success: false, message: 'Failed to update order status' });
        }
    },

    async deleteOrder(req, res) {
        try {
            await orderService.deleteOrder(req.params.id);
            res.json({ success: true, message: 'Order deleted successfully' });
        } catch (error) {
            console.error('Error in deleteOrder:', error);
            res.status(500).json({ success: false, message: 'Failed to delete order' });
        }
    }
};

module.exports = orderController;
