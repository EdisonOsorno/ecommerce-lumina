import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={`btn btn--${variant} btn--${size} ${isLoading ? 'btn--loading' : ''} ${className}`}
        {...props}
      >
        {isLoading && <span className="btn__spinner" aria-hidden="true" />}
        {!isLoading && leftIcon && <span className="btn__icon btn__icon--left">{leftIcon}</span>}
        <span className="btn__text">{children}</span>
        {!isLoading && rightIcon && <span className="btn__icon btn__icon--right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
