import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Filter,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
  Mail,
  Download,
  Eye,
  Search,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Select, Textarea, Input } from '../components/common/FormControls';

export function AllBookingsPage({
  bookings = [],
  venues = [],
  onUpdateBookingStatus,
  onCancelBooking,
  currentUser,
}) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [venueFilter, setVenueFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState(false);

  const [detailModalBooking, setDetailModalBooking] = useState(null);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        if (statusFilter === 'PENDING' && !b.status.startsWith('Pending')) return false;
        if (statusFilter !== 'PENDING') return false;
      }
      if (venueFilter !== 'ALL' && b.venueId !== venueFilter) return false;
      if (roleFilter !== 'ALL' && b.role !== roleFilter) return false;
      return true;
    });
  }, [bookings, statusFilter, venueFilter, roleFilter]);

  // Handle Superadmin Cancellation with Mandatory Reason
  function handleExecuteCancellation(e) {
    e.preventDefault();
    setCancelError('');

    if (!cancelReason.trim()) {
      setCancelError('Institutional policy requires a mandatory cancellation explanation to notify student/faculty organizers.');
      return;
    }

    if (cancelReason.trim().length < 15) {
      setCancelError('Please provide a substantive reason (at least 15 characters) for official estate records.');
      return;
    }

    onCancelBooking(cancelModalBooking.id, cancelReason.trim(), {
      cancelledBy: currentUser?.name || 'Superadmin / Registrar',
      cancelledAt: new Date().toLocaleString(),
    });

    setCancelSuccessMsg(true);
    setTimeout(() => {
      setCancelSuccessMsg(false);
      setCancelModalBooking(null);
      setCancelReason('');
    }, 1500);
  }

  function handleQuickApprove(booking) {
    onUpdateBookingStatus(booking.id, 'Approved', {
      approvedBy: `Col. Vikram Shinde (Superadmin Clearance)`,
      stage: 'Completed Approval',
    });
  }

  const columns = [
    {
      title: 'Booking ID & Title',
      key: 'title',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.id} • <strong>{row.bookedBy}</strong> ({row.role})
          </div>
        </div>
      ),
    },
    {
      title: 'Reserved Venue',
      key: 'venueName',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: 'var(--coep-maroon-700)' }}>{row.venueName}</span>
      ),
    },
    {
      title: 'Date & Schedule',
      key: 'date',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.date}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{row.timeSlot}</div>
        </div>
      ),
    },
    {
      title: 'Footfall',
      key: 'attendees',
      render: (val) => <span>{val} people</span>,
    },
    {
      title: 'Status',
      key: 'status',
      sortable: true,
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Administrative Actions',
      key: 'actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDetailModalBooking(row)}
            title="Inspect Full Booking Details"
          >
            <Eye size={14} />
          </Button>

          {(row.status === 'Pending HOD' || row.status === 'Pending Superadmin') && (
            <Button
              variant="success"
              size="sm"
              onClick={() => handleQuickApprove(row)}
              title="Grant Final Approval"
            >
              <CheckCircle2 size={14} />
            </Button>
          )}

          {row.status !== 'Cancelled' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setCancelModalBooking(row);
                setCancelReason('');
                setCancelError('');
              }}
              title="Cancel Booking with Mandatory Reason"
            >
              <Ban size={14} />
              <span>Cancel</span>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Page Title & Controls */}
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
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            Superadmin: All Bookings Master Registry
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Institutional master register covering student clubs, departmental symposia, and university ceremonies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={() => alert('Exporting all bookings to COEP CSV Audit format...')}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
          <Filter size={15} />
          <span>Filter Records:</span>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="coep-select"
          style={{ width: '170px', padding: '6px 12px', fontSize: '13px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">All Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="coep-select"
          style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
        >
          <option value="ALL">All Venues</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="coep-select"
          style={{ width: '160px', padding: '6px 12px', fontSize: '13px' }}
        >
          <option value="ALL">All User Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Found <strong>{filteredBookings.length}</strong> bookings
        </span>
      </div>

      {/* Master Table */}
      <Table
        columns={columns}
        data={filteredBookings}
        searchKeys={['title', 'bookedBy', 'venueName', 'id', 'department']}
        searchPlaceholder="Search all bookings by title, requester, or venue..."
        emptyTitle="No Bookings Match Filter"
        emptyMessage="Try selecting a different status or venue filter above."
      />

      {/* Mandatory Cancellation Modal */}
      {cancelModalBooking && (
        <Modal
          isOpen={Boolean(cancelModalBooking)}
          onClose={() => !cancelSuccessMsg && setCancelModalBooking(null)}
          title={`Administrative Cancellation: ${cancelModalBooking.id}`}
          size="md"
        >
          {cancelSuccessMsg ? (
            <div style={{ textAlign: 'center', padding: '24px 12px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger-solid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Ban size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
                Booking Successfully Cancelled
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Revocation dispatch sent to <strong>{cancelModalBooking.bookedBy}</strong> and COEP Security.
              </p>
            </div>
          ) : (
            <form onSubmit={handleExecuteCancellation}>
              <div
                style={{
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <AlertTriangle size={20} color="var(--danger-solid)" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '13px', color: 'var(--danger-text)' }}>
                  <strong>Warning:</strong> You are about to cancel an active campus reservation for{' '}
                  <strong>{cancelModalBooking.venueName}</strong> scheduled for{' '}
                  <strong>{cancelModalBooking.date} ({cancelModalBooking.timeSlot})</strong>.
                  This will immediately invalidate all gate security passes.
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '13px' }}>
                <div><strong>Event:</strong> {cancelModalBooking.title}</div>
                <div><strong>Applicant:</strong> {cancelModalBooking.bookedBy} ({cancelModalBooking.department})</div>
              </div>

              {cancelError && (
                <div style={{ color: 'var(--danger-solid)', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>
                  ⚠️ {cancelError}
                </div>
              )}

              <Textarea
                label="Mandatory Reason for Cancellation"
                required
                rows={4}
                placeholder="State the official reason (e.g., Urgent HVAC maintenance in Main Hall, Academic lockdown for VIP Convocation, Security advisory from District Collectorate)..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                hint="This explanation is permanently archived in the Audit Log and emailed to all stakeholders."
              />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '12px',
                  color: 'var(--text-tertiary)',
                  marginTop: '12px',
                }}
              >
                <Mail size={14} />
                <span>Automated university email notification will be dispatched immediately.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <Button
                  variant="secondary"
                  onClick={() => setCancelModalBooking(null)}
                >
                  Keep Reservation
                </Button>
                <Button
                  variant="danger"
                  type="submit"
                  icon={Ban}
                >
                  Confirm & Cancel Booking
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Inspect Detail Modal */}
      {detailModalBooking && (
        <Modal
          isOpen={Boolean(detailModalBooking)}
          onClose={() => setDetailModalBooking(null)}
          title={`Booking File: ${detailModalBooking.id}`}
          size="lg"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
                  {detailModalBooking.title}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
                  Organized by: {detailModalBooking.bookedBy} • {detailModalBooking.club || detailModalBooking.department}
                </div>
              </div>
              <StatusBadge status={detailModalBooking.status} />
            </div>

            <div className="grid-cols-2" style={{ gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Venue & Schedule
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--coep-navy-900)', marginTop: '4px' }}>
                  📍 {detailModalBooking.venueName}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  🗓️ {detailModalBooking.date}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  ⏰ {detailModalBooking.timeSlot}
                </div>
              </div>

              <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Applicant Details
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--coep-navy-900)', marginTop: '4px' }}>
                  👤 {detailModalBooking.bookedBy} ({detailModalBooking.role})
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  🏢 {detailModalBooking.department}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  👥 Expected: {detailModalBooking.attendees} attendees
                </div>
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                Event Purpose & Sound / AV Specifications
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {detailModalBooking.purpose}
              </p>
            </div>

            {detailModalBooking.cancellationReason && (
              <div style={{ padding: '14px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--danger-text)', textTransform: 'uppercase' }}>
                  Official Cancellation Record
                </div>
                <p style={{ fontSize: '13px', color: 'var(--danger-text)', marginTop: '4px' }}>
                  {detailModalBooking.cancellationReason}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setDetailModalBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AllBookingsPage;
