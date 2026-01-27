import React from 'react';
import { ChevronDownIcon } from '../Icons';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, label, name, error, hint, id, ...props }, ref) => {
    const selectId = id || name || React.useId();

    const baseClasses =
      'appearance-none block w-full pl-3 pr-10 py-2 bg-white border border-gray-300 rounded-lg shadow-sm ' +
      'focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm ' +
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed';

    const errorClasses = 'border-cku-red focus:ring-cku-red focus:border-cku-red';

    const merged = `${baseClasses} ${error ? errorClasses : ''} ${className}`.trim();

    const describedBy =
      error ? `${selectId}-error`
      : hint ? `${selectId}-hint`
      : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            id={selectId}
            name={name}
            ref={ref}
            className={merged}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          >
            {children}
          </select>
          <ChevronDownIcon
            className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
            aria-hidden="true"
          />
        </div>

        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1 text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-cku-red">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
