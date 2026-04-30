const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const projectId = '69f1cb840006d2bde03e';
const apiKey = '750399933bcb2e139e91e237ff8ba3562019fe8e9acc3a20fb950febf8f2f54b5cc818e165b06accb99a04ff7a22728be615a15a6908a9706910f6ff5852e1974acf4c804e89ec806f90ac20917fc95b86ba413fc8858af92d1490da9e8c3f53a16fefb501c9b6d233da0616f55a525389cdcea4d5cf42c456c9b88f74cde6e1';
const endpoint = 'https://sgp.cloud.appwrite.io/v1';

async function testKey() {
    const client = new Client()
        .setEndpoint(endpoint)
        .setProject(projectId)
        .setKey(apiKey);
    
    const databases = new Databases(client);
    try {
        await databases.list();
        console.log('✅ Success with cleaned key!');
    } catch (error) {
        console.log(`❌ Failed with cleaned key: ${error.message}`);
    }
}

testKey();
