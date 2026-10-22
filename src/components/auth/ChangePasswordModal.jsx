import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/FormControls';

export function ChangePasswordModal({ isOpen, onClose, user, onPasswordChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please provide your current COEP account password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters with letters, numbers, and symbols.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Confirmation password does not match the new password.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      if (onPasswordChanged) {
        onPasswordChanged({
          timestamp: new Date().toLocaleString(),
          actor: user.name,
          role: user.role,
        });
      }
      setTimeout(() => {
        handleClose();
      }, 1400);
    }, 800);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change COEP Portal Password"
      size="sm"
    >
      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-solid)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
            Password Updated!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            Your account credentials have been securely refreshed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div
            style={{
              backgroundColor: 'var(--bg-app)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <KeyRound size={16} color="var(--coep-maroon-700)" />
            <span>
              Updating password for: <strong>{user?.name || 'Account'}</strong> ({user?.email})
            </span>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                color: 'var(--danger-text)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            required
            placeholder="••••••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            hint="Include upper & lowercase, numbers, and symbols."
          />

          <Input
            label="Confirm New Password"
            type="password"
            required
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Update Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default ChangePasswordModal;
