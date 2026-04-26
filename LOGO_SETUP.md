# Retrofits LK - Logo Setup Guide

## How to Add Your Logo

Your clothing store logo is ready to be integrated! Here's how:

### Option 1: Using PNG Logo (Recommended)
1. Place your `retrofits-logo.png` file in:
   ```
   frontend/public/images/retrofits-logo.png
   ```

2. The website will automatically display it on:
   - Navbar (top of every page)
   - Login page
   - Register page

### Option 2: SVG Logo (Current)
- A default SVG logo has been created as a fallback at `frontend/public/logo.svg`
- This will display if the PNG file is not found

### File Requirements
- **Format**: PNG, SVG, or JPG
- **Recommended Size**: 200x100 pixels or larger
- **Aspect Ratio**: 2:1 (width:height)
- **Background**: Should be transparent (PNG) or white background

### Testing
The logo component automatically:
1. Tries to load from `images/retrofits-logo.png`
2. Falls back to `logo.svg` if PNG not found
3. Shows properly on all pages

## Registration & Login Issues - Fixed! ✅

### What Was Fixed:
1. **Double Password Hashing** - Passwords were being hashed twice, preventing login
   - Fixed in `seed.js` and `models/User.js`
   
2. **Missing CSS Styles** - Added proper Tailwind CSS utilities
   - `input-field`, `btn-primary`, `btn-secondary`, etc.
   
3. **Form Validation** - Registration form now works properly
   - Validates password match
   - Validates minimum password length (6 characters)
   - Shows proper error messages

### Current Demo Credentials:
```
User Account:
Email: user@retrofits.lk
Password: user123

Admin Account:
Email: admin@retrofits.lk
Password: admin123
```

### How to Register a New User:
1. Go to `/register`
2. Fill in the form:
   - Full Name
   - Email
   - Phone Number
   - Password (minimum 6 characters)
   - Confirm Password
   - Accept Terms and Conditions
3. Click "Create Account"
4. You'll be automatically logged in and redirected to home

## Features Now Working:
✅ User Registration
✅ User Login
✅ Add to Cart
✅ Checkout
✅ Product Search
✅ Category Filtering
✅ Admin Dashboard
✅ Logo Display

## Next Steps:
1. Copy your logo file to `frontend/public/images/retrofits-logo.png`
2. Refresh the website to see your logo displayed
3. The website should now work perfectly!

