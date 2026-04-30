const { Client, Users, ID } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const users = new Users(client);

async function test() {
    try {
        console.log("Testing user creation with local phone format...");
        const user = await users.create(ID.unique(), "test_phone@example.com", "0771234567", "password123", "Test User");
        console.log("Success!", user);
    } catch (error) {
        console.error("Failed!", error.message, "Code:", error.code);
    }
}

test();
