import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  children: React.ReactNode;
}

// FIX: Wrap the component in React.forwardRef to allow refs to be passed to the underlying button element.
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  type,
  ...props
}, ref) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
    lg: 'px-6 py-3 text-base',
  } as const;

  const variantClasses = {
    primary: 'bg-cku-red text-cku-white hover:bg-red-700 focus-visible:ring-cku-red',
    secondary: 'bg-gray-200 text-cku-black hover:bg-gray-300 focus-visible:ring-gray-400',
    destructive: 'bg-red-100 text-cku-red hover:bg-red-200 focus-visible:ring-cku-red',
    ghost: 'bg-transparent text-cku-blue hover:bg-blue-50 focus-visible:ring-cku-blue',
  } as const;

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
