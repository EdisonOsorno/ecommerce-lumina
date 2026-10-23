import React from 'react';
import './Alert.css';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      role="alert"
      className={`alert alert--${variant} ${className}`}
      {...props}
    >
      <div className="alert__content">
        {title && <strong className="alert__title">{title}</strong>}
        <div className="alert__message">{children}</div>
      </div>
    </div>
  );
};
