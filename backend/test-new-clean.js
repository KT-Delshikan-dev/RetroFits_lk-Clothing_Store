const { Client, Users } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('69f1cb840006d2bde03e')
    .setKey('a25bdb33466650dd8c18daccf46ffd5b0063aae24289cb9557f0754b5edb9d47193025a682360dd9d4af764faaaec9ca9053caa38fe513cd4b64e75dc154850a10571dd3d53ded4d33a2b2f218b857d377c166978f90cda96761ae05317a9d1fbeae6de6f18ac62a7be0db97dfc3d46e8dc1a20cbf575c1596659f18b7db7a95');

const users = new Users(client);

async function run() {
    try {
        const res = await users.list();
        console.log('✅ Success with new clean key!');
    } catch (e) {
        console.log(`❌ Fail with new clean key: ${e.message} (${e.type})`);
    }
}

run();
