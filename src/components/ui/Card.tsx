import React from 'react';

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => (
  <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
    {title ? <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3> : null}
    <div className="text-sm text-slate-800">{children}</div>
  </div>
);
