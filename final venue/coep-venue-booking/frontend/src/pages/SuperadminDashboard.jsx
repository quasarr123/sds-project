import React from 'react';
import {
  Building2,
  CalendarDays,
  Clock,
  ShieldAlert,
  Sliders,
  FileText,
  CalendarOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';

export function SuperadminDashboard({
  currentUser,
  bookings = [],
  venues = [],
  holidays = [],
  auditLogs = [],
  onNavigate,
}) {
  const pendingSuperadmin = bookings.filter((b) => b.status === 'Pending Superadmin');
  const allPending = bookings.filter((b) => b.status.startsWith('Pending'));
  const approvedTotal = bookings.filter((b) => b.status === 'Approved');
  const underMaintenanceVenues = venues.filter((v) => v.status === 'Under Maintenance');

  return (
    <div>
      {/* Title & Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'var(--danger-bg)',
                color: 'var(--danger-solid)',
                border: '1px solid var(--danger-border)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Central Estate & Registrar Console
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            Superadmin Command Center: {currentUser?.name}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            MIS: <strong>{currentUser?.mis || 'REG-001'}</strong> • Outlook: <strong>{currentUser?.email}</strong> • Central Estate & Registrar
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            icon={CalendarDays}
            onClick={() => onNavigate('all-bookings')}
          >
            Review All Bookings Master
          </Button>
          <Button
            variant="secondary"
            icon={Sliders}
            onClick={() => onNavigate('settings')}
          >
            Booking Settings
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Pending Final Clearance
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--danger-solid)', marginTop: '4px' }}>
              {pendingSuperadmin.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Total pipeline: {allPending.length} requests
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--danger-solid)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Approved Reservations
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-solid)', marginTop: '4px' }}>
              {approvedTotal.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Active events cleared
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-solid)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Campus Venues
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-navy-900)', marginTop: '4px' }}>
              {venues.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {underMaintenanceVenues.length} under maintenance
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--bg-app)', color: 'var(--coep-navy-900)' }}>
            <Building2 size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Active Lockout Windows
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-gold-600)', marginTop: '4px' }}>
              {holidays.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Exam & convocation blocks
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--coep-gold-600)' }}>
            <CalendarOff size={24} />
          </div>
        </div>
      </div>

      {/* Quick Access Control Grid */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)', marginBottom: '14px' }}>
          Administrative Modules
        </h3>
        <div className="grid-cols-4">
          <div
            onClick={() => onNavigate('all-bookings')}
            style={{
              padding: '18px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ color: 'var(--coep-maroon-700)', marginBottom: '10px' }}>
              <CalendarDays size={26} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              All Bookings Master
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Global reservation registry with cancellation reasoning and status overrides.
            </p>
          </div>

          <div
            onClick={() => onNavigate('holidays')}
            style={{
              padding: '18px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ color: 'var(--warning-solid)', marginBottom: '10px' }}>
              <CalendarOff size={26} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Holidays & Blocked Dates
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Lockout exam schedules, Diwali breaks, and VIP convocation restrictions.
            </p>
          </div>

          <div
            onClick={() => onNavigate('settings')}
            style={{
              padding: '18px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ color: 'var(--info-solid)', marginBottom: '10px' }}>
              <Sliders size={26} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Booking Settings
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Configure lead time, advance windows, working hours, and sound guidelines.
            </p>
          </div>

          <div
            onClick={() => onNavigate('audit-logs')}
            style={{
              padding: '18px',
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ color: 'var(--purple-solid)', marginBottom: '10px' }}>
              <FileText size={26} />
            </div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Audit Logs & Security
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Track tamper-evident IP signatures, role actions, and admin overrides.
            </p>
          </div>
        </div>
      </div>

      {/* Immediate Attention: Superadmin Pending Approvals */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Final Clearance Queue (Pending Registrar Approval)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              These events have cleared Faculty & HOD vetting and require final estate office sound & gate authorization.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('all-bookings')}
          >
            Open All Bookings Master
          </Button>
        </div>

        <Table
          columns={[
            {
              title: 'Request ID & Title',
              key: 'title',
              render: (val, row) => (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {row.id} • {row.bookedBy} ({row.department})
                  </div>
                </div>
              ),
            },
            { title: 'Venue', key: 'venueName' },
            { title: 'Date & Slot', key: 'date', render: (val, row) => `${val} (${row.timeSlot})` },
            { title: 'Attendees', key: 'attendees' },
            {
              title: 'Current Status',
              key: 'status',
              render: (val) => <StatusBadge status={val} />,
            },
            {
              title: 'Action',
              key: 'action',
              render: (_, row) => (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onNavigate('all-bookings')}
                >
                  Manage in All-Bookings
                </Button>
              ),
            },
          ]}
          data={pendingSuperadmin}
          emptyTitle="No Requests Awaiting Final Clearance"
          emptyMessage="All pending requests have been approved or rejected."
        />
      </div>
    </div>
  );
}

export default SuperadminDashboard;
