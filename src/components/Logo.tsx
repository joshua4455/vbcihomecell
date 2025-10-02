import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <img 
      src="/logo12.png" 
      alt="Gospel Gather Logo" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};
