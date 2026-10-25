import React, { useState } from 'react';
import {
  CalendarOff,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea, Toggle } from '../components/common/FormControls';
import { StatusBadge } from '../components/common/StatusBadge';
import { VENUES } from '../data/mockData';

export function HolidayManagementPage({
  holidays = [],
  venues = VENUES,
  onAddHoliday,
  onRemoveHoliday,
  currentUser,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('Official University Holiday');
  const [affectedVenues, setAffectedVenues] = useState('All Venues');
  const [reason, setReason] = useState('');
  const [isStrictBlock, setIsStrictBlock] = useState(true);
  const [formError, setFormError] = useState('');

  function handleCreateBlockedDate(e) {
    e.preventDefault();
    setFormError('');

    if (!title || !startDate || !endDate || !reason) {
      setFormError('Please enter title, start date, end date, and justification.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot occur after end date.');
      return;
    }

    const newHol = {
      id: `hol-${Date.now()}`,
      title,
      startDate,
      endDate,
      type,
      reason,
      affectedVenues,
      isStrictBlock,
      createdBy: currentUser?.name || 'Registrar Office',
    };

    onAddHoliday(newHol);
    setModalOpen(false);
    // Reset
    setTitle('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setFormError('');
  }

  const columns = [
    {
      title: 'Lockout Title & Type',
      key: 'title',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--coep-maroon-700)', fontWeight: 600 }}>
            {row.type}
          </div>
        </div>
      ),
    },
    {
      title: 'Date Range Window',
      key: 'startDate',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} color="var(--coep-maroon-700)" />
          <span style={{ fontWeight: 600 }}>
            {row.startDate} <span style={{ color: 'var(--text-tertiary)' }}>to</span> {row.endDate}
          </span>
        </div>
      ),
    },
    {
      title: 'Affected Venues',
      key: 'affectedVenues',
      render: (val) => (
        <span
          style={{
            fontSize: '12px',
            backgroundColor: val === 'All Venues' ? 'var(--danger-bg)' : 'var(--bg-app)',
            color: val === 'All Venues' ? 'var(--danger-text)' : 'var(--text-primary)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 600,
          }}
        >
          {val}
        </span>
      ),
    },
    {
      title: 'Lockout Severity',
      key: 'isStrictBlock',
      render: (val) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            fontWeight: 700,
            color: val ? 'var(--danger-solid)' : 'var(--warning-solid)',
          }}
        >
          <Lock size={13} />
          {val ? 'Strict Blackout' : 'Advisory Only'}
        </span>
      ),
    },
    {
      title: 'Justification',
      key: 'reason',
      render: (val) => (
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{val}</span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (confirm(`Remove blocked-date window for "${row.title}"?`)) {
              onRemoveHoliday(row.id);
            }
          }}
          title="Release Date Lockout"
        >
          <Trash2 size={14} />
          <span>Unlock</span>
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'var(--warning-bg)',
                color: 'var(--warning-solid)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Academic Calendar & Facility Locks
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            Holiday & Blocked-Date Management
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Designate institutional closures, semester examination quiet periods, and VIP event lockdowns.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add Blocked-Date Window
        </Button>
      </div>

      {/* Info Warning Card */}
      <div
        style={{
          backgroundColor: 'var(--warning-bg)',
          border: '1px solid var(--warning-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <AlertTriangle size={24} color="var(--warning-solid)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: 'var(--warning-text)', lineHeight: 1.5 }}>
          <strong>Lockout Policy Enforcement:</strong> When a date range is marked as a <em>Strict Blackout</em>,
          the system automatically rejects student and faculty reservation requests for affected venues during those dates.
        </div>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={holidays}
        searchKeys={['title', 'type', 'affectedVenues', 'reason']}
        searchPlaceholder="Search holidays or lockouts..."
        emptyTitle="No Blocked Dates Configured"
        emptyMessage="Click 'Add Blocked-Date Window' to schedule university holidays or examination lockdowns."
      />

      {/* Add Blocked Date Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Institutional Lockout / Holiday"
        size="md"
      >
        <form onSubmit={handleCreateBlockedDate}>
          {formError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', fontSize: '13px', marginBottom: '14px' }}>
              ⚠️ {formError}
            </div>
          )}

          <Input
            label="Lockout Title / Occasion"
            required
            placeholder="e.g. Winter 2026 End-Semester Examinations"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid-cols-2">
            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="grid-cols-2">
            <Select
              label="Lockout Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                'Official University Holiday',
                'Exam Lockout Window',
                'Administrative Lockdown',
                'Facility Maintenance Window',
              ]}
            />

            <Select
              label="Affected Venues"
              value={affectedVenues}
              onChange={(e) => setAffectedVenues(e.target.value)}
              options={[
                'All Venues',
                'Main Auditorium Only',
                'Boat Club Lawn & Deck Only',
                'All Seminar Halls',
                'Mechanical Seminar Hall',
                'Turing Computer Seminar Hall',
              ]}
            />
          </div>

          <Textarea
            label="Official Justification / Dean Directive"
            required
            rows={3}
            placeholder="State the institutional reason (e.g. Maharashtra State Holiday, Strict academic silence for semester finals)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />

          <div style={{ marginTop: '10px' }}>
            <Toggle
              label="Strict Blackout (Enforce automated reservation rejection)"
              checked={isStrictBlock}
              onChange={setIsStrictBlock}
              description="If enabled, students and faculty will not be permitted to pick these dates."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Lockout Window
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default HolidayManagementPage;
