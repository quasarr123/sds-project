import React, { useState } from 'react';
import {
  Bell,
  User,
  LogOut,
  KeyRound,
  Shield,
  ChevronDown,
  Building2,
  Menu,
} from 'lucide-react';

export function Navbar({
  currentUser,
  currentRole,
  onLogout,
  onOpenChangePassword,
  pendingCount = 0,
  onToggleSidebar,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const roleLabels = {
    student: 'Student',
    faculty: 'Faculty Member',
    hod: 'Head of Department',
    superadmin: 'Superadmin / Registrar',
  };

  return (
    <header className="coep-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onToggleSidebar}
          className="coep-btn coep-btn-secondary coep-btn-sm"
          style={{ display: 'none', padding: '6px' }}
          id="mobile-sidebar-toggle"
        >
          <Menu size={18} />
        </button>

        <div className="coep-brand-crest">
          <div className="coep-crest-badge">COEP</div>
          <div className="coep-brand-title">
            <h1>COEP Technological University</h1>
            <span>Centralized Venue & Space Reservation Portal</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            style={{
              position: 'relative',
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              width: '38px',
              height: '38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: 'var(--coep-maroon-700)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '16px',
                zIndex: 60,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--coep-navy-900)' }}>Notifications</span>
                <span style={{ fontSize: '11px', color: 'var(--coep-maroon-700)', fontWeight: 600 }}>{pendingCount} Pending</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {pendingCount > 0 ? (
                  <div style={{ padding: '8px 10px', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--warning-border)' }}>
                    🔔 You have <strong>{pendingCount}</strong> reservation requests requiring institutional action or review.
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>All queues clear. No unread alerts.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#ffffff',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '5px 10px',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--coep-navy-800) 0%, var(--coep-maroon-800) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '12px',
              }}
            >
              {currentUser?.avatar || 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentUser?.name || 'COEP User'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--coep-maroon-700)', fontWeight: 600 }}>
                {roleLabels[currentRole]}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-tertiary)" />
          </button>

          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '240px',
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--border-subtle)',
                padding: '8px',
                zIndex: 60,
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Institutional MIS / ID</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--coep-navy-900)' }}>
                  {currentUser?.mis || currentUser?.designation || 'COEP Faculty / Admin'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentUser?.department}
                </div>
              </div>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenChangePassword();
                }}
                className="coep-nav-link"
                style={{
                  color: 'var(--text-primary)',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <KeyRound size={16} color="var(--coep-maroon-700)" />
                <span>Change Password</span>
              </button>

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                className="coep-nav-link"
                style={{
                  color: 'var(--danger-solid)',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <LogOut size={16} />
                <span>Logout Session</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
