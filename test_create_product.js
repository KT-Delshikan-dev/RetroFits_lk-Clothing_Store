require('dotenv').config({ path: './backend/.env' });
const productService = require('./backend/services/productService');
const { ID } = require('node-appwrite');

async function testCreateProduct() {
    try {
        const productData = {
            name: 'Test Product ' + Date.now(),
            description: 'Test Description',
            price: 1000,
            category: 'Men',
            subCategory: 'Casual Wear',
            stock: 10,
            sizes: [{ name: 'M', stock: 10 }],
            colors: [{ name: 'Red', hex: '#FF0000' }],
            tags: ['test', 'new'],
            featured: false,
            isActive: true
        };

        console.log('Attempting to create product...');
        const product = await productService.createProduct(productData);
        console.log('Product created successfully:', product.id);
    } catch (error) {
        console.error('Error creating product:', error);
    }
}

testCreateProduct();
