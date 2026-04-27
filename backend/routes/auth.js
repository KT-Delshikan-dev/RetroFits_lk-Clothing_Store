const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');
const sendEmail = require('../utils/email');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});

// @route   POST /api/auth/send-otp
// @desc    Send verification OTP for phone number change
// @access  Private
router.post('/send-otp', protect, [
  body('phone').trim().notEmpty().withMessage('Phone number is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { phone } = req.body;
    const user = await User.findById(req.user.id);

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 10 mins expiration
    user.phoneVerificationCode = otp;
    user.phoneVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Mock SMS sending
    console.log(`\n==============================================`);
    console.log(`[MOCK SMS SERVICE]`);
    console.log(`To: ${phone}`);
    console.log(`Message: Your RetroFits LK verification code is: ${otp}`);
    console.log(`==============================================\n`);

    res.json({
      success: true,
      message: 'Verification code sent successfully'
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending OTP'
    });
  }
});

// @route   POST /api/auth/send-email-otp
// @desc    Send verification OTP for card payment
// @access  Private
router.post('/send-email-otp', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save to user with 10 mins expiration
    user.emailVerificationCode = otp;
    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email
    await sendEmail({
      email: user.email,
      subject: 'Verification Code for Retrofits LK Payment',
      message: `Your verification code for card payment is: ${otp}. This code will expire in 10 minutes.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Card Verification</h2>
          <p>Hi ${user.name},</p>
          <p>You are attempting a card payment on Retrofits LK. Please use the following code to verify your transaction:</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not initiate this request, please ignore this email.</p>
          <p>Regards,<br>Retrofits LK Team</p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });
  } catch (error) {
    console.error('Send Email OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending email OTP'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, upload.single('profileImage'), handleMulterError, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { name, phone, otp } = req.body;
    const user = await User.findById(req.user.id);

    if (name) user.name = name;
    
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    } else if (req.body.removeProfileImage === 'true') {
      user.profileImage = '';
    }
    
    if (phone && phone !== user.phone) {
      if (!otp) {
        return res.status(400).json({
          success: false,
          message: 'Verification code is required to change phone number'
        });
      }
      
      if (!user.phoneVerificationCode || user.phoneVerificationCode !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
      }
      
      if (user.phoneVerificationExpires < Date.now()) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired'
        });
      }
      
      // Update phone and clear verification code
      user.phone = phone;
      user.phoneVerificationCode = undefined;
      user.phoneVerificationExpires = undefined;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
});


module.exports = router;