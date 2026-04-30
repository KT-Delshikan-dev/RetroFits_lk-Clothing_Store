
const { users, databases, DATABASE_ID, COLLECTIONS } = require('../services/appwrite');

async function cleanup() {
    console.log('Starting cleanup of test users...');
    try {
        const response = await users.list();
        const testUsers = response.users.filter(u => 
            u.email.includes('testuser') || 
            u.email.includes('curltest') || 
            u.email.includes('fresh') ||
            u.email.includes('manualtest')
        );

        console.log(`Found ${testUsers.length} test users to remove.`);

        for (const user of testUsers) {
            console.log(`Removing user: ${user.email} (${user.$id})`);
            
            // Delete from Auth
            try {
                await users.delete(user.$id);
                console.log(`  - Deleted from Auth`);
            } catch (e) {
                console.error(`  - Failed to delete from Auth: ${e.message}`);
            }

            // Delete from Database
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, user.$id);
                console.log(`  - Deleted from Database`);
            } catch (e) {
                // Ignore 404
                if (e.code !== 404) {
                    console.error(`  - Failed to delete from Database: ${e.message}`);
                }
            }
        }
        console.log('Cleanup complete.');
    } catch (error) {
        console.error('Cleanup failed:', error.message);
    }
}

cleanup();
