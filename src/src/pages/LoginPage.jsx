import React, { useState } from 'react';
import { AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import coepppImg from '../coeppp.jpg';
import { api } from '../services/client';

// Role options for the dropdown
const ROLES = [
  { value: 'student',    label: 'Student' },
  { value: 'faculty',    label: 'Faculty' },
  { value: 'hod',        label: 'Head of Department (HOD)' },
  { value: 'superadmin', label: 'Superadmin' },
];

export function LoginPage({ onLoginSuccess, notice = '' }) {
  // Step control: null = show role picker, string = show login form
  const [selectedRole, setSelectedRole] = useState(null);
  const [rolePickerValue, setRolePickerValue] = useState('student');

  // Form fields
  const [mis,      setMis]      = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotSent,  setForgotSent]  = useState(false);

  function handleRoleContinue() {
    setSelectedRole(rolePickerValue);
    setError('');
    setMis(''); setEmail(''); setPassword('');
  }

  function handleBack() {
    setSelectedRole(null);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Students may sign in with their MIS number or their Outlook ID; everyone else uses Outlook ID.
    const identifier = (selectedRole === 'student' && mis.trim() ? mis : email).trim();
    if (selectedRole === 'student' && !mis.trim() && !email.trim()) {
      setError('Please enter your COEP MIS Number or Outlook ID.'); return;
    }
    if (selectedRole !== 'student' && !email.trim()) {
      setError('Please enter your COEP Outlook ID.'); return;
    }
    if (email.trim()) {
      const validDomain = email.includes('@coep.ac.in') || email.includes('@coeptech.ac.in');
      if (!validDomain) { setError('Email must end with @coep.ac.in or @coeptech.ac.in'); return; }
    }
    if (!password) { setError('Please enter your password.'); return; }

    setLoading(true);
    try {
      const { user } = await api.login(identifier, password);
      if (user.role !== selectedRole) {
        await api.logout().catch(() => {});
        const actual = ROLES.find(r => r.value === user.role)?.label || user.role;
        setError(`This account is registered as ${actual}. Go back and choose that role.`);
        return;
      }
      if (onLoginSuccess) onLoginSuccess(user);
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = ROLES.find(r => r.value === selectedRole)?.label || '';

  return (
    <div className="lp-page">
      <style>{`
        /* Page */
        .lp-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 28px 16px;
          background: radial-gradient(circle at 30% 40%, #1e4a3c, #0d221a 70%);
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
        }

        /* Title above card */
        .lp-header {
          text-align: center;
        }
        .lp-header h1 {
          font-size: 22px;
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 4px;
          letter-spacing: 0.2px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .lp-header p {
          font-size: 13px;
          color: #7ecfbf;
          margin: 0;
          text-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }

        /* Card */
        .lp-card {
          width: 100%;
          max-width: 440px;
          background: #1c382e;
          border-radius: 24px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07);
          overflow: hidden;
        }

        /* Banner image (no text overlay) */
        .lp-banner {
          height: 130px;
          overflow: hidden;
        }
        .lp-banner img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }

        /* Form area */
        .lp-body {
          padding: 24px 26px 20px;
        }

        /* Step 1: role picker */
        .lp-role-label {
          display: block;
          font-size: 12px; font-weight: 600;
          color: #c0d8d0; margin-bottom: 8px;
        }
        .lp-role-select {
          width: 100%;
          background: #122820;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px; color: #fff;
          outline: none; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          margin-bottom: 18px;
        }
        .lp-role-select:focus {
          border-color: #4fa39b;
          box-shadow: 0 0 0 3px rgba(79,163,155,0.22);
        }
        .lp-role-select option { background: #132821; }

        /* Step 2: form header */
        .lp-form-header {
          display: flex; align-items: center; gap: 10px; margin-bottom: 2px;
        }
        .lp-back-btn {
          width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #9abdb0;
          transition: background 0.15s;
        }
        .lp-back-btn:hover { background: rgba(255,255,255,0.14); color: #fff; }
        .lp-form-title { font-size: 20px; font-weight: 700; color: #fff; margin: 0; }
        .lp-role-badge {
          display: inline-block;
          background: rgba(79,163,155,0.18); color: #6dcfc5;
          font-size: 11px; font-weight: 700;
          padding: 3px 10px; border-radius: 9999px;
          margin: 4px 0 16px; text-transform: uppercase; letter-spacing: 0.4px;
        }

        /* Error */
        .lp-error {
          display: flex; align-items: center; gap: 8px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; font-size: 12px;
          padding: 9px 14px; border-radius: 10px; margin-bottom: 14px;
        }

        /* Fields */
        .lp-field { margin-bottom: 12px; }
        .lp-field label {
          display: block; font-size: 12px; font-weight: 600;
          color: #c0d8d0; margin-bottom: 5px;
        }
        .lp-field input {
          width: 100%;
          background: #122820;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 10px 16px;
          font-size: 13px; color: #fff; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .lp-field input::placeholder { color: #55796c; }
        .lp-field input:focus {
          border-color: #4fa39b;
          box-shadow: 0 0 0 3px rgba(79,163,155,0.22);
          background: #0f2018;
        }

        /* Password hint links */
        .lp-pw-hint {
          display: flex; gap: 14px; justify-content: flex-end; margin-top: 5px;
        }
        .lp-pw-hint span {
          font-size: 12px; color: #5ea89e; cursor: pointer;
        }
        .lp-pw-hint span:hover { text-decoration: underline; color: #82cbbf; }

        /* Submit button */
        .lp-btn {
          width: 100%; background: #4fa39b; color: #fff; border: none;
          border-radius: 9999px; padding: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 14px; transition: background 0.2s, transform 0.15s;
        }
        .lp-btn:hover    { background: #3e8f87; transform: translateY(-1px); }
        .lp-btn:active   { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Footer */
        .lp-footer {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 16px; padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 11px; color: #6e9386;
        }
        .lp-footer-link { color: #5ea89e; cursor: pointer; }
        .lp-footer-link:hover { text-decoration: underline; }

        /* Modal */
        .lp-modal-bg {
          position: fixed; inset: 0; background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          z-index: 100; padding: 20px;
        }
        .lp-modal {
          background: #fff; border-radius: 18px; padding: 28px;
          max-width: 400px; width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
        }
        .lp-modal h3 { font-size: 17px; font-weight: 700; color: #17362a; margin: 0 0 8px; }
        .lp-modal p  { font-size: 13px; color: #4a7060; margin: 0 0 14px; }
        .lp-modal-input {
          width: 100%; padding: 10px 14px; border-radius: 8px;
          border: 1px solid #cbd5e1; font-size: 13px;
          margin-bottom: 14px; box-sizing: border-box;
        }
        .lp-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .lp-modal-btn { padding: 8px 18px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px; cursor: pointer; }
        .lp-modal-cancel  { background: #f1f5f9; color: #475569; }
        .lp-modal-primary { background: #4fa39b; color: #fff; }

        @media (max-width: 500px) {
          .lp-card { border-radius: 18px; }
          .lp-body { padding: 20px 18px 18px; }
        }
      `}</style>

      {/* College title above the card */}
      <div className="lp-header">
        <h1>COEP Technological University</h1>
        <p>Shivajinagar, Pune &bull; Estd. 1854</p>
      </div>

      {/* Login card */}
      <div className="lp-card">

        {/* Banner image — clean, no text overlay */}
        <div className="lp-banner">
          <img src={coepppImg} alt="COEP Technological University campus" />
        </div>

        <div className="lp-body">

          {/* STEP 1: Role selection */}
          {selectedRole === null && (
            <>
              {notice && (
                <div className="lp-error">
                  <AlertCircle size={14} />
                  <span>{notice}</span>
                </div>
              )}
              <label className="lp-role-label">Select your role</label>
              <select
                className="lp-role-select"
                value={rolePickerValue}
                onChange={e => setRolePickerValue(e.target.value)}
              >
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              <button className="lp-btn" onClick={handleRoleContinue}>
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>

              <div className="lp-footer">
                <span className="lp-footer-link" onClick={() => alert('COEP Space Allocation & Sound Ordinance Policy 2026')}>
                  Terms &amp; Services
                </span>
                <span>Help: <strong style={{ color: '#8cded2' }}>superadmin@coeptech.ac.in</strong></span>
              </div>
            </>
          )}

          {/* STEP 2: Role-specific login form */}
          {selectedRole !== null && (
            <>
              <div className="lp-form-header">
                <button className="lp-back-btn" onClick={handleBack} title="Change role">
                  <ArrowLeft size={14} />
                </button>
                <p className="lp-form-title">Login</p>
              </div>
              <span className="lp-role-badge">{roleLabel}</span>

              {error && (
                <div className="lp-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* MIS only for students */}
                {selectedRole === 'student' && (
                  <div className="lp-field">
                    <label>COEP MIS Number</label>
                    <input type="text" placeholder="e.g. 112103045"
                      value={mis} onChange={e => setMis(e.target.value)} />
                  </div>
                )}

                <div className="lp-field">
                  <label>COEP Outlook ID{selectedRole === 'student' ? ' (optional if MIS entered)' : ''}</label>
                  <input type="email" required={selectedRole !== 'student'} placeholder="name@coep.ac.in"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="lp-field">
                  <label>Password</label>
                  <input type="password" required placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <div className="lp-pw-hint">
                    <span onClick={() => setForgotModal(true)}>Forgot Password?</span>
                    <span onClick={() => setForgotModal(true)}>Create New Password</span>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="lp-btn">
                  {loading ? 'Authenticating...' : <><span>Login to Portal</span><ArrowRight size={16} /></>}
                </button>
              </form>

              <div className="lp-footer">
                <span className="lp-footer-link" onClick={() => alert('COEP Space Allocation & Sound Ordinance Policy 2026')}>
                  Terms &amp; Services
                </span>
                <span>Help: <strong style={{ color: '#8cded2' }}>superadmin@coeptech.ac.in</strong></span>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Forgot / Create Password Modal */}
      {forgotModal && (
        <div className="lp-modal-bg" onClick={() => setForgotModal(false)}>
          <div className="lp-modal" onClick={e => e.stopPropagation()}>
            <h3>Reset / Create Password</h3>
            {forgotSent ? (
              <>
                <p>Automated reset emails are not enabled yet. Please contact <strong>superadmin@coeptech.ac.in</strong> from <strong>{email || 'your COEP Outlook address'}</strong> to have your password reset.</p>
                <div className="lp-modal-actions">
                  <button className="lp-modal-btn lp-modal-primary"
                    onClick={() => { setForgotModal(false); setForgotSent(false); }}>Done</button>
                </div>
              </>
            ) : (
              <>
                <p>Enter your COEP Outlook ID and we will send a link to reset or create your password.</p>
                <input className="lp-modal-input" type="email" placeholder="username@coep.ac.in"
                  value={email} onChange={e => setEmail(e.target.value)} />
                <div className="lp-modal-actions">
                  <button className="lp-modal-btn lp-modal-cancel" onClick={() => setForgotModal(false)}>Cancel</button>
                  <button className="lp-modal-btn lp-modal-primary" onClick={() => setForgotSent(true)}>Request Reset</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;