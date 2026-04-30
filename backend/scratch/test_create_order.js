const axios = require('axios');

async function testCreateOrder() {
    try {
        const email = `test-${Date.now()}@example.com`;
        const registerRes = await axios.post('http://localhost:5005/api/auth/register', {
            email,
            password: 'password123',
            name: 'Test User',
            phone: '0771234567'
        });
        const token = registerRes.data.token;
        const user = registerRes.data.user;

        const orderData = {
            items: [
                {
                    product: '67c050010037e9491763', // Example product ID
                    quantity: 1,
                    size: 'M',
                    color: 'Black'
                }
            ],
            deliveryAddress: {
                name: 'Test User',
                phone: '0771234567',
                street: '123 Street',
                city: 'Colombo',
                state: 'Western',
                zipCode: '00100',
                country: 'Sri Lanka'
            },
            payment: {
                method: 'cod'
            },
            pricing: {
                subtotal: 1000,
                shipping: 500,
                total: 1500
            },
            paymentMethod: 'cod'
        };

        const res = await axios.post('http://localhost:5005/api/orders', orderData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Order created:', res.data);
    } catch (error) {
        console.error('Order creation failed:', error.response?.data || error.message);
    }
}

testCreateOrder();
