import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import ImageCropper from '../components/ImageCropper';


const Profile = () => {
  const { user, token, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [removePhoto, setRemovePhoto] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState('');


  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
      setPreviewImage(user.profileImage ? `${process.env.REACT_APP_UPLOAD_URL}${user.profileImage}` : '');
      setRemovePhoto(false);
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

  const handleSendOtp = async () => {
    try {
      setError('');
      setMessage('');
      await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/send-otp`,
        { phone: formData.phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOtpSent(true);
      setMessage('Verification code sent! Check your messages (or the terminal).');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('phone', formData.phone);
      
      if (formData.phone !== user.phone && otp) {
        payload.append('otp', otp);
      }

      if (profileImage) {
        payload.append('profileImage', profileImage);
      } else if (removePhoto) {
        payload.append('removeProfileImage', 'true');
      }

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/auth/profile`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setMessage('Profile updated successfully!');
        setIsEditing(false);
        setOtp('');
        setOtpSent(false);
        setProfileImage(null);
        setRemovePhoto(false);
        // Call updateUser in context if available, or force reload context
        if(updateUser) updateUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
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

        <div className="mb-6 flex flex-col items-center">
          <div className="relative h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 text-3xl font-bold uppercase overflow-hidden mb-2 shadow-sm border border-gray-200">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <label className="cursor-pointer text-white text-xs text-center p-1 w-full h-full flex items-center justify-center">
                  Change
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setTempImageSrc(URL.createObjectURL(e.target.files[0]));
                        setShowCropper(true);
                      }
                    }}
                  />
                </label>
              </div>
            )}

          </div>
          {isEditing && <span className="text-xs text-gray-500">Click avatar to upload new image</span>}
          {isEditing && previewImage && (
            <button 
              type="button" 
              onClick={() => {
                setProfileImage(null);
                setPreviewImage('');
                setRemovePhoto(true);
              }} 
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
            >
              Remove Photo
            </button>
          )}
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
                <div className="flex gap-2">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  {formData.phone !== user?.phone && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-4 py-2 bg-secondary-600 text-white rounded-md text-sm hover:bg-secondary-700 transition"
                    >
                      Send Code
                    </button>
                  )}
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-primary-50"
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setOtpSent(false);
                    setOtp('');
                    setProfileImage(null);
                    setPreviewImage(user?.profileImage ? `${process.env.REACT_APP_UPLOAD_URL}${user.profileImage}` : '');
                    setFormData({ name: user.name || '', phone: user.phone || '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formData.phone !== user?.phone && !otp}
                  className="flex-1 bg-primary-900 text-white py-3 rounded-md font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Payment Methods Section */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <h3 className="text-xl font-serif font-bold text-gray-900 mb-6">Payment Methods</h3>
          
          <div className="space-y-4">
            {user?.savedCards && user.savedCards.length > 0 ? (
              user.savedCards.map((card) => (
                <div key={card._id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
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
      </div>
      
      {showCropper && (
        <ImageCropper 
          src={tempImageSrc}
          onCropComplete={(file, preview) => {
            setProfileImage(file);
            setPreviewImage(preview);
            setShowCropper(false);
          }}
          onCancel={() => setShowCropper(false)}
        />
      )}
    </div>

  );
};

export default Profile;
