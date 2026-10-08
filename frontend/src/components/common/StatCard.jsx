import React from 'react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive,
  accent = 'gold', // gold | blue | emerald | rose
  className = '',
  onClick,
}) {
  const accentStyles = {
    gold: {
      border: 'border-l-4 border-l-gold-500',
      iconBg: 'bg-gold-50 text-gold-600',
      valueColor: 'text-brand-900',
    },
    blue: {
      border: 'border-l-4 border-l-brand-500',
      iconBg: 'bg-brand-50 text-brand-700',
      valueColor: 'text-brand-900',
    },
    emerald: {
      border: 'border-l-4 border-l-emerald-500',
      iconBg: 'bg-emerald-50 text-emerald-600',
      valueColor: 'text-emerald-700',
    },
    rose: {
      border: 'border-l-4 border-l-rose-500',
      iconBg: 'bg-rose-50 text-rose-600',
      valueColor: 'text-rose-700',
    }
  };

  const style = accentStyles[accent] || accentStyles.gold;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-5 border border-gray-200/90 shadow-soft-blue flex items-start justify-between gap-4 relative overflow-hidden transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''} ${style.border} ${className}`}
    >
      <div className="flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <h4 className={`text-2xl font-poppins font-bold mt-1.5 ${style.valueColor}`}>{value}</h4>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trendPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span>{trendPositive ? '↑' : '↓'}</span> {trend}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl shrink-0 ${style.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}
