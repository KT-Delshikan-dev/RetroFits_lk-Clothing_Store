const { databases, DB_ID, COLLECTIONS } = require('../utils/appwrite');

async function checkOrderAttributes() {
    try {
        const result = await databases.listAttributes(DB_ID, COLLECTIONS.ORDERS);
        console.log('Order Attributes:', result.attributes.map(a => ({ key: a.key, type: a.type, required: a.required })));
    } catch (error) {
        console.error('Error listing attributes:', error);
    }
}

checkOrderAttributes();
