const { Query, ID } = require('node-appwrite');
const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');

/**
 * Product Service
 * Handles all database operations for the products collection.
 */

const productService = {
    /**
     * Fetch products with optional filtering
     */
    async getProducts(filters = {}) {
        const { category, minPrice, maxPrice, search, limit = 12, offset = 0 } = filters;
        const queries = [];

        if (category) queries.push(Query.equal('category', category));
        if (minPrice) queries.push(Query.greaterThanEqual('price', parseFloat(minPrice)));
        if (maxPrice) queries.push(Query.lessThanEqual('price', parseFloat(maxPrice)));
        if (search) queries.push(Query.search('name', search));
        
        queries.push(Query.limit(limit));
        queries.push(Query.offset(offset));
        queries.push(Query.orderDesc('$createdAt'));

        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS, queries);
        
        return {
            products: response.documents.map(doc => this._formatProduct(doc)),
            total: response.total
        };
    },

    /**
     * Get a single product by ID
     */
    async getSingleProduct(productId) {
        try {
            const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId);
            return this._formatProduct(doc);
        } catch (error) {
            if (error.code === 404) return null;
            throw error;
        }
    },

    /**
     * Create a new product
     */
    async createProduct(data) {
        const productData = {
            ...data,
            // Handle arrays/objects if Appwrite collection is set to string
            sizes: Array.isArray(data.sizes) ? JSON.stringify(data.sizes) : data.sizes,
            colors: Array.isArray(data.colors) ? JSON.stringify(data.colors) : data.colors,
            images: Array.isArray(data.images) ? JSON.stringify(data.images) : data.images,
            tags: Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags,
        };

        const doc = await databases.createDocument(
            DATABASE_ID, 
            COLLECTIONS.PRODUCTS, 
            ID.unique(), 
            productData
        );
        return this._formatProduct(doc);
    },

    /**
     * Update an existing product
     */
    async updateProduct(productId, data) {
        try {
            const updateData = { ...data };
            if (Array.isArray(updateData.sizes)) updateData.sizes = JSON.stringify(updateData.sizes);
            if (Array.isArray(updateData.colors)) updateData.colors = JSON.stringify(updateData.colors);
            if (Array.isArray(updateData.images)) updateData.images = JSON.stringify(updateData.images);
            if (Array.isArray(updateData.tags)) updateData.tags = JSON.stringify(updateData.tags);

            const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId, updateData);
            return this._formatProduct(doc);
        } catch (error) {
            console.error(`Appwrite updateProduct error for ${productId}:`, error);
            throw error;
        }
    },

    /**
     * Delete a product
     */
    async deleteProduct(productId) {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, productId);
        return true;
    },

    /**
     * Get all unique subcategories grouped by category
     */
    async getSubcategories() {
        const { products } = await this.getProducts({ limit: 5000 });

        const result = {};
        products.forEach(doc => {
            if (doc.category && doc.subCategory) {
                if (!result[doc.category]) {
                    result[doc.category] = new Set();
                }
                result[doc.category].add(doc.subCategory);
            }
        });

        const data = {};
        Object.keys(result).forEach(cat => {
            data[cat] = Array.from(result[cat]);
        });

        return data;
    },

    /**
     * Remove an image from a product
     */
    async removeProductImage(productId, imageIndex) {
        const product = await this.getSingleProduct(productId);
        if (!product) throw new Error('Product not found');

        const index = parseInt(imageIndex);
        if (isNaN(index) || index < 0 || index >= product.images.length) {
            throw new Error('Invalid image index');
        }

        const updatedImages = [...product.images];
        updatedImages.splice(index, 1);
        
        return await this.updateProduct(productId, { images: updatedImages });
    },

    /**
     * Internal helper to format Appwrite document to cleaner JS object
     */
    _formatProduct(doc) {
        const product = { ...doc, id: doc.$id };
        
        // Cleanup Appwrite meta fields
        delete product.$id;
        delete product.$collectionId;
        delete product.$databaseId;
        delete product.$permissions;
        
        // Parse JSON fields if they were stored as strings
        if (typeof product.sizes === 'string') {
            try { product.sizes = JSON.parse(product.sizes); } catch (e) { /* ignore */ }
        }
        if (typeof product.colors === 'string') {
            try { product.colors = JSON.parse(product.colors); } catch (e) { /* ignore */ }
        }
        if (typeof product.images === 'string') {
            try { product.images = JSON.parse(product.images); } catch (e) { /* ignore */ }
        }
        if (typeof product.tags === 'string') {
            try { product.tags = JSON.parse(product.tags); } catch (e) { /* ignore */ }
        }

        return product;
    }
};

module.exports = productService;
