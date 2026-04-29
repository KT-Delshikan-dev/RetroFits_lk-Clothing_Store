import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CartSidebar = () => {
  const { cartItems, isOpen, closeCart, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    if (isAuthenticated) {
      navigate('/checkout');
    } else {
      navigate('/login', { state: { from: '/checkout' } });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeCart} />
      
      <div className="fixed inset-y-0 right-0 max-w-full flex">
        <div className="w-screen max-w-md transform transition-transform duration-300 ease-in-out">
          <div className="h-full flex flex-col bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-6 border-b">
              <h2 className="text-lg font-serif font-semibold text-gray-900">
                Shopping Cart ({cartItems.length} items)
              </h2>
              <button
                onClick={closeCart}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-gray-500 text-lg">Your cart is empty</p>
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Continue Shopping →
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cartItems.map((item, index) => (
                    <li key={`${item.product.id}-${item.size}-${item.color}-${index}`} className="flex py-2 animate-fadeIn">
                      {/* Product Image */}
                      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {item.image ? (
                          <img
                            src={`${process.env.REACT_APP_UPLOAD_URL}${item.image}`}
                            alt={item.product.name}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-1 flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h3 className="line-clamp-1">
                              <Link to={`/product/${item.product.id}`} onClick={closeCart}>
                                {item.product.name}
                              </Link>
                            </h3>
                            <p className="ml-4">LKR {(item.product.price * item.quantity).toLocaleString()}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">
                            {item.size && `Size: ${item.size}`}
                            {item.color && ` | Color: ${item.color}`}
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm">
                          <div className="flex items-center border border-gray-300 rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity - 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 text-gray-900 font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.size, item.color, item.quantity + 1)}
                              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.size, item.color)}
                            className="font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 px-4 py-6">
                <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                  <p>Subtotal</p>
                  <p>LKR {getCartTotal().toLocaleString()}</p>
                </div>
                <p className="mt-0.5 text-sm text-gray-500 mb-6">
                  Shipping and taxes calculated at checkout.
                </p>
                <button
                  onClick={handleCheckout}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  Checkout
                </button>
                <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                  <p>
                    or{' '}
                    <Link
                      to="/products"
                      onClick={closeCart}
                      className="font-medium text-primary-600 hover:text-primary-500"
                    >
                      Continue Shopping
                      <span aria-hidden="true"> →</span>
                    </Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;