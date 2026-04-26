import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CartSidebar from './CartSidebar';
import Footer from './Footer';

const StoreLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <CartSidebar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
