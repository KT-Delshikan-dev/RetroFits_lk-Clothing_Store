const { Client, Databases } = require('node-appwrite');
require('dotenv').config();

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const dbId = process.env.APPWRITE_DATABASE_ID;

async function setupSchema() {
    try {
        console.log('Starting Appwrite schema setup...');

        const collections = [
            {
                id: process.env.APPWRITE_COLLECTION_PRODUCTS,
                name: 'Products',
                attributes: [
                    { key: 'name', type: 'string', size: 255, required: true },
                    { key: 'description', type: 'string', size: 2000, required: true },
                    { key: 'price', type: 'float', required: true },
                    { key: 'originalPrice', type: 'float', required: false },
                    { key: 'category', type: 'string', size: 50, required: true },
                    { key: 'subCategory', type: 'string', size: 50, required: false },
                    { key: 'images', type: 'string', size: 4000, required: false },
                    { key: 'sizes', type: 'string', size: 4000, required: false },
                    { key: 'colors', type: 'string', size: 2000, required: false },
                    { key: 'stock', type: 'integer', required: false, default: 0 },
                    { key: 'sku', type: 'string', size: 50, required: false },
                    { key: 'tags', type: 'string', size: 2000, required: false },
                    { key: 'featured', type: 'boolean', required: false, default: false },
                    { key: 'isActive', type: 'boolean', required: false, default: true },
                    { key: 'excludeFromNewArrivals', type: 'boolean', required: false, default: false }
                ]
            },
            {
                id: process.env.APPWRITE_COLLECTION_ORDERS,
                name: 'Orders',
                attributes: [
                    { key: 'user', type: 'string', size: 50, required: true },
                    { key: 'items', type: 'string', size: 5000, required: true },
                    { key: 'pricing', type: 'string', size: 1000, required: true },
                    { key: 'deliveryAddress', type: 'string', size: 2000, required: true },
                    { key: 'payment', type: 'string', size: 2000, required: true },
                    { key: 'status', type: 'string', size: 50, required: false, default: 'pending' },
                    { key: 'statusHistory', type: 'string', size: 4000, required: false },
                    { key: 'paymentMethod', type: 'string', size: 50, required: true },
                    { key: 'createdAt', type: 'string', size: 50, required: false }
                ]
            },
            {
                id: process.env.APPWRITE_COLLECTION_USERS,
                name: 'Users',
                attributes: [
                    { key: 'name', type: 'string', size: 255, required: true },
                    { key: 'email', type: 'string', size: 255, required: true },
                    { key: 'password', type: 'string', size: 255, required: false },
                    { key: 'role', type: 'string', size: 20, required: false, default: 'user' },
                    { key: 'phone', type: 'string', size: 20, required: false },
                    { key: 'addresses', type: 'string', size: 5000, required: false },
                    { key: 'savedCards', type: 'string', size: 3000, required: false },
                    { key: 'createdAt', type: 'string', size: 50, required: false }
                ]
            },
        ];

        for (const col of collections) {
            console.log(`\nProcessing collection: ${col.name} (${col.id})...`);
            
            // Check if collection exists
            try {
                await databases.getCollection(dbId, col.id);
                console.log(`Collection ${col.id} already exists.`);
            } catch (e) {
                console.log(`Collection ${col.id} missing. Please create it manually in Appwrite console with the ID: ${col.id}`);
                continue;
            }

            // Get existing attributes to avoid duplicates
            const existingAttrs = await databases.listAttributes(dbId, col.id);
            const existingKeys = existingAttrs.attributes.map(a => a.key);

            for (const attr of col.attributes) {
                if (existingKeys.includes(attr.key)) {
                    console.log(`  Attribute "${attr.key}" already exists. Skipping.`);
                    continue;
                }

                console.log(`  Creating attribute "${attr.key}"...`);
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(dbId, col.id, attr.key, attr.size, attr.required, attr.default);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(dbId, col.id, attr.key, attr.required, -1000000, 1000000, attr.default);
                    } else if (attr.type === 'float') {
                        await databases.createFloatAttribute(dbId, col.id, attr.key, attr.required, -1000000, 1000000, attr.default);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(dbId, col.id, attr.key, attr.required, attr.default);
                    }
                    
                    // Appwrite needs time to process attribute creation
                    await new Promise(resolve => setTimeout(resolve, 800));
                } catch (attrError) {
                    console.error(`  Error creating attribute "${attr.key}":`, attrError.message);
                }
            }

            // Add Indexes
            if (col.id === process.env.APPWRITE_COLLECTION_PRODUCTS) {
                console.log(`  Creating search indexes for ${col.name}...`);
                try {
                    const existingIndexes = await databases.listIndexes(dbId, col.id);
                    if (!existingIndexes.indexes.find(i => i.key === 'search_index')) {
                        await databases.createIndex(dbId, col.id, 'search_index', 'fulltext', ['name', 'description']);
                        console.log(`  Fulltext search index created.`);
                    } else {
                        console.log(`  Search index already exists.`);
                    }
                } catch (idxError) {
                    console.error(`  Error creating index:`, idxError.message);
                }
            }

            if (col.id === process.env.APPWRITE_COLLECTION_USERS) {
                console.log(`  Creating unique index for email in ${col.name}...`);
                try {
                    const existingIndexes = await databases.listIndexes(dbId, col.id);
                    if (!existingIndexes.indexes.find(i => i.key === 'unique_email')) {
                        await databases.createIndex(dbId, col.id, 'unique_email', 'unique', ['email']);
                        console.log(`  Unique email index created.`);
                    } else {
                        console.log(`  Unique email index already exists.`);
                    }
                } catch (idxError) {
                    console.error(`  Error creating unique index:`, idxError.message);
                }
            }
        }

        console.log('\nSchema setup completed successfully!');
    } catch (error) {
        console.error('Setup failed:', error);
    }
}

setupSchema();
