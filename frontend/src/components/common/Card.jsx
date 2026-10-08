import React from 'react';

export function Card({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerBg = 'bg-white',
  highlight = false,
}) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200/80 shadow-soft-blue overflow-hidden transition-all duration-200 ${highlight ? 'ring-2 ring-gold-500/50 shadow-gold-glow' : ''} ${className}`}>
      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 ${headerBg}`}>
          <div>
            {title && <h3 className="font-poppins font-semibold text-brand-900 text-base">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
