import React from 'react';
import { AlertTriangle, ShieldAlert, FolderSearch, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './Button';

// 1. Loading State
export function LoadingState({ message = 'Loading COEP reservation data...', fullScreen = false }) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          border: '4px solid rgba(159, 22, 63, 0.15)',
          borderTopColor: 'var(--coep-maroon-700)',
          animation: 'coepSpin 1s linear infinite',
        }}
      />
      <style>
        {`@keyframes coepSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
      </style>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px' }}>{message}</div>
      <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>Connecting to COEP Central Database...</div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}

// 2. Empty List State
export function EmptyState({
  title = 'No items found',
  message = 'There are no active records in this view right now.',
  actionLabel,
  onAction,
  icon: Icon = FolderSearch,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '56px 24px',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-medium)',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--coep-gold-100)',
          color: 'var(--coep-gold-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: actionLabel ? '20px' : '0' }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// 3. Error Message State
export function ErrorMessage({
  title = 'An error occurred',
  message = 'Failed to load the requested venue or booking information. Please check network connection.',
  onRetry,
  onDismiss,
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--danger-bg)',
        border: '1px solid var(--danger-border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        margin: '16px 0',
      }}
    >
      <div style={{ color: 'var(--danger-solid)', marginTop: '2px', flexShrink: 0 }}>
        <AlertTriangle size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '4px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--danger-text)', opacity: 0.9 }}>{message}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} icon={RefreshCw}>
            Retry
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--danger-text)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 8px',
            }}
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// 4. Access Denied (403 Page)
export function AccessDeniedPage({
  requiredRole = 'Superadmin or HOD',
  currentRole = 'Student',
  onBack,
}) {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-solid)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '2px solid var(--danger-border)',
          }}
        >
          <ShieldAlert size={38} />
        </div>

        <span
          style={{
            fontSize: '12px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: 'var(--danger-solid)',
          }}
        >
          Error 403 • Unauthorized Action
        </span>

        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)', marginTop: '8px', marginBottom: '12px' }}>
          Access Denied
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          You do not have the required institutional authorization to access this page. This administrative module requires{' '}
          <strong style={{ color: 'var(--coep-maroon-700)' }}>{requiredRole}</strong> clearance. Your current session is authenticated as{' '}
          <strong style={{ color: 'var(--coep-navy-700)' }}>{currentRole}</strong>.
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            fontSize: '13px',
            color: 'var(--text-tertiary)',
            marginBottom: '28px',
            textAlign: 'left',
          }}
        >
          🔒 <strong>COEP Security Notice:</strong> All administrative access attempts are logged with client IP and digital signature in the Central Audit Registry.
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Button variant="primary" icon={ArrowLeft} onClick={onBack}>
            Return to Authorized Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
