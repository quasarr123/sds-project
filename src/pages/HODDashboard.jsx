import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  Users,
  Search,
  Filter,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Textarea } from '../components/common/FormControls';
import { VENUES } from '../data/mockData';

export function HODDashboard({
  currentUser,
  bookings = [],
  venues = VENUES,
  onUpdateBookingStatus,
}) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [hodNotes, setHodNotes] = useState('');
  const [filterDept, setFilterDept] = useState(currentUser.department || 'Computer Engineering');

  // Bookings requiring HOD clearance
  const pendingHODBookings = bookings.filter((b) => b.status === 'Pending HOD');
  const allDeptBookings = bookings.filter((b) => b.department === filterDept || b.venueName.includes('Computer'));

  function handleDecision(booking, approved) {
    if (approved) {
      onUpdateBookingStatus(booking.id, 'Pending Superadmin', {
        approvedBy: `HOD Endorsed: ${currentUser.name} (${currentUser.department})`,
        stage: 'Level 3: Central Estate Superadmin',
        hodNotes: hodNotes || 'Academic schedule cleared with zero lecture conflicts.',
      });
    } else {
      onUpdateBookingStatus(booking.id, 'Rejected', {
        rejectionReason: hodNotes || 'Disallowed due to departmental academic schedule conflicts or timetable clashes.',
        approvedBy: `Rejected by HOD ${currentUser.name}`,
        stage: 'Rejected by Department Head',
      });
    }
    setSelectedBooking(null);
    setHodNotes('');
  }

  const columns = [
    {
      title: 'Event & Request ID',
      key: 'title',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.id} • Initiated by: <strong>{row.bookedBy}</strong> ({row.role})
          </div>
        </div>
      ),
    },
    {
      title: 'Target Venue',
      key: 'venueName',
      sortable: true,
      render: (val, row) => (
        <span style={{ fontWeight: 600, color: 'var(--coep-maroon-700)' }}>{row.venueName}</span>
      ),
    },
    {
      title: 'Requested Schedule',
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
      title: 'Prior Endorsement',
      key: 'endorsement',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{val || 'Standard departmental request'}"
        </span>
      ),
    },
    {
      title: 'Decision',
      key: 'actions',
      render: (_, row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setSelectedBooking(row);
            setHodNotes('');
          }}
        >
          Review & Authorize
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
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            HOD Administration Console: {currentUser?.name}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            MIS: <strong>{currentUser?.mis || 'HOD-4410'}</strong> • Outlook: <strong>{currentUser?.email}</strong> • {currentUser?.department || 'Computer Engineering'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--purple-bg)',
              color: 'var(--purple-text)',
              border: '1px solid var(--purple-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            Level 2 Institutional Authority
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Pending HOD Review
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning-solid)', marginTop: '4px' }}>
              {pendingHODBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Awaiting your decision</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Department Bookings
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info-solid)', marginTop: '4px' }}>
              {allDeptBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>This semester</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info-solid)' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Schedule Clashes
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-solid)', marginTop: '4px' }}>
              0
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Timetable synchronized</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-solid)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Department Facilities
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-maroon-700)', marginTop: '4px' }}>
              3
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Halls & Computing labs</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--coep-maroon-700)' }}>
            <Building size={24} />
          </div>
        </div>
      </div>

      {/* Main Approval Table */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Departmental Clearance Queue (Awaiting HOD Signature)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Events endorsed by faculty or scheduled for department seminar complexes.
            </p>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--coep-maroon-700)' }}>
            {pendingHODBookings.length} requests in queue
          </span>
        </div>

        <Table
          columns={columns}
          data={pendingHODBookings}
          searchKeys={['title', 'bookedBy', 'venueName', 'id']}
          searchPlaceholder="Search HOD review queue..."
          emptyTitle="HOD Clearance Queue is Empty"
          emptyMessage="No venue reservations are currently pending departmental clearance."
        />
      </div>

      {/* Department Reservation Registry */}
      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--coep-navy-900)', marginBottom: '12px' }}>
          Recent Bookings for {filterDept}
        </h3>
        <Table
          columns={[
            {
              title: 'Event Title',
              key: 'title',
              render: (val, row) => (
                <div>
                  <div style={{ fontWeight: 700 }}>{row.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{row.id} • {row.bookedBy}</div>
                </div>
              ),
            },
            { title: 'Venue', key: 'venueName' },
            { title: 'Date & Slot', key: 'date', render: (val, row) => `${val} (${row.timeSlot})` },
            { title: 'Attendees', key: 'attendees' },
            {
              title: 'Status',
              key: 'status',
              render: (val) => <StatusBadge status={val} />,
            },
          ]}
          data={allDeptBookings}
          emptyTitle="No Departmental Records"
          emptyMessage="No reservations registered for this department."
        />
      </div>

      {/* Decision Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`HOD Authorization: ${selectedBooking.id}`}
          size="md"
        >
          <div>
            <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
                {selectedBooking.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Applicant: <strong>{selectedBooking.bookedBy}</strong> ({selectedBooking.department})
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                📍 Venue: <strong>{selectedBooking.venueName}</strong> • 🗓️ {selectedBooking.date} ({selectedBooking.timeSlot})
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                <strong>Event Purpose:</strong> {selectedBooking.purpose}
              </div>
              {selectedBooking.endorsement && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--success-text)' }}>
                  ✍️ Faculty Endorsement: {selectedBooking.endorsement}
                </div>
              )}
            </div>

            <Textarea
              label="HOD Academic Clearance Remarks / Guidelines"
              rows={3}
              placeholder="Specify academic clearance remarks, sound/security constraints, or reasons for rejection..."
              value={hodNotes}
              onChange={(e) => setHodNotes(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <Button
                variant="danger"
                icon={XCircle}
                onClick={() => handleDecision(selectedBooking, false)}
              >
                Reject Request
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={() => setSelectedBooking(null)}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  onClick={() => handleDecision(selectedBooking, true)}
                >
                  Clear & Forward to Registrar
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default HODDashboard;
