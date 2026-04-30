const { ID, Query } = require('node-appwrite');
const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');

/**
 * Order Service
 */

const orderService = {
    async createOrder(orderData) {
        console.log('Creating order with data:', JSON.stringify(orderData, null, 2));
        
        // Generate Order Number
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 1000)}`;

        // Enrich items with prices and details
        const items = Array.isArray(orderData.items) ? orderData.items : [];
        const enrichedItems = await Promise.all(items.map(async (item) => {
            try {
                const product = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product);
                let imageUrl = null;
                if (product.images) {
                    try {
                        const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        imageUrl = Array.isArray(images) ? images[0]?.url : images?.url;
                    } catch (e) {}
                }
                return {
                    ...item,
                    name: product.name,
                    price: product.price,
                    image: imageUrl
                };
            } catch (error) {
                console.error(`Error enriching item ${item.product}:`, error.message);
                return item;
            }
        }));

        const preparedData = {
            user: orderData.user,
            orderNumber,
            items: JSON.stringify(enrichedItems),
            pricing: JSON.stringify(orderData.pricing || { subtotal: 0, shipping: 0, total: 0 }),
            deliveryAddress: JSON.stringify(orderData.deliveryAddress || {}),
            payment: JSON.stringify(orderData.payment || {}),
            paymentMethod: orderData.paymentMethod || orderData.payment?.method || 'unknown',
            statusHistory: JSON.stringify([{ status: 'pending', note: 'Order placed', timestamp: new Date().toISOString() }]),
            createdAt: new Date().toISOString(),
            status: orderData.status || 'pending'
        };

        console.log('Prepared Appwrite data:', JSON.stringify(preparedData, null, 2));

        try {
            const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.ORDERS, ID.unique(), preparedData);
            return this._formatOrder(doc);
        } catch (error) {
            console.error('Appwrite createDocument error:', error);
            throw error;
        }
    },

    async getUserOrders(userId) {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
            Query.equal('user', userId),
            Query.orderDesc('$createdAt')
        ]);
        return response.documents.map(doc => this._formatOrder(doc));
    },

    async getOrderById(orderId) {
        const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId);
        const order = this._formatOrder(doc);
        
        if (order.user) {
            try {
                const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS || 'users', order.user);
                order.user = {
                    id: userDoc.$id,
                    name: userDoc.name,
                    email: userDoc.email
                };
            } catch (e) {
                order.user = { id: order.user, name: 'Unknown User', email: 'N/A' };
            }
        }
        return order;
    },

    async getAllOrders(filters = {}) {
        const queries = [];
        if (filters.status) queries.push(Query.equal('status', filters.status));
        
        queries.push(Query.limit(filters.limit || 100));
        queries.push(Query.offset(filters.offset || 0));
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, queries);
        
        // Populate user details
        const orders = await Promise.all(response.documents.map(async (doc) => {
            const order = this._formatOrder(doc);
            if (order.user) {
                try {
                    const userDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS || 'users', order.user);
                    order.user = {
                        id: userDoc.$id,
                        name: userDoc.name,
                        email: userDoc.email
                    };
                } catch (e) {
                    console.error(`Error fetching user ${order.user}:`, e.message);
                    order.user = { id: order.user, name: 'Unknown User', email: 'N/A' };
                }
            }
            return order;
        }));

        return {
            orders,
            total: response.total
        };
    },

    async updateOrderStatus(orderId, status) {
        const order = await this.getOrderById(orderId);
        const statusHistory = order.statusHistory || [];
        statusHistory.push({
            status,
            note: `Status updated to ${status}`,
            timestamp: new Date().toISOString()
        });

        const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
            status,
            statusHistory: JSON.stringify(statusHistory)
        });
        return this._formatOrder(doc);
    },

    async updatePaymentStatus(orderId, paymentData) {
        const order = await this.getOrderById(orderId);
        const currentPayment = order.payment || {};
        
        const updatedPayment = {
            ...currentPayment,
            status: paymentData.status || currentPayment.status,
            transactionId: paymentData.transactionId || currentPayment.transactionId,
            slip: paymentData.slip || currentPayment.slip,
            updatedAt: new Date().toISOString()
        };

        const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
            payment: JSON.stringify(updatedPayment)
        });
        return this._formatOrder(doc);
    },

    async deleteOrder(orderId) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId);
        return true;
    },

    _formatOrder(doc) {
        const order = { ...doc, id: doc.$id };
        if (typeof order.items === 'string') try { order.items = JSON.parse(order.items); } catch(e){}
        if (typeof order.pricing === 'string') try { order.pricing = JSON.parse(order.pricing); } catch(e){}
        if (typeof order.deliveryAddress === 'string') try { order.deliveryAddress = JSON.parse(order.deliveryAddress); } catch(e){}
        if (typeof order.payment === 'string') try { order.payment = JSON.parse(order.payment); } catch(e){}
        if (typeof order.statusHistory === 'string') try { order.statusHistory = JSON.parse(order.statusHistory); } catch(e){}
        return order;
    }
};

module.exports = orderService;
