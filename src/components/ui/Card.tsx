import React from 'react';

type CardProps = {
  title?: string;
  children: React.ReactNode;
};

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
    {title ? <h3 className="mb-2 text-sm font-semibold text-slate-700">{title}</h3> : null}
    <div className="text-sm text-slate-800">{children}</div>
  </div>
);
