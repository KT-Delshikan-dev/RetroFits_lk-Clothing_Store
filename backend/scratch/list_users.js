
const { users } = require('../services/appwrite');

async function listUsers() {
    try {
        const response = await users.list();
        console.log('Total Users in Auth:', response.total);
        response.users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [${u.$id}]`);
        });
    } catch (error) {
        console.error('Failed to list users:', error.message);
    }
}

listUsers();
