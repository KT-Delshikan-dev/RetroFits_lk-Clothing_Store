const { Query, ID } = require('node-appwrite');
const bcrypt = require('bcryptjs');
const { databases, users, DB_ID, COLLECTIONS } = require('./utils/appwrite');

const demoUsers = [
  {
    name: 'Avenza Admin',
    email: 'admin@avenza.com',
    phone: '+94770000001',
    password: 'Admin@12345',
    role: 'admin'
  },
  {
    name: 'Avenza User',
    email: 'user@avenza.com',
    phone: '+94770000002',
    password: 'User@12345',
    role: 'user'
  }
];

const schemaAttributes = [
  { key: 'name', type: 'string', size: 128, required: true },
  { key: 'email', type: 'email', required: true },
  { key: 'phone', type: 'string', size: 32, required: true },
  { key: 'role', type: 'enum', elements: ['user', 'admin'], required: true },
  { key: 'createdAt', type: 'string', size: 64, required: true }
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findAuthUserByEmail(email) {
  const response = await users.list([Query.equal('email', email)]);
  return response.total > 0 ? response.users[0] : null;
}

async function getAttributeMap() {
  const response = await databases.listAttributes(DB_ID, COLLECTIONS.USERS);
  return new Map(response.attributes.map((attribute) => [attribute.key, attribute]));
}

async function ensureAttribute(attribute) {
  const attributes = await getAttributeMap();
  const existing = attributes.get(attribute.key);

  if (existing && existing.status === 'available') {
    return;
  }

  if (!existing) {
    if (attribute.type === 'email') {
      await databases.createEmailAttribute(DB_ID, COLLECTIONS.USERS, attribute.key, attribute.required);
    }

    if (attribute.type === 'enum') {
      await databases.createEnumAttribute(
        DB_ID,
        COLLECTIONS.USERS,
        attribute.key,
        attribute.elements,
        attribute.required
      );
    }

    if (attribute.type === 'string') {
      await databases.createStringAttribute(
        DB_ID,
        COLLECTIONS.USERS,
        attribute.key,
        attribute.size,
        attribute.required
      );
    }
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const refreshed = await getAttributeMap();
    const current = refreshed.get(attribute.key);

    if (current && current.status === 'available') {
      return;
    }

    if (current && current.status === 'failed') {
      throw new Error(`Attribute "${attribute.key}" failed to build.`);
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for attribute "${attribute.key}" to become available.`);
}

async function ensureUserCollectionSchema() {
  for (const attribute of schemaAttributes) {
    await ensureAttribute(attribute);
  }
}

async function upsertProfile(userId, account) {
  const now = new Date().toISOString();
  const hashedPassword = await bcrypt.hash(account.password, 10);
  const profile = {
    username: account.email.split('@')[0],
    emailAddress: account.email,
    hashedPassword,
    accountStatus: 'active',
    signUpDate: now,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
    createdAt: now
  };

  try {
    await databases.getDocument(DB_ID, COLLECTIONS.USERS, userId);
    return databases.updateDocument(DB_ID, COLLECTIONS.USERS, userId, profile);
  } catch (error) {
    if (error.code !== 404) {
      throw error;
    }

    return databases.createDocument(DB_ID, COLLECTIONS.USERS, userId, profile);
  }
}

async function upsertDemoUser(account) {
  let authUser = await findAuthUserByEmail(account.email);

  if (!authUser) {
    authUser = await users.create(
      ID.unique(),
      account.email,
      account.phone,
      account.password,
      account.name
    );
  } else {
    await users.updateName(authUser.$id, account.name);
    if (authUser.phone !== account.phone) {
      await users.updatePhone(authUser.$id, account.phone);
    }
    await users.updatePassword(authUser.$id, account.password);
  }

  await upsertProfile(authUser.$id, account);

  return {
    id: authUser.$id,
    email: account.email,
    password: account.password,
    role: account.role
  };
}

async function main() {
  if (!DB_ID || !COLLECTIONS.USERS) {
    throw new Error('Missing Appwrite database or users collection configuration.');
  }

  await ensureUserCollectionSchema();

  const created = [];
  for (const account of demoUsers) {
    created.push(await upsertDemoUser(account));
  }

  console.log('Demo users are ready:');
  for (const account of created) {
    console.log(`- ${account.role}: ${account.email} / ${account.password}`);
  }
}

main().catch((error) => {
  console.error('Failed to create demo users:', error.message);
  if (process.env.DEBUG_DEMO_USERS === 'true') {
    console.error(error);
  }
  process.exit(1);
});
