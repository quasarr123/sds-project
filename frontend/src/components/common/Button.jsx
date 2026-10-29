import React from 'react';

export function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'navy' | 'outline' | 'danger' | 'success'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  id,
  ...props
}) {
  const sizeClasses = {
    sm: 'coep-btn-sm',
    md: '',
    lg: 'coep-btn-lg',
  }[size] || '';

  const variantClasses = {
    primary: 'coep-btn-primary',
    secondary: 'coep-btn-secondary',
    navy: 'coep-btn-navy',
    outline: 'coep-btn-outline',
    danger: 'coep-btn-danger',
    success: 'coep-btn-success',
  }[variant] || 'coep-btn-primary';

  return (
    <button
      id={id}
      type={type}
      className={`coep-btn ${variantClasses} ${sizeClasses} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin"
            style={{ width: '16px', height: '16px', animation: 'coepPulse 0.8s linear infinite' }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 60" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 17} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 17} />}
        </>
      )}
    </button>
  );
}

export default Button;
