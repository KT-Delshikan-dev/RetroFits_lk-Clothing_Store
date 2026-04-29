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
                message: 'User registered successfully',
                token: result.token,
                user: result.user
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
                    role: user.role
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

            // Handle profile image upload
            if (req.file) {
                updateData.profileImage = `/uploads/${req.file.filename}`;
            } else if (req.body.removeProfileImage === 'true') {
                updateData.profileImage = null;
            }

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
    }
};

module.exports = authController;
