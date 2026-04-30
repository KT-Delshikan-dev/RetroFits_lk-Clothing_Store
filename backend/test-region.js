const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const regions = ['nyc', 'fra', 'sgp', 'sfo', 'blr', 'lon', 'ams', 'bru'];
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

async function testRegions() {
    for (const region of regions) {
        const endpoint = `https://${region}.cloud.appwrite.io/v1`;
        console.log(`Testing region: ${region} (${endpoint})...`);
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(apiKey);
        
        const databases = new Databases(client);
        try {
            await databases.list();
            console.log(`✅ SUCCESS! Your region is: ${region}`);
            console.log(`Use this endpoint: ${endpoint}`);
            return;
        } catch (error) {
            console.log(`❌ Failed for ${region}: ${error.message}`);
        }
    }
    console.log('❌ Could not find a working regional endpoint. Please check your Project ID and API Key.');
}

testRegions();
