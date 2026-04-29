import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ className = "h-10 text-primary-900", light = false, showWordmark = false }) => {
  const textColor = light ? 'text-white' : 'text-primary-900';

  return (
    <Link to="/" className={`flex items-center ${showWordmark ? 'flex-col justify-center' : ''} ${className}`}>
      <img 
        src={light ? "/images/avenza-logo-white.png" : "/images/avenza-logo-mark.png"} 
        alt="AVENZA Logo" 
        className={`${showWordmark ? 'h-[58%]' : 'h-full'} w-auto object-contain`}
      />
      {showWordmark && (
        <span className={`${textColor} mt-1 flex flex-col items-center font-sans uppercase leading-none`}>
          <span className="text-xl font-semibold tracking-[0.45em] md:text-2xl">
            AVENZA
          </span>
          <span className="mt-1.5 text-[0.65rem] font-bold tracking-[0.6em] md:text-[0.7rem]">
            CLOTHING
          </span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
