
const { databases, DATABASE_ID, COLLECTIONS } = require('../services/appwrite');

async function checkAttributes() {
    try {
        const response = await databases.listAttributes(DATABASE_ID, COLLECTIONS.USERS);
        console.log('Attributes for USERS collection:');
        response.attributes.forEach(attr => {
            console.log(`- ${attr.key}: ${attr.type} (Required: ${attr.required})`);
        });
    } catch (error) {
        console.error('Failed to list attributes:', error.message);
    }
}

checkAttributes();
