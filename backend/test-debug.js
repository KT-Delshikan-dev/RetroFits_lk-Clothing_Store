const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

console.log(`Endpoint: ${endpoint}`);
console.log(`Project ID: ${projectId}`);
console.log(`API Key starts with: ${apiKey ? apiKey.substring(0, 10) + '...' : 'undefined'}`);

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function testConnection() {
    try {
        await databases.get(process.env.APPWRITE_DATABASE_ID);
        console.log('✅ Success!');
    } catch (error) {
        console.log(`❌ Error: ${error.message} (${error.type})`);
    }
}

testConnection();
