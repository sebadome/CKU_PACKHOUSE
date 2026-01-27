import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`bg-cku-white rounded-2xl shadow-sm border border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

// FIX: Allow standard HTML attributes (like 'id') to be passed to the h3 element.
export const CardTitle: React.FC<{ children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <h3 className={`text-lg font-semibold text-cku-blue ${className}`} {...props}>{children}</h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <p className={`text-sm text-gray-500 mt-1 ${className}`} {...props}>{children}</p>
);
