import React, { useEffect, useState } from 'react';
import { Plus, Pencil, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select } from '../components/common/FormControls';
import { api } from '../services/client';

const ROLES = ['student', 'faculty', 'hod', 'superadmin'];
const CATEGORIES = [
  { value: 'department', label: 'Department venue (HOD approves student requests)' },
  { value: 'central', label: 'Central venue: auditorium / academic complex (Superadmin approves)' },
  { value: 'club', label: 'Club venue (Faculty Advisor, then Superadmin)' },
];
const VENUE_STATUSES = ['Available', 'Under Maintenance'];

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div style={{ backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
      <AlertCircle size={16} /> <span>{message}</span>
    </div>
  );
}

export function ManagementPage({ venues = [], clubs = [], onChanged }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null); // { kind, row }
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadUsers() {
    try {
      const [u, d] = await Promise.all([api.adminUsers(), api.departments()]);
      setUsers(u);
      setDepartments(d);
    } catch (e) {
      setLoadError(e.message);
    }
  }
  useEffect(() => { loadUsers(); }, []);

  const faculty = users.filter((u) => u.role === 'faculty' && u.isActive);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function open(kind, row) {
    setError('');
    setModal({ kind, row });
    if (kind === 'user') {
      setForm(row
        ? { name: row.name, email: row.email, role: row.role, departmentId: row.departmentId ?? '', designation: row.designation, isActive: row.isActive ? 'yes' : 'no', password: '' }
        : { name: '', email: '', misNumber: '', role: 'student', departmentId: '', designation: '', password: '' });
    } else if (kind === 'venue') {
      setForm(row
        ? { name: row.name, location: row.location, capacity: row.capacity, type: row.type, department: row.department, category: row.category || 'department', status: row.status }
        : { name: '', location: '', capacity: '', type: 'Seminar Hall', department: departments[0]?.name || '', category: 'department', status: 'Available' });
    } else {
      setForm(row ? { name: row.name, advisorId: row.advisorId ?? '' } : { name: '', advisorId: '' });
    }
  }

  async function save(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const { kind, row } = modal;
    try {
      if (kind === 'user') {
        const body = {
          name: form.name, role: form.role, designation: form.designation || null,
          departmentId: form.departmentId === '' ? null : Number(form.departmentId),
        };
        if (row) {
          body.isActive = form.isActive === 'yes';
          if (form.password) body.password = form.password;
          await api.updateUser(row.id, body);
        } else {
          await api.createUser({ ...body, email: form.email, misNumber: form.misNumber || null, password: form.password || undefined });
        }
        await loadUsers();
      } else if (kind === 'venue') {
        const body = { name: form.name, location: form.location, capacity: Number(form.capacity), type: form.type,
          department: form.department, category: form.category, status: form.status };
        row ? await api.updateVenue(row.id, body) : await api.createVenue(body);
      } else {
        const body = { name: form.name, advisorId: form.advisorId === '' ? null : Number(form.advisorId) };
        row ? await api.updateClub(row.id, body) : await api.createClub(body);
      }
      setModal(null);
      onChanged && onChanged();
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  const editBtn = (kind) => (_, row) => (
    <Button variant="secondary" size="sm" icon={Pencil} onClick={() => open(kind, row)}>Edit</Button>
  );

  const userCols = [
    { title: 'Name', key: 'name', sortable: true, render: (v, r) => (<div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.email}</div></div>) },
    { title: 'Role', key: 'role', sortable: true },
    { title: 'Department', key: 'department', sortable: true },
    { title: 'Active', key: 'isActive', render: (v) => (v ? 'Yes' : 'No') },
    { title: '', key: 'a', render: editBtn('user') },
  ];
  const venueCols = [
    { title: 'Venue', key: 'name', sortable: true, render: (v, r) => (<div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{r.location}</div></div>) },
    { title: 'Department', key: 'department' },
    { title: 'Category', key: 'category', render: (v) => CATEGORIES.find((c) => c.value === v)?.label.split(' (')[0] || v },
    { title: 'Capacity', key: 'capacity' },
    { title: 'Status', key: 'status' },
    { title: '', key: 'a', render: editBtn('venue') },
  ];
  const clubCols = [
    { title: 'Club', key: 'name', sortable: true },
    { title: 'Faculty Advisor', key: 'advisorName', render: (v) => v || '— none assigned —' },
    { title: '', key: 'a', render: editBtn('club') },
  ];

  const tabs = [['users', 'Users'], ['venues', 'Venues'], ['clubs', 'Clubs']];
  const addLabel = { users: 'Add user', venues: 'Add venue', clubs: 'Add club' }[tab];
  const addKind = { users: 'user', venues: 'venue', clubs: 'club' }[tab];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>Users, Venues & Clubs</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Only the Superadmin can manage these. A venue's category decides who approves student bookings.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => open(addKind)}>{addLabel}</Button>
      </div>

      <ErrorBox message={loadError} />

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {tabs.map(([id, label]) => (
          <Button key={id} variant={tab === id ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(id)}>{label}</Button>
        ))}
      </div>

      {tab === 'users' && <Table columns={userCols} data={users} searchKeys={['name', 'email', 'role', 'department']} searchPlaceholder="Search users..." />}
      {tab === 'venues' && <Table columns={venueCols} data={venues} searchKeys={['name', 'location', 'department']} searchPlaceholder="Search venues..." />}
      {tab === 'clubs' && <Table columns={clubCols} data={clubs} searchKeys={['name', 'advisorName']} searchPlaceholder="Search clubs..." />}

      {modal && (
        <Modal isOpen onClose={() => setModal(null)} size="md"
          title={`${modal.row ? 'Edit' : 'Add'} ${modal.kind}`}>
          <form onSubmit={save}>
            <ErrorBox message={error} />
            {modal.kind === 'user' && (
              <>
                <Input label="Full name" required value={form.name} onChange={set('name')} />
                <Input label="Email" type="email" required disabled={!!modal.row} value={form.email} onChange={set('email')} />
                {!modal.row && <Input label="MIS number (students)" value={form.misNumber} onChange={set('misNumber')} />}
                <div className="grid-cols-2">
                  <Select label="Role" required value={form.role} onChange={set('role')} options={ROLES} />
                  <Select label="Department" value={form.departmentId} onChange={set('departmentId')} placeholder="None"
                    options={departments.map((d) => ({ value: d.id, label: d.name }))} />
                </div>
                <Input label="Designation" value={form.designation} onChange={set('designation')} />
                {modal.row && <Select label="Account active" value={form.isActive} onChange={set('isActive')} options={[{ value: 'yes', label: 'Active' }, { value: 'no', label: 'Deactivated (cannot sign in)' }]} />}
                <Input label={modal.row ? 'Reset password (leave blank to keep)' : 'Password (blank = demo password)'} type="password" value={form.password} onChange={set('password')} />
              </>
            )}
            {modal.kind === 'venue' && (
              <>
                <Input label="Venue name" required value={form.name} onChange={set('name')} />
                <Input label="Location" required value={form.location} onChange={set('location')} />
                <div className="grid-cols-2">
                  <Input label="Capacity" type="number" required value={form.capacity} onChange={set('capacity')} />
                  <Input label="Type" required value={form.type} onChange={set('type')} />
                </div>
                <Select label="Owning department" required value={form.department} onChange={set('department')}
                  options={[...departments.map((d) => d.name), 'Central Administration', 'Gymkhana & Sports Committee', 'Gymkhana Cultural Wing']
                    .filter((v, i, a) => a.indexOf(v) === i)} />
                <Select label="Category" required value={form.category} onChange={set('category')} options={CATEGORIES} />
                <Select label="Status" value={form.status} onChange={set('status')} options={VENUE_STATUSES} />
              </>
            )}
            {modal.kind === 'club' && (
              <>
                <Input label="Club name" required value={form.name} onChange={set('name')} />
                <Select label="Faculty advisor" value={form.advisorId} onChange={set('advisorId')} placeholder="No advisor"
                  options={faculty.map((u) => ({ value: u.id, label: `${u.name} (${u.department})` }))} />
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button variant="primary" type="submit" loading={saving}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ManagementPage;
