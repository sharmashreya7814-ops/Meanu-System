import React from 'react';

interface VegBadgeProps {
  isVeg: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const VegBadge: React.FC<VegBadgeProps> = ({ isVeg, className = '', size = 'md' }) => {
  const boxSizes = {
    sm: 'w-3.5 h-3.5 border',
    md: 'w-4 h-4 border-2',
    lg: 'w-5 h-5 border-2',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  if (isVeg) {
    return (
      <span
        title="Pure Vegetarian"
        className={`inline-flex items-center justify-center rounded-[3px] border-emerald-600 bg-white ${boxSizes[size]} ${className}`}
      >
        <span className={`rounded-full bg-emerald-600 ${dotSizes[size]}`} />
      </span>
    );
  }

  return (
    <span
      title="Non-Vegetarian"
      className={`inline-flex items-center justify-center rounded-[3px] border-red-700 bg-white ${boxSizes[size]} ${className}`}
    >
      <span className={`rounded-full bg-red-700 ${dotSizes[size]}`} />
    </span>
  );
};
