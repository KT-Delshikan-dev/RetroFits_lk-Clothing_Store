const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function testConnection() {
    try {
        console.log('Fetching database info...');
        const db = await databases.get(process.env.APPWRITE_DATABASE_ID);
        console.log(`✅ Success! Found Database: ${db.name}`);
        
        console.log('Fetching collections...');
        const collections = await databases.listCollections(process.env.APPWRITE_DATABASE_ID);
        console.log(`✅ Success! Found ${collections.total} collections:`);
        collections.collections.forEach(c => console.log(` - ${c.name} (ID: ${c.$id})`));
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        console.log(`Full Error Type: ${error.type}`);
    }
}

testConnection();
