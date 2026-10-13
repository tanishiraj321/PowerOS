import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'sage' | 'muted' | 'pink' | 'ivory' | 'neutral' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'sage',
  size = 'md',
  className = '',
}) => {
  const variantStyles = {
    sage: 'bg-[#B8CFB3]/30 text-[#26352B] border-[#B8CFB3]',
    muted: 'bg-[#84A282] text-white border-[#84A282]',
    pink: 'bg-[#F6E2E9] text-[#26352B] border-[#E8CCD5]',
    ivory: 'bg-[#FEFAF3] text-[#26352B] border-[#DFE7DD]',
    neutral: 'bg-white text-[#596D5F] border-[#DFE7DD]',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
