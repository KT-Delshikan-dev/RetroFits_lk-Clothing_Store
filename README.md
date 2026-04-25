# Retrofits LK - Clothing E-commerce Web Application

A full-stack e-commerce web application for a clothing store called "Retrofits LK". Built with React, Node.js, Express, and MongoDB.

![Retrofits LK](https://img.shields.io/badge/Retrofits-LK-primary)
![License](https://img.shields.io/badge/license-ISC-blue)

## Features

### User Features
- **User Authentication**: Register and login with JWT-based authentication
- **Product Browsing**: Browse clothing items with filtering and sorting
- **Search**: Full-text search across products
- **Shopping Cart**: Add/remove items, update quantities
- **Checkout**: Complete checkout with delivery address and payment selection
- **Order History**: View past orders and track status
- **Order Cancellation**: Cancel pending/confirmed orders

### Admin Features
- **Product Management**: Add, edit, and delete products
- **Image Upload**: Upload product images
- **Order Management**: View all orders and update status
- **Inventory Management**: Track stock levels

### Payment Options
- Cash on Delivery (COD)
- Card Payment (Mock Stripe integration)

### Additional Features
- Responsive design (mobile + desktop)
- Category-based browsing (Men, Women, Streetwear, Accessories, Footwear, Sale)
- SMS confirmation (Mock Twilio integration)
- Bill generation after purchase

## Tech Stack

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads

## Project Structure

```
Clothing_Store_Web_app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── orders.js
│   │   └── users.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   ├── seed.js
│   └── package.json
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   ├── CartSidebar.js
    │   │   └── Footer.js
    │   ├── context/
    │   │   ├── AuthContext.js
    │   │   └── CartContext.js
    │   ├── pages/
    │   │   ├── Home.js
    │   │   ├── Products.js
    │   │   ├── ProductDetail.js
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── Checkout.js
    │   │   ├── Orders.js
    │   │   ├── OrderConfirmation.js
    │   │   └── Admin.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    ├── .env
    ├── tailwind.config.js
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd Clothing_Store_Web_app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/retrofits_lk
   JWT_SECRET=your_secret_key_here
   NODE_ENV=development
   ```

4. **Seed the database with sample data**
   ```bash
   npm run seed
   ```

5. **Start the backend server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Install frontend dependencies (in a new terminal)**
   ```bash
   cd frontend
   npm install
   ```

7. **Configure frontend environment**
   
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

8. **Start the frontend development server**
   ```bash
   npm start
   ```

9. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Demo Accounts

After running the seed script, you can use these demo accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@retrofits.lk | admin123 |
| User | user@retrofits.lk | user123 |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Products
- `GET /api/products` - Get all products (with filtering, sorting, pagination)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)
- `GET /api/products/featured/` - Get featured products

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/payment` - Update payment status
- `DELETE /api/orders/:id/cancel` - Cancel order
- `GET /api/orders/admin/all` - Get all orders (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

### Users
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/addresses` - Add/update address
- `PUT /api/users/password` - Change password

## Features Overview

### Shopping Flow
1. Browse products on the home page or products page
2. Filter by category, price range, or search
3. View product details with size/color options
4. Add items to cart
5. Proceed to checkout
6. Enter delivery information
7. Select payment method (COD or Card)
8. Confirm order and view confirmation

### Admin Panel
- Access at `/admin` (requires admin role)
- Manage products (add, edit, delete)
- View and manage all orders
- Update order status

## Styling

The application uses Tailwind CSS with custom color schemes:
- Primary: Warm brown tones (#b87354)
- Secondary: Neutral beige tones (#9e8f6e)
- Fonts: Inter (sans-serif), Playfair Display (serif)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.

## Contact

For support or queries, please contact:
- Email: info@retrofits.lk
- Phone: +94 11 234 5678

---

Built with ❤️ by Retrofits LK Team# RetroFits_lk-Clothing_Store
