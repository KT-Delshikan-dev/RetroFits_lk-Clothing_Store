const { Query, ID } = require('node-appwrite');
const { databases, DB_ID, COLLECTIONS } = require('../utils/appwrite');

const productRepository = {
    async getAll(queryOptions = {}) {
        const {
            limit = 12,
            offset = 0,
            category,
            subCategory,
            minPrice,
            maxPrice,
            featured,
            isActive,
            search,
            tags
        } = queryOptions;

        const queries = [];

        if (limit) queries.push(Query.limit(parseInt(limit)));
        if (offset) queries.push(Query.offset(parseInt(offset)));
        
        if (isActive !== undefined) {
            queries.push(Query.equal('isActive', isActive));
        }

        if (category) {
            queries.push(Query.equal('category', category));
        }

        if (subCategory) {
            queries.push(Query.equal('subCategory', subCategory));
        }

        if (minPrice) {
            queries.push(Query.greaterThanEqual('price', parseFloat(minPrice)));
        }

        if (maxPrice) {
            queries.push(Query.lessThanEqual('price', parseFloat(maxPrice)));
        }

        if (featured !== undefined) {
            queries.push(Query.equal('featured', featured));
        }

        if (search) {
            queries.push(Query.search('name', search));
        }

        if (tags && tags.length > 0) {
            queries.push(Query.contains('tags', tags));
        }

        // Default sort
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(DB_ID, COLLECTIONS.PRODUCTS, queries);
        return {
            documents: response.documents.map(doc => this._mapDocument(doc)),
            total: response.total
        };
    },

    async getById(id) {
        try {
            const doc = await databases.getDocument(DB_ID, COLLECTIONS.PRODUCTS, id);
            return this._mapDocument(doc);
        } catch (error) {
            if (error.code === 404) return null;
            throw error;
        }
    },

    async create(data) {
        // Handle nested objects by stringifying if needed, or assume schema is flat
        // For Retrofits, sizes and colors are arrays of objects. 
        // In Appwrite, we might store them as JSON strings if attributes are strings.
        const preparedData = { ...data };
        if (preparedData.sizes) preparedData.sizes = JSON.stringify(preparedData.sizes);
        if (preparedData.colors) preparedData.colors = JSON.stringify(preparedData.colors);
        if (preparedData.images) preparedData.images = JSON.stringify(preparedData.images);

        const doc = await databases.createDocument(DB_ID, COLLECTIONS.PRODUCTS, ID.unique(), preparedData);
        return this._mapDocument(doc);
    },

    async update(id, data) {
        const preparedData = { ...data };
        if (preparedData.sizes) preparedData.sizes = JSON.stringify(preparedData.sizes);
        if (preparedData.colors) preparedData.colors = JSON.stringify(preparedData.colors);
        if (preparedData.images) preparedData.images = JSON.stringify(preparedData.images);

        const doc = await databases.updateDocument(DB_ID, COLLECTIONS.PRODUCTS, id, preparedData);
        return this._mapDocument(doc);
    },

    async delete(id) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.PRODUCTS, id);
        return true;
    },

    _mapDocument(doc) {
        // Convert JSON strings back to objects
        const product = { ...doc, id: doc.$id };
        delete product.$id;
        delete product.$collectionId;
        delete product.$databaseId;
        delete product.$createdAt;
        delete product.$updatedAt;
        delete product.$permissions;

        if (typeof product.sizes === 'string') {
            try { product.sizes = JSON.parse(product.sizes); } catch (e) { product.sizes = []; }
        }
        if (typeof product.colors === 'string') {
            try { product.colors = JSON.parse(product.colors); } catch (e) { product.colors = []; }
        }
        if (typeof product.images === 'string') {
            try { product.images = JSON.parse(product.images); } catch (e) { product.images = []; }
        }

        return product;
    }
};

module.exports = productRepository;
