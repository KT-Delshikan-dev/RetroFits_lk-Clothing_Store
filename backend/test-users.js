const { Client, Users } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function testUsers() {
    try {
        const response = await users.list();
        console.log(`✅ Success! Found ${response.total} users.`);
    } catch (error) {
        console.log(`❌ Error: ${error.message} (${error.type})`);
    }
}

testUsers();
