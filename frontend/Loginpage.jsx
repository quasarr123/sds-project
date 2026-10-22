import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import coepppImg from './coeppp.jpg';

// ─── Demo presets for quick evaluation ───────────────────────────────────────
const DEMO_PRESETS = [
  { label: 'Student',    name: 'Aarav Deshmukh',            mis: '112103045', role: 'student',    email: 'deshmukha21.comp@coep.ac.in' },
  { label: 'Faculty',    name: 'Dr. Sunita Patil',          mis: 'FAC-9021',  role: 'faculty',    email: 'spatil.comp@coep.ac.in' },
  { label: 'HOD',        name: 'Prof. Dr. Rajesh Kulkarni', mis: 'HOD-4410',  role: 'hod',        email: 'hod.comp@coep.ac.in' },
  { label: 'Superadmin', name: 'Col. Vikram Shinde (Retd.)',mis: 'REG-001',   role: 'superadmin', email: 'registrar@coeptech.ac.in' },
];

function getDepartment(role) {
  if (role === 'student')    return 'Computer Engineering';
  if (role === 'superadmin') return 'Central Estate & Registrar';
  return 'Academic Department';
}

function getDesignation(role) {
  if (role === 'student') return 'B.Tech Student';
  if (role === 'faculty') return 'Faculty Coordinator';
  if (role === 'hod')     return 'Head of Department';
  return 'Superadmin / Registrar';
}

export function LoginPage({ onLoginSuccess }) {
  // Form fields
  const [name,     setName]     = useState('');
  const [mis,      setMis]      = useState('');
  const [role,     setRole]     = useState('student');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // UI state
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotSent,  setForgotSent]  = useState(false);

  // Fill form fields from a demo preset
  function applyPreset(preset) {
    setName(preset.name);
    setMis(preset.mis);
    setRole(preset.role);
    setEmail(preset.email);
    setPassword('coep@2026!');
    setError('');
  }

  // Validate inputs, then simulate SSO login
  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim())  { setError('Please enter your full name.');       return; }
    if (!mis.trim())   { setError('Please enter your COEP MIS Number.'); return; }
    if (!email.trim()) { setError('Please enter your COEP Outlook ID.'); return; }

    const validDomain = email.includes('@coep.ac.in') || email.includes('@coeptech.ac.in');
    if (!validDomain)  { setError('Email must end with @coep.ac.in or @coeptech.ac.in'); return; }

    setLoading(true);

    // Simulate SSO auth — replace with real API call when ready
    setTimeout(() => {
      setLoading(false);
      const user = {
        id:          `u-${mis.replace(/[^a-zA-Z0-9]/g, '')}`,
        name:        name.trim(),
        mis:         mis.trim(),
        role:        role,
        email:       email.trim(),
        department:  getDepartment(role),
        designation: getDesignation(role),
        avatar:      name.trim().split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'CP',
      };
      if (onLoginSuccess) onLoginSuccess(user);
    }, 450);
  }

  return (
    <div className="login-page">
      <style>{`
        /* ── Page background ─────────────────────────────────────── */
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: radial-gradient(circle at 30% 40%, #1e4a3c, #0d221a 70%);
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          box-sizing: border-box;
        }

        /* ── Centered card ───────────────────────────────────────── */
        .login-card {
          width: 100%;
          max-width: 460px;
          background: #1c382e;
          border-radius: 28px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07);
          overflow: hidden;
        }

        /* ── College banner image at top ─────────────────────────── */
        .login-banner {
          position: relative;
          height: 140px;
          overflow: hidden;
        }
        .login-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        /* Dark gradient overlay so text stays readable on any image */
        .login-banner::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(13,34,26,0.85));
        }
        .login-banner-label {
          position: absolute;
          bottom: 14px;
          left: 20px;
          z-index: 1;
          color: #fff;
        }
        .login-banner-label h2 {
          font-size: 14px;
          font-weight: 800;
          margin: 0;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }
        .login-banner-label p {
          font-size: 11px;
          color: #a8d5c8;
          margin: 2px 0 0;
        }

        /* ── Form body ───────────────────────────────────────────── */
        .login-body {
          padding: 28px 30px 24px;
        }
        .login-heading {
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin: 0 0 4px;
        }
        .login-subheading {
          font-size: 13px;
          color: #85b3a6;
          margin: 0 0 20px;
        }

        /* ── Error banner ────────────────────────────────────────── */
        .login-error {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(239,68,68,0.15);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5;
          font-size: 12px;
          padding: 9px 14px;
          border-radius: 10px;
          margin-bottom: 14px;
        }

        /* ── Form fields ─────────────────────────────────────────── */
        .field { margin-bottom: 13px; }
        .field label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #c0d8d0;
          margin-bottom: 6px;
        }
        .field input,
        .field select {
          width: 100%;
          background: #122820;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9999px;
          padding: 10px 16px;
          font-size: 13px;
          color: #fff;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
          cursor: pointer;
        }
        .field input::placeholder { color: #55796c; }
        .field input:focus,
        .field select:focus {
          border-color: #4fa39b;
          box-shadow: 0 0 0 3px rgba(79,163,155,0.22);
          background: #0f2018;
        }
        .field select option { background: #132821; }

        /* Two fields side by side */
        .field-row {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 10px;
          margin-bottom: 13px;
        }

        /* Forgot password link */
        .forgot-link {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #5ea89e;
          margin-top: 5px;
          cursor: pointer;
        }
        .forgot-link:hover { text-decoration: underline; color: #82cbbf; }

        /* ── Submit button ───────────────────────────────────────── */
        .login-btn {
          width: 100%;
          background: #4fa39b;
          color: #fff;
          border: none;
          border-radius: 9999px;
          padding: 12px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          transition: background 0.2s, transform 0.15s;
        }
        .login-btn:hover    { background: #3e8f87; transform: translateY(-1px); }
        .login-btn:active   { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        /* ── Demo preset chips ───────────────────────────────────── */
        .presets {
          margin-top: 16px;
          padding: 10px 14px;
          background: rgba(0,0,0,0.2);
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .presets-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          color: #90b8ac;
          margin-bottom: 8px;
        }
        .presets-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .preset-chip {
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: #dceee8;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .preset-chip:hover { background: #4fa39b; border-color: #4fa39b; color: #fff; }

        /* ── Footer links ────────────────────────────────────────── */
        .login-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid rgba(255,255,255,0.07);
          font-size: 11px;
          color: #6e9386;
        }
        .footer-link { color: #5ea89e; cursor: pointer; }
        .footer-link:hover { text-decoration: underline; }

        /* ── Forgot-password modal ───────────────────────────────── */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 20px;
        }
        .modal-box {
          background: #fff;
          border-radius: 18px;
          padding: 28px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
        }
        .modal-box h3 { font-size: 17px; font-weight: 700; color: #17362a; margin: 0 0 8px; }
        .modal-box p  { font-size: 13px; color: #4a7060; margin: 0 0 14px; }
        .modal-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 13px;
          margin-bottom: 14px;
          box-sizing: border-box;
        }
        .modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .modal-btn { padding: 8px 18px; border-radius: 8px; border: none; font-weight: 600; font-size: 13px; cursor: pointer; }
        .modal-btn-cancel  { background: #f1f5f9; color: #475569; }
        .modal-btn-primary { background: #4fa39b; color: #fff; }

        /* ── Responsive ──────────────────────────────────────────── */
        @media (max-width: 500px) {
          .login-card { border-radius: 20px; }
          .login-body { padding: 22px 20px 20px; }
          .field-row  { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Card */}
      <div className="login-card">

        {/* College banner */}
        <div className="login-banner">
          <img src={coepppImg} alt="COEP Technological University" />
          <div className="login-banner-label">
            <h2>COEP Technological University</h2>
            <p>Shivajinagar, Pune • Estd. 1854</p>
          </div>
        </div>

        {/* Form */}
        <div className="login-body">
          <p className="login-heading">Login</p>
          <p className="login-subheading">Enter your institutional credentials to access the portal</p>

          {/* Error message */}
          {error && (
            <div className="login-error">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Full Name */}
            <div className="field">
              <label>Full Name</label>
              <input
                type="text"
                required
                placeholder="Enter your full name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            {/* MIS Number + Role — side by side */}
            <div className="field-row">
              <div className="field" style={{ margin: 0 }}>
                <label>COEP MIS Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 112103045"
                  value={mis}
                  onChange={e => setMis(e.target.value)}
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Role</label>
                <select value={role} onChange={e => setRole(e.target.value)}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">HOD</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>

            {/* COEP Email */}
            <div className="field">
              <label>COEP Outlook ID</label>
              <input
                type="email"
                required
                placeholder="name@coep.ac.in"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <span className="forgot-link" onClick={() => setForgotModal(true)}>
                Forgot Password?
              </span>
            </div>

            {/* Login button */}
            <button type="submit" disabled={loading} className="login-btn">
              {loading
                ? 'Authenticating...'
                : <><span>Login to Portal</span><ArrowRight size={16} /></>
              }
            </button>

            {/* Demo preset chips */}
            <div className="presets">
              <div className="presets-label">
                <Sparkles size={12} color="#f59e0b" />
                <span>Quick demo credentials:</span>
              </div>
              <div className="presets-chips">
                {DEMO_PRESETS.map(preset => (
                  <button
                    key={preset.role}
                    type="button"
                    className="preset-chip"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <span
              className="footer-link"
              onClick={() => alert('COEP Technological University Space Allocation & Sound Ordinance Policy 2026')}
            >
              Terms & Services
            </span>
            <span>Help: <strong style={{ color: '#8cded2' }}>NOC@coep.ac.in</strong></span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="modal-backdrop" onClick={() => setForgotModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3>Reset Password</h3>

            {forgotSent ? (
              <>
                <p>
                  A reset link has been sent to <strong>{email || 'your COEP Outlook address'}</strong>.
                  Check your inbox.
                </p>
                <div className="modal-actions">
                  <button
                    className="modal-btn modal-btn-primary"
                    onClick={() => { setForgotModal(false); setForgotSent(false); }}
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>Enter your COEP Outlook ID and we'll send a reset link.</p>
                <input
                  className="modal-input"
                  type="email"
                  placeholder="username@coep.ac.in"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <div className="modal-actions">
                  <button className="modal-btn modal-btn-cancel" onClick={() => setForgotModal(false)}>
                    Cancel
                  </button>
                  <button className="modal-btn modal-btn-primary" onClick={() => setForgotSent(true)}>
                    Send Link
                  </button>
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
