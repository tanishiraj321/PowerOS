import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'accent' | 'pink' | 'sage';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  icon,
  badge,
  variant = 'default',
  className = '',
}) => {
  const variantBg = {
    default: 'bg-white hover:border-[#84A282]/50',
    accent: 'bg-[#FEFAF3] border-[#84A282]/40',
    pink: 'bg-[#FEFAF3] hover:border-[#F6E2E9]',
    sage: 'bg-[#FEFAF3] border-[#B8CFB3]',
  };

  return (
    <div
      className={`relative p-5 rounded-xl border border-[#DFE7DD] transition-all duration-200 shadow-soft ${variantBg[variant]} ${className}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#596D5F]">
          {title}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && (
            <div className="p-2 rounded-lg bg-[#FEFAF3] text-[#84A282] border border-[#DFE7DD]/60">
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 mt-1">
        <span className="text-2xl lg:text-3xl font-semibold tracking-tight text-[#26352B]">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-[#596D5F]">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#596D5F] leading-relaxed line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
