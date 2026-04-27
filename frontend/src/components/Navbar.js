import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from './Logo';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { getCartCount, openCart } = useCart();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const categories = ['Men', 'Women', 'Accessories', 'Footwear', 'Jerseys'];


  const adminLinks = [
    { name: 'Products', path: '/admin/products' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Payments', path: '/admin/payments' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Reports', path: '/admin/reports' },
  ];

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo className="h-10" light={true} />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center items-center space-x-8">
            {isAdmin ? (
              <Link
                to="/admin"
                className="text-white hover:text-secondary-400 transition-colors font-bold text-lg border-b-2 border-secondary-500 pb-1"
              >
                Admin Panel
              </Link>
            ) : (
              <>
                <Link
                  to="/"
                  className="text-gray-300 hover:text-secondary-400 transition-colors font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/products?newArrivals=true"
                  className="text-gray-300 hover:text-secondary-400 transition-colors font-medium whitespace-nowrap"
                >
                  New Arrivals
                </Link>
                {categories.map(category => (
                  <Link
                    key={category}
                    to={`/products?category=${category}`}
                    className="text-gray-300 hover:text-secondary-400 transition-colors font-medium"
                  >
                    {category}
                  </Link>
                ))}
              </>
            )}
          </div>



          {/* Right Side Icons */}
          <div className="flex items-center justify-end space-x-4">
            {/* Cart Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-gray-300 hover:text-secondary-400 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {getCartCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary-500 text-black text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 p-2 text-gray-300 hover:text-secondary-400 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden border border-gray-700">
                    {user.profileImage ? (
                      <img 
                        src={`${process.env.REACT_APP_UPLOAD_URL}${user.profileImage}`} 
                        alt={user.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-primary-600 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="hidden lg:block font-medium">{user.name}</span>
                </button>

                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                  >
                    My Profile
                  </Link>
                  {!isAdmin && (
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      My Orders
                    </Link>
                  )}




                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-gray-300 hover:text-secondary-400 transition-colors font-medium px-2 py-1"
              >
                Login
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Second Row for Search Bar (Desktop) */}
        {!isAdmin && (
          <div className="hidden md:flex justify-center pb-4">
            <form onSubmit={handleSearch} className="w-full max-w-2xl px-4">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 pl-10 border border-gray-600 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {!isAdmin && (
              <form onSubmit={handleSearch} className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </form>
            )}
            <div className="space-y-2">
              {isAdmin ? (
                <Link
                  to="/admin"
                  className="block px-4 py-2 text-primary-600 font-bold hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              ) : (
                <>
                  <Link
                    to="/"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/products?newArrivals=true"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 font-bold border-l-4 border-secondary-500"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    New Arrivals
                  </Link>
                  {categories.map(category => (
                    <Link
                      key={category}
                      to={`/products?category=${category}`}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {category}
                    </Link>
                  ))}
                </>
              )}

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  {!isAdmin && (
                    <Link
                      to="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Orders
                    </Link>
                  )}




                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-4 py-2 text-primary-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;