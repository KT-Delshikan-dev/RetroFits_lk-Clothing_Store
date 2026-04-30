require('dotenv').config({ path: './backend/.env' });
const { Client, Databases, ID } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.APPWRITE_COLLECTION_PRODUCTS || 'products';

async function setup() {
    try {
        console.log(`Checking for collection: ${COLLECTION_ID}...`);
        try {
            await databases.getCollection(DATABASE_ID, COLLECTION_ID);
            console.log('Collection already exists.');
        } catch (e) {
            console.log('Creating collection...');
            await databases.createCollection(DATABASE_ID, COLLECTION_ID, 'Products');
            console.log('Collection created.');
        }

        const attributes = [
            { id: 'name', type: 'string', size: 255, required: true },
            { id: 'description', type: 'string', size: 5000, required: true },
            { id: 'price', type: 'double', required: true },
            { id: 'originalPrice', type: 'double', required: false },
            { id: 'category', type: 'string', size: 100, required: true },
            { id: 'subCategory', type: 'string', size: 100, required: false },
            { id: 'stock', type: 'integer', required: true, default: 0 },
            { id: 'sku', type: 'string', size: 100, required: false },
            { id: 'images', type: 'string', size: 5000, required: false }, // Stringified JSON
            { id: 'sizes', type: 'string', size: 5000, required: false }, // Stringified JSON
            { id: 'colors', type: 'string', size: 5000, required: false }, // Stringified JSON
            { id: 'tags', type: 'string', size: 5000, required: false }, // Stringified JSON
            { id: 'featured', type: 'boolean', required: false, default: false },
            { id: 'isActive', type: 'boolean', required: false, default: true },
            { id: 'excludeFromNewArrivals', type: 'boolean', required: false, default: false }
        ];

        console.log('Setting up attributes...');
        const existingAttrs = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
        const existingIds = existingAttrs.attributes.map(a => a.$id);

        for (const attr of attributes) {
            if (existingIds.includes(attr.id)) {
                console.log(`Attribute ${attr.id} already exists.`);
                continue;
            }

            try {
                console.log(`Creating attribute ${attr.id}...`);
                if (attr.type === 'string') {
                    await databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, attr.id, attr.size, attr.required, attr.default);
                } else if (attr.type === 'double') {
                    await databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, attr.id, attr.required, 0, 1000000, attr.default);
                } else if (attr.type === 'integer') {
                    await databases.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, attr.id, attr.required, 0, 1000000, attr.default);
                } else if (attr.type === 'boolean') {
                    await databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, attr.id, attr.required, attr.default);
                }
            } catch (e) {
                console.log(`Attribute ${attr.id} setup skipped: ${e.message}`);
            }
            
            // Wait a bit to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Appwrite setup completed successfully!');
    } catch (error) {
        console.error('Error setting up Appwrite:', error);
    }
}

setup();
