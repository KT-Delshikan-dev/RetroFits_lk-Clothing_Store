import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "h-10 text-primary-900", light = false }) => {
  return (
    <Link to="/" className={`flex items-center space-x-3 ${className}`}>
      {/* Luxurious Geometry / Minimalist Icon */}
      <svg 
        viewBox="0 0 100 100" 
        className={`w-10 h-10 ${light ? 'text-white' : 'text-primary-600'}`} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="4"
      >
        {/* Sophisticated Geometric A */}
        <path d="M50 10 L15 90 M50 10 L85 90 M30 65 L70 65 M50 10 L50 65" strokeLinecap="square"/>
        <path d="M50 40 L35 75 M50 40 L65 75" strokeWidth="2"/>
      </svg>
      <div className="flex flex-col justify-center hidden sm:flex">
        <span className={`font-serif font-bold text-2xl leading-none tracking-[0.25em] ${light ? 'text-white' : 'text-gray-900'}`}>
          AVENZA
        </span>
        <span className={`font-sans text-[0.6rem] font-bold leading-tight tracking-[0.4em] uppercase mt-1 ${light ? 'text-secondary-400' : 'text-secondary-600'}`}>
          High-End Fashion
        </span>
      </div>
    </Link>
  );
};

export default Logo;
