import React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
};

export const Select: React.FC<SelectProps> = ({
  label,
  labelClassName = '',
  wrapperClassName = '',
  children,
  className = '',
  ...props
}) => {
  const combined = [
    'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none bg-white/80',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium text-slate-700 ${labelClassName} ${wrapperClassName}`}>
      {label}
      <select {...props} className={combined}>
        {children}
      </select>
    </label>
  );
};
