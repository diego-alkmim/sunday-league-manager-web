import React from 'react';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  inputClassName?: string;
};

export const Input: React.FC<InputProps> = ({
  label,
  labelClassName = '',
  wrapperClassName = '',
  inputClassName,
  className = '',
  ...props
}) => {
  const resolvedInputClass = inputClassName ?? className;
  const combined = [
    'w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none bg-white/80',
    resolvedInputClass,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <label
      className={['flex flex-col gap-1 text-sm font-medium text-slate-700', wrapperClassName, labelClassName]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
      <input {...props} className={combined} />
    </label>
  );
};
