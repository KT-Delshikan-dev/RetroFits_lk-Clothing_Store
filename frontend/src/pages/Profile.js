import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';


const Profile = () => {
  const { user, token, updateUser, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);


  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        if(updateUser) updateUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you SURE you want to delete your account? This action is PERMANENT and all your data will be lost.')) {
      try {
        const response = await axios.delete(
          `${process.env.REACT_APP_API_URL}/auth/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          logout();
        }
      } catch (err) {
        setError('Failed to delete account');
      }
    }
  };

  return (
    <div className="container-custom py-12 flex justify-center min-h-[60vh]">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6 text-center">My Profile</h2>
        
        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 text-center">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col items-center">
          <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-3xl font-bold uppercase shadow-sm border border-gray-200">
            {user?.name?.charAt(0)}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>

          {!isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {user?.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                  {user?.phone || 'Not provided'}
                </div>
              </div>
              
              <div className="mt-8 pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full bg-primary-900 text-white py-3 rounded-md font-semibold hover:bg-primary-800 transition-colors"
                >
                  Edit Details
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ name: user.name || '', phone: user.phone || '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-900 text-white py-3 rounded-md font-semibold hover:bg-primary-800 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Payment Methods Section - Hidden for Admins */}
        {user?.role !== 'admin' && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Payment Methods</h3>
            
            <div className="space-y-4">
              {user?.savedCards && user.savedCards.length > 0 ? (
                user.savedCards.map((card) => (
                  <div key={card.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-12 bg-white border border-gray-200 rounded flex items-center justify-center mr-4">
                        <svg className="h-6 w-10 text-gray-400" viewBox="0 0 36 24" fill="currentColor">
                          <rect width="36" height="24" rx="4" fill="#F3F4F6"/>
                          <path d="M6 10H10V14H6V10ZM12 10H16V14H12V10ZM18 10H22V14H18V10ZM24 10H28V14H24V10Z" fill="#D1D5DB"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{card.cardNumber}</p>
                        <p className="text-xs text-gray-500">{card.cardType} • Exp: {card.expiryDate}</p>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const response = await axios.delete(
                            `${process.env.REACT_APP_API_URL}/users/cards/${card.cardNumber}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );
                          if (response.data.success) {
                            updateUser({ ...user, savedCards: response.data.data });
                          }
                        } catch (err) {
                          setError('Failed to delete card');
                        }
                      }}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-300">
                  No saved payment methods. You can add one during checkout.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-red-50 text-center">
          <p className="text-sm text-gray-500 mb-4">Dangerous Area</p>
          <button
            onClick={handleDeleteAccount}
            className="text-red-600 text-sm font-bold hover:text-red-800 transition-colors"
          >
            Delete My Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
