import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "h-10 text-primary-900", light = false }) => {
  return (
    <Link to="/" className={`flex items-center space-x-3 ${className}`}>
      {/* Luxurious Geometry / Minimalist Icon */}
      <svg 
        viewBox="0 0 100 100" 
        className={`w-10 h-10 ${light ? 'text-white' : 'text-primary-700'}`} 
        fill="currentColor"
      >
        <path d="M50 0L95 25L95 75L50 100L5 75L5 25Z" fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="miter"/>
        <path d="M50 20L75 35L75 65L50 80L25 65L25 35Z" />
        <path d="M50 35L60 45L60 55L50 65L40 55L40 45Z" fill={light ? "var(--primary-600, #486581)" : "white"} />
      </svg>
      <div className="flex flex-col justify-center hidden sm:flex">
        <span className={`font-serif font-bold text-2xl leading-none tracking-widest ${light ? 'text-white' : 'text-gray-900'}`} style={{ letterSpacing: '0.15em' }}>
          RETROFITS
        </span>
        <span className={`font-sans text-[0.6rem] font-bold leading-tight tracking-[0.25em] uppercase mt-1 ${light ? 'text-gray-300' : 'text-gray-500'}`}>
          Clothing Co.
        </span>
      </div>
    </Link>
  );
};

export default Logo;
