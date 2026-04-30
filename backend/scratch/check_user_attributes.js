const { databases, DB_ID, COLLECTIONS } = require('../utils/appwrite');

async function checkAttributes() {
    try {
        const result = await databases.listAttributes(DB_ID, COLLECTIONS.USERS);
        console.log('User Attributes:', result.attributes.map(a => a.key));
    } catch (error) {
        console.error('Error listing attributes:', error);
    }
}

checkAttributes();
