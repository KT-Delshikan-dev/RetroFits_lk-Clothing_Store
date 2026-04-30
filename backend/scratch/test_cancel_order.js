const axios = require('axios');

async function testCancelOrder() {
    try {
        // First login
        const loginRes = await axios.post('http://localhost:5005/api/auth/login', {
            email: 'admin@avenza.lk',
            password: 'password123'
        });
        const token = loginRes.data.token;

        // Get my orders
        const ordersRes = await axios.get('http://localhost:5005/api/orders', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const orders = ordersRes.data.data;
        const pendingOrder = orders.find(o => o.status === 'pending');

        if (!pendingOrder) {
            console.log('No pending orders found to cancel');
            return;
        }

        console.log('Attempting to cancel order:', pendingOrder.id);

        // Cancel order
        const cancelRes = await axios.delete(`http://localhost:5005/api/orders/${pendingOrder.id}/cancel`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Cancel result:', cancelRes.data);
    } catch (error) {
        console.error('Cancel failed:', error.response?.data || error.message);
    }
}

testCancelOrder();
