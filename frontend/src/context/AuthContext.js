import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { account } from '../services/appwrite';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      
      // Check for Appwrite session (Google Login)
      try {
        const appwriteUser = await account.get();
        if (appwriteUser) {
          // If we have an Appwrite session but no backend token, sync them
          if (!storedToken) {
            // This is a simplified sync - in a real app, you'd send the Appwrite session to the backend
            // For now, let's just fetch the user from our backend by email
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me-social?email=${appwriteUser.email}`);
            if (response.data.success) {
              const { token: newToken, user: userData } = response.data;
              localStorage.setItem('token', newToken);
              setToken(newToken);
              setUser(userData);
              setLoading(false);
              return;
            }
          }
        }
      } catch (e) {
        // No Appwrite session, proceed with token check
      }

      if (storedToken) {
        setToken(storedToken);
        try {
          const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data.user);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
      email,
      password
    });
    
    const { token: newToken, user: userData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    
    return response.data;
  };

  const loginWithGoogle = () => {
    account.createOAuth2Session(
      'google',
      window.location.origin, // Success redirect
      window.location.origin + '/login' // Failure redirect
    );
  };

  const register = async (userData) => {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/register`, userData);
    
    const { token: newToken, user: newUser } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;