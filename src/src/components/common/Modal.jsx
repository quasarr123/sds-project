import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  showClose = true,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: '420px',
    md: '580px',
    lg: '800px',
    xl: '1000px',
  }[size] || '580px';

  return (
    <div className="coep-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="coep-modal-container"
        style={{ maxWidth: maxWidths }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="coep-modal-header">
          <h2 className="coep-modal-title">{title}</h2>
          {showClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
              }}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="coep-modal-body">{children}</div>
        {footer && <div className="coep-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
