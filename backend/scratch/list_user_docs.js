
const { databases, DATABASE_ID, COLLECTIONS } = require('../services/appwrite');

async function listUserDocs() {
    try {
        const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.USERS);
        console.log('Total User Documents in DB:', response.total);
        response.documents.forEach(d => {
            console.log(`- ${d.name} (${d.email}) [${d.$id}] Role: ${d.role}`);
        });
    } catch (error) {
        console.error('Failed to list user documents:', error.message);
    }
}

listUserDocs();
