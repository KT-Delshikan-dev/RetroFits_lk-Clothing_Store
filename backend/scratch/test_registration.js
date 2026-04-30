
const authService = require('../services/authService');

async function testRegistration() {
    console.log('Testing User Registration...');
    const testUser = {
        email: `testuser_${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User',
        phone: '+94771234567'
    };

    try {
        const result = await authService.registerUser(testUser);
        console.log('Registration Success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Registration Failed:');
        console.error('Message:', error.message);
        console.error('Code:', error.code);
        console.error('Full Error:', error);
    }
}

testRegistration();
