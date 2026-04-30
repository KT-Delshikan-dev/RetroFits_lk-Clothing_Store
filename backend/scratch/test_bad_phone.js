
const authService = require('../services/authService');

async function testRegistrationInvalidPhone() {
    console.log('Testing User Registration with invalid phone format...');
    const testUser = {
        email: `testuser_badphone_${Date.now()}@example.com`,
        password: 'Password123!',
        name: 'Test User Bad Phone',
        phone: '0771234567' // No + prefix
    };

    try {
        const result = await authService.registerUser(testUser);
        console.log('Registration Success:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Registration Failed:');
        console.error('Message:', error.message);
        console.error('Full Error:', error);
    }
}

testRegistrationInvalidPhone();
