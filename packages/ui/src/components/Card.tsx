import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  icon,
}) => {
  return (
    <div
      className={`bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg backdrop-blur-md transition-all hover:border-amber-500/40 ${className}`}
    >
      {(title || icon) && (
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
          <div>
            {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {icon && <div className="text-amber-400 text-xl">{icon}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
