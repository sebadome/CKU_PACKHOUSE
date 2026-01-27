import React, { useRef, useImperativeHandle } from 'react';
import { CalendarIcon } from '../Icons';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
 // Bloquea el evento de la rueda
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, name, error, hint, id, ...props }, ref) => {
    const inputId = id || name || React.useId();
    
    const internalRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => internalRef.current!);
    
    const baseClasses =
      'block w-full px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-cku-blue focus:border-cku-blue sm:text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed opacity-100';
    
    const errorClasses =
      'border-cku-red focus:ring-cku-red focus:border-cku-red placeholder:text-cku-red/60';
      
    const isDate = type === 'date';
    const mergedClasses = `${baseClasses} ${error ? errorClasses : ''} ${isDate ? 'date-input-field pr-10' : ''} ${className}`.trim();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative custom-date-container">
          <input
            id={inputId}
            ref={internalRef}
            type={type}
            name={name}
            className={mergedClasses}
             // Bloquea el evento de la rueda
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
              onWheel={(e) => {
              if (type === 'number') {
                (e.target as HTMLInputElement).blur();
              }
            }}
          
            
          />
          {isDate && (
            <div 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
              aria-hidden="true"
            >
              <CalendarIcon className="w-5 h-5" />
            </div>
          )}
        </div>
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-cku-red">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;