const { users, ID, Query } = require('./appwrite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Auth Service (Backend)
 * Uses Appwrite Users service for user management.
 */

const authService = {
    /**
     * Create a new user in Appwrite
     */
    async registerUser(userData) {
        const { email, password, name, phone } = userData;
        
        // Hash password for the database document
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Format Phone Number
        // Appwrite requires phone numbers to be in E.164 format (starting with +)
        let formattedPhone = phone ? phone.trim().replace(/\s/g, '') : undefined;
        if (formattedPhone && !formattedPhone.startsWith('+')) {
            // Assume default country code if missing, but better to just let it be undefined 
            // if we can't be sure, or try to prepend '+' if it looks like a global number
            // For now, if it doesn't start with +, we'll just not send it to Auth to avoid errors
            // but we'll still keep it in the database document.
            formattedPhone = undefined;
        }

        let authUser;
        try {
            // Check if user already exists in Auth
            try {
                // Try to find user by email to see if they already exist
                const existingUsers = await users.list([Query.equal('email', email)]);
                if (existingUsers.total > 0) {
                    authUser = existingUsers.users[0];
                    console.log('User already exists in Auth, using existing record:', authUser.$id);
                }
            } catch (listError) {
                console.log('Error checking for existing user, proceeding with creation');
            }

            if (!authUser) {
                // Create User in Appwrite Auth
                authUser = await users.create(
                    ID.unique(), 
                    email, 
                    formattedPhone, 
                    password, 
                    name
                );
            }
            
            // 2. Create User Document in Database (if it doesn't exist)
            const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
            
            try {
                // Check if doc exists
                await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, authUser.$id);
                console.log('User document already exists in database');
            } catch (docError) {
                // If not found (404), create it
                if (docError.code === 404) {
                    await databases.createDocument(
                        DATABASE_ID,
                        COLLECTIONS.USERS,
                        authUser.$id,
                        {
                            name,
                            email,
                            phone: phone || '',
                            password: hashedPassword,
                            role: 'user',
                            createdAt: new Date().toISOString()
                        }
                    );
                } else {
                    throw docError;
                }
            }

            // 3. Generate JWT Token
            const token = jwt.sign(
                { id: authUser.$id, email: authUser.email, role: 'user' },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );

            return {
                user: {
                    id: authUser.$id,
                    name: authUser.name,
                    email: authUser.email,
                    role: 'user',
                    emailVerification: authUser.emailVerification
                },
                token
            };
        } catch (error) {
            console.error('Service registration error:', error);
            throw error;
        }
    },

    /**
     * Get user by email from database
     */
    async getUserByEmail(email) {
        const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
        const response = await databases.listDocuments(
            DATABASE_ID, 
            COLLECTIONS.USERS, 
            [Query.equal('email', email)]
        );
        
        if (response.total === 0) return null;
        
        // Also get verification status from Auth if possible, or just use database field
        const doc = response.documents[0];
        return { ...doc, id: doc.$id };
    },

    /**
     * Get user profile from database
     */
    async getUserProfile(userId) {
        const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
        try {
            const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
            return { ...doc, id: doc.$id };
        } catch (error) {
            if (error.code === 404) return null;
            throw error;
        }
    },

    /**
     * Update user profile in database
     */
    async updateUserProfile(userId, updateData) {
        const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
        try {
            // Remove sensitive fields that shouldn't be updated here
            const { email, password, role, ...allowedUpdates } = updateData;
            
            const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.USERS, userId, allowedUpdates);
            return { ...doc, id: doc.$id };
        } catch (error) {
            console.error('Service updateProfile error:', error);
            throw error;
        }
    },

    /**
     * Delete user from Auth and Database
     */
    async deleteUser(userId) {
        const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
        try {
            // 1. Delete from Auth
            await users.delete(userId);
            
            // 2. Delete from Database
            try {
                await databases.deleteDocument(DATABASE_ID, COLLECTIONS.USERS, userId);
            } catch (dbErr) {
                console.log('User document might not exist or already deleted');
            }
            
            return true;
        } catch (error) {
            console.error('Service deleteUser error:', error);
            throw error;
        }
    },

    /**
     * Create user document for social login users
     */
    async createSocialUserDocument({ id, email, name }) {
        const { databases, DATABASE_ID, COLLECTIONS } = require('./appwrite');
        const doc = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.USERS,
            id,
            {
                name: name || 'Google User',
                email,
                phone: '',
                password: 'SOCIAL_LOGIN', // Placeholder
                role: 'user',
                createdAt: new Date().toISOString()
            }
        );
        return { ...doc, id: doc.$id };
    }
};

module.exports = authService;
