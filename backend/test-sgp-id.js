const { Client, Users } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('sgp-69f1cb840006d2bde03e')
    .setKey('-standard_750399933bcb2e139e91e237ff8ba3562019fe8e9acc3a20fb950febf8f2f54b5cc818e165b06accb99a04ff7a22728be615a15a6908a9706910f6ff5852e1974acf4c804e89ec806f90ac20917fc95b86ba413fc8858af92d1490da9e8c3f53a16fefb501c9b6d233da0616f55a525389cdcea4d5cf42c456c9b88f74cde6e1');

const users = new Users(client);

async function run() {
    try {
        const res = await users.list();
        console.log('✅ Success with sgp- project ID!');
    } catch (e) {
        console.log(`❌ Fail with sgp- project ID: ${e.message} (${e.type})`);
    }
}

run();
