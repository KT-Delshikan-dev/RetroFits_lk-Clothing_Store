const authService = require('../services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken } = require('../middleware/auth');

/**
 * Auth Controller
 * Handles registration, login, and profile fetching.
 */

const authController = {
    /**
     * Register a new user
     */
    async register(req, res) {
        try {
            const result = await authService.registerUser(req.body);
            res.status(201).json({
                success: true,
                message: 'User registered successfully. Please verify your email.',
                token: result.token,
                user: result.user,
                requiresVerification: true
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(400).json({ success: false, message: 'Registration failed', error: error.message });
        }
    },

    /**
     * Login user
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const user = await authService.getUserByEmail(email);
            
            if (!user) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );

            res.json({
                success: true,
                message: 'Login successful',
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerification: user.emailVerification
                },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ success: false, message: 'Login failed', error: error.message });
        }
    },

    /**
     * Get current user profile
     */
    async getMe(req, res) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ success: false, message: 'Not authorized' });
            }

            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            
            const user = await authService.getUserProfile(decoded.id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('getMe error:', error);
            res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }
    },

    /**
     * Update user profile
     */
    async updateProfile(req, res) {
        try {
            const userId = req.user.id;
            const updateData = { ...req.body };

            const updatedUser = await authService.updateUserProfile(userId, updateData);

            res.json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
        }
    },

    /**
     * Get or create user for social login
     */
    async meSocial(req, res) {
        try {
            const { email } = req.query;
            if (!email) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            let user = await authService.getUserByEmail(email);
            
            if (!user) {
                // If user doesn't exist in our DB but exists in Appwrite Auth,
                // we should create the DB record.
                // Note: In a real app, we'd fetch the name/id from Appwrite here.
                const { users } = require('../services/appwrite');
                const authUsers = await users.list([require('node-appwrite').Query.equal('email', email)]);
                
                if (authUsers.total > 0) {
                    const authUser = authUsers.users[0];
                    user = await authService.createSocialUserDocument({
                        id: authUser.$id,
                        email: authUser.email,
                        name: authUser.name
                    });
                } else {
                    return res.status(404).json({ success: false, message: 'Social user not found' });
                }
            }

            // Generate JWT Token
            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '30d' }
            );

            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    emailVerification: user.emailVerification
                },
                token
            });
        } catch (error) {
            console.error('meSocial error:', error);
            res.status(500).json({ success: false, message: 'Social sync failed', error: error.message });
        }
    },

    /**
     * Delete user account
     */
    async deleteAccount(req, res) {
        try {
            const userId = req.user.id;
            await authService.deleteUser(userId);
            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(500).json({ success: false, message: 'Failed to delete account', error: error.message });
        }
    }
};

module.exports = authController;
