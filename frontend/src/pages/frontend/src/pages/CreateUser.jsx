import React, { useState, useEffect } from 'react';
import { api } from '../services/client';

// Render this page only for a verified Superadmin.
// The backend must also enforce Superadmin authorization.
export default function CreateUser({ onCancel, onCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.departments().then(setDepartments).catch(() => setError('Could not load departments.'));
  }, []);
  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const numericDepartmentId = Number(departmentId);

    if (!cleanName || !cleanEmail || !password || !departmentId) {
      setError('Please complete all fields.');
      return;
    }
    if (!cleanEmail.endsWith('@coep.ac.in') && !cleanEmail.endsWith('@coeptech.ac.in')) {
      setError('Use a COEP email address ending in @coep.ac.in or @coeptech.ac.in.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!Number.isInteger(numericDepartmentId) || numericDepartmentId <= 0) {
      setError('Enter a valid department ID from the departments table.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createUser({
        name: cleanName,
        email: cleanEmail,
        password,
        role: 'hod',
        departmentId: numericDepartmentId,
        designation: 'Head of Department',
      });
      setSuccess(result?.message || 'HOD account created successfully.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setDepartmentId('');
      if (onCreated) onCreated(result);
    } catch (err) {
      setError(err?.message || 'Could not create the HOD account.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '11px 12px',
    border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14,
    background: '#fff', color: '#0f172a',
  };
  const labelStyle = {
    display: 'block', fontSize: 13, fontWeight: 600,
    color: '#334155', marginBottom: 6,
  };

  return (
    <main style={{
      minHeight: '100%', padding: 24, background: '#f8fafc', color: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      <section style={{
        maxWidth: 620, margin: '0 auto', background: '#fff',
        border: '1px solid #e2e8f0', borderRadius: 16, padding: 24,
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
      }}>
        <div style={{ marginBottom: 22 }}>
          <p style={{
            margin: '0 0 6px', color: '#0f766e', fontSize: 12,
            fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
          }}>Superadmin · User Management</p>
          <h1 style={{ margin: '0 0 8px', fontSize: 25, lineHeight: 1.25 }}>
            Create HOD Account
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: 14, lineHeight: 1.5 }}>
            Create a Head of Department account and assign it to the correct department.
            Students and faculty register themselves from the public registration page.
          </p>
        </div>

        {error && <div role="alert" style={{
          marginBottom: 16, padding: 12, borderRadius: 8, color: '#991b1b',
          background: '#fef2f2', border: '1px solid #fecaca', fontSize: 14,
        }}>{error}</div>}
        {success && <div role="status" style={{
          marginBottom: 16, padding: 12, borderRadius: 8, color: '#166534',
          background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 14,
        }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="hod-name" style={labelStyle}>Full name</label>
            <input id="hod-name" style={inputStyle} value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Prof. Rajesh Kulkarni" autoComplete="name" required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="hod-email" style={labelStyle}>COEP email address</label>
            <input id="hod-email" type="email" style={inputStyle} value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="hod.department@coep.ac.in" autoComplete="email" required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="hod-department" style={labelStyle}>Department ID</label>
            <input id="hod-department" type="number" min="1" step="1"
              style={inputStyle} value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              placeholder="Enter an existing departments.id" required />
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
              Find the correct ID in MySQL:
              <code style={{ display: 'block', marginTop: 4 }}>
                SELECT id, name FROM departments ORDER BY id;
              </code>
            </p>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label htmlFor="hod-password" style={labelStyle}>Temporary password</label>
            <input id="hod-password" type="password" style={inputStyle}
              value={password} onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password" minLength={8} required />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label htmlFor="hod-confirm-password" style={labelStyle}>Confirm password</label>
            <input id="hod-confirm-password" type="password" style={inputStyle}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password" minLength={8} required />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            {onCancel && <button type="button" onClick={onCancel} disabled={loading}
              style={{
                padding: '11px 16px', borderRadius: 8, border: '1px solid #cbd5e1',
                background: '#fff', color: '#334155', fontWeight: 600, cursor: 'pointer',
              }}>Cancel</button>}
            <button type="submit" disabled={loading} style={{
              padding: '11px 18px', borderRadius: 8, border: 0,
              background: loading ? '#64748b' : '#0f766e', color: '#fff',
              fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            }}>{loading ? 'Creating account…' : 'Create HOD Account'}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
