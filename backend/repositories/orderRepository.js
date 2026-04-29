const { Query, ID } = require('node-appwrite');
const { databases, DB_ID, COLLECTIONS } = require('../utils/appwrite');

const orderRepository = {
    async getAll(queryOptions = {}) {
        const {
            limit = 20,
            offset = 0,
            status,
            userId,
            sort = '$createdAt'
        } = queryOptions;

        const queries = [];

        if (limit) queries.push(Query.limit(parseInt(limit)));
        if (offset) queries.push(Query.offset(parseInt(offset)));
        
        if (status) {
            queries.push(Query.equal('status', status));
        }

        if (userId) {
            queries.push(Query.equal('user', userId));
        }

        if (sort.startsWith('-')) {
            queries.push(Query.orderDesc(sort.substring(1)));
        } else {
            queries.push(Query.orderAsc(sort));
        }

        const response = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, queries);
        return {
            documents: response.documents.map(doc => this._mapDocument(doc)),
            total: response.total
        };
    },

    async getById(id) {
        try {
            const doc = await databases.getDocument(DB_ID, COLLECTIONS.ORDERS, id);
            return this._mapDocument(doc);
        } catch (error) {
            if (error.code === 404) return null;
            throw error;
        }
    },

    async create(data) {
        const preparedData = { ...data };
        
        // Appwrite handles complex objects as JSON strings or relationships
        if (preparedData.items) preparedData.items = JSON.stringify(preparedData.items);
        if (preparedData.deliveryAddress) preparedData.deliveryAddress = JSON.stringify(preparedData.deliveryAddress);
        if (preparedData.payment) preparedData.payment = JSON.stringify(preparedData.payment);
        if (preparedData.pricing) preparedData.pricing = JSON.stringify(preparedData.pricing);
        if (preparedData.statusHistory) preparedData.statusHistory = JSON.stringify(preparedData.statusHistory);
        if (preparedData.tracking) preparedData.tracking = JSON.stringify(preparedData.tracking);

        const doc = await databases.createDocument(DB_ID, COLLECTIONS.ORDERS, ID.unique(), preparedData);
        return this._mapDocument(doc);
    },

    async update(id, data) {
        const preparedData = { ...data };
        
        if (preparedData.items) preparedData.items = JSON.stringify(preparedData.items);
        if (preparedData.deliveryAddress) preparedData.deliveryAddress = JSON.stringify(preparedData.deliveryAddress);
        if (preparedData.payment) preparedData.payment = JSON.stringify(preparedData.payment);
        if (preparedData.pricing) preparedData.pricing = JSON.stringify(preparedData.pricing);
        if (preparedData.statusHistory) preparedData.statusHistory = JSON.stringify(preparedData.statusHistory);
        if (preparedData.tracking) preparedData.tracking = JSON.stringify(preparedData.tracking);

        const doc = await databases.updateDocument(DB_ID, COLLECTIONS.ORDERS, id, preparedData);
        return this._mapDocument(doc);
    },

    async delete(id) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.ORDERS, id);
        return true;
    },

    async getCount(query = {}) {
        const queries = [];
        Object.keys(query).forEach(key => {
            queries.push(Query.equal(key, query[key]));
        });
        const response = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, queries);
        return response.total;
    },

    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        
        const dailyPrefix = `RF${year}${month}${day}`;
        
        // Appwrite listDocuments with prefix query
        const response = await databases.listDocuments(DB_ID, COLLECTIONS.ORDERS, [
            Query.startsWith('orderNumber', dailyPrefix)
        ]);
        const count = response.total;
        
        const random = Math.floor(Math.random() * 100);
        const sequence = (count + 1).toString().padStart(3, '0');
        
        return `${dailyPrefix}-${sequence}${random}`;
    },

    _mapDocument(doc) {
        const order = { ...doc, id: doc.$id };
        delete order.$id;
        delete order.$collectionId;
        delete order.$databaseId;
        delete order.$createdAt;
        delete order.$updatedAt;
        delete order.$permissions;

        if (typeof order.items === 'string') {
            try { order.items = JSON.parse(order.items); } catch (e) { order.items = []; }
        }
        if (typeof order.deliveryAddress === 'string') {
            try { order.deliveryAddress = JSON.parse(order.deliveryAddress); } catch (e) { order.deliveryAddress = {}; }
        }
        if (typeof order.payment === 'string') {
            try { order.payment = JSON.parse(order.payment); } catch (e) { order.payment = {}; }
        }
        if (typeof order.pricing === 'string') {
            try { order.pricing = JSON.parse(order.pricing); } catch (e) { order.pricing = {}; }
        }
        if (typeof order.statusHistory === 'string') {
            try { order.statusHistory = JSON.parse(order.statusHistory); } catch (e) { order.statusHistory = []; }
        }
        if (typeof order.tracking === 'string') {
            try { order.tracking = JSON.parse(order.tracking); } catch (e) { order.tracking = {}; }
        }

        return order;
    }
};

module.exports = orderRepository;
