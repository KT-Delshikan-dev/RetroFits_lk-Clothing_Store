const { Client, Databases } = require('node-appwrite');

const endpoint = 'https://sgp.cloud.appwrite.io/v1';
const projectId = '69f1cb840006d2bde03e';
// Trying BOTH keys
const keys = [
    '750399933bcb2e139e91e237ff8ba3562019fe8e9acc3a20fb950febf8f2f54b5cc818e165b06accb99a04ff7a22728be615a15a6908a9706910f6ff5852e1974acf4c804e89ec806f90ac20917fc95b86ba413fc8858af92d1490da9e8c3f53a16fefb501c9b6d233da0616f55a525389cdcea4d5cf42c456c9b88f74cde6e1',
    '-standard_750399933bcb2e139e91e237ff8ba3562019fe8e9acc3a20fb950febf8f2f54b5cc818e165b06accb99a04ff7a22728be615a15a6908a9706910f6ff5852e1974acf4c804e89ec806f90ac20917fc95b86ba413fc8858af92d1490da9e8c3f53a16fefb501c9b6d233da0616f55a525389cdcea4d5cf42c456c9b88f74cde6e1'
];

async function runTest() {
    for (const key of keys) {
        console.log(`Testing key: ${key.substring(0, 15)}...`);
        const client = new Client()
            .setEndpoint(endpoint)
            .setProject(projectId)
            .setKey(key);
        
        const databases = new Databases(client);
        try {
            await databases.list();
            console.log('✅ Success!');
            return;
        } catch (error) {
            console.log(`❌ Error: ${error.message} (${error.type})`);
        }
    }
}

runTest();
