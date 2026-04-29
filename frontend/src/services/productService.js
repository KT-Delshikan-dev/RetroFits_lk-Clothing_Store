import axios from 'axios';

/**
 * Product Service (Frontend)
 * Handles API calls to the backend (which is now powered by Appwrite).
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const productService = {
    /**
     * Fetch all products with filters
     */
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await axios.get(`${API_URL}/products?${params.toString()}`);
        return response.data;
    },

    /**
     * Get a single product by ID
     */
    async getProductById(productId) {
        const response = await axios.get(`${API_URL}/products/${productId}`);
        return response.data;
    },

    /**
     * Create a product (Admin)
     */
    async createProduct(productData, token) {
        const response = await axios.post(`${API_URL}/products`, productData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    /**
     * Update a product (Admin)
     */
    async updateProduct(productId, productData, token) {
        const response = await axios.put(`${API_URL}/products/${productId}`, productData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    /**
     * Delete a product (Admin)
     */
    async deleteProduct(productId, token) {
        const response = await axios.delete(`${API_URL}/products/${productId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default productService;
