import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Plus,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea } from '../components/common/FormControls';
import { VENUES } from '../data/mockData';

export function FacultyDashboard({
  currentUser,
  bookings = [],
  venues = VENUES,
  onUpdateBookingStatus,
  onNewBooking,
}) {
  const [activeTab, setActiveTab] = useState('endorsements'); // 'endorsements' | 'my-bookings'
  const [reviewModal, setReviewModal] = useState(null);
  const [newBookingModal, setNewBookingModal] = useState(false);
  const [endorsementComment, setEndorsementComment] = useState('');

  // New Faculty Booking Form
  const [venueId, setVenueId] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [attendees, setAttendees] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState('');

  // Filter student requests requiring faculty endorsement
  const pendingEndorsements = bookings.filter((b) => b.status === 'Pending Faculty');
  const facultyOwnBookings = bookings.filter((b) => b.userId === currentUser.id || b.role === 'faculty');

  function handleEndorse(booking, approved) {
    if (approved) {
      onUpdateBookingStatus(booking.id, 'Pending HOD', {
        endorsement: endorsementComment || 'Endorsed by Faculty Advisor for academic relevance and safety.',
        approvedBy: `Endorsed by ${currentUser.name} (${currentUser.designation || 'Faculty Incharge'})`,
        stage: 'Level 2: HOD Review',
      });
    } else {
      onUpdateBookingStatus(booking.id, 'Rejected', {
        rejectionReason: endorsementComment || 'Faculty advisor deemed proposed event non-compliant with departmental guidelines.',
        approvedBy: `Rejected by ${currentUser.name}`,
        stage: 'Rejected by Faculty Advisor',
      });
    }
    setReviewModal(null);
    setEndorsementComment('');
  }

  async function handleCreateFacultyBooking(e) {
    e.preventDefault();
    if (!venueId || !title || !date || !timeSlot || !purpose) return;

    setFormError('');
    try {
      await onNewBooking({ venueId, title, date, timeSlot, attendees, purpose });
    } catch (err) {
      setFormError(err.message || 'Could not submit the booking request.');
      return;
    }
    setNewBookingModal(false);
    setVenueId('');
    setTitle('');
    setDate('');
    setTimeSlot('');
    setAttendees('');
    setPurpose('');
  }

  const endorsementColumns = [
    {
      title: 'Request ID & Title',
      key: 'title',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.id} • Student: <strong>{row.bookedBy}</strong> ({row.club})
          </div>
        </div>
      ),
    },
    {
      title: 'Target Venue',
      key: 'venueName',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} color="var(--coep-maroon-700)" />
          <span style={{ fontWeight: 600 }}>{row.venueName}</span>
        </div>
      ),
    },
    {
      title: 'Date & Time',
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
      title: 'Expected Footfall',
      key: 'attendees',
      render: (val) => <span>{val} attendees</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, row) => (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setReviewModal(row);
            setEndorsementComment('');
          }}
        >
          Review & Endorse
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Header bar */}
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
            Faculty Portal: {currentUser?.name}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            MIS: <strong>{currentUser?.mis || 'FAC-9021'}</strong> • Outlook: <strong>{currentUser?.email}</strong> • {currentUser?.department}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setNewBookingModal(true)}
          >
            New Academic Event Booking
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-3" style={{ marginBottom: '24px' }}>
        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Pending Endorsements
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning-solid)', marginTop: '4px' }}>
              {pendingEndorsements.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Student club requests awaiting signature
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
            <CheckSquare size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              My Academic Bookings
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--info-solid)', marginTop: '4px' }}>
              {facultyOwnBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Lectures, conferences & symposiums
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info-solid)' }}>
            <Calendar size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Active College Venues
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-maroon-700)', marginTop: '4px' }}>
              {venues.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Available for departmental reservation
            </div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--coep-maroon-700)' }}>
            <Building size={24} />
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('endorsements')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'endorsements' ? '3px solid var(--coep-maroon-700)' : '3px solid transparent',
            color: activeTab === 'endorsements' ? 'var(--coep-maroon-700)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'endorsements' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UserCheck size={16} />
          <span>Student Club Endorsement Queue</span>
          {pendingEndorsements.length > 0 && (
            <span style={{ backgroundColor: 'var(--warning-solid)', color: '#fff', fontSize: '11px', padding: '1px 6px', borderRadius: '10px' }}>
              {pendingEndorsements.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my-bookings')}
          style={{
            padding: '10px 16px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'my-bookings' ? '3px solid var(--coep-maroon-700)' : '3px solid transparent',
            color: activeTab === 'my-bookings' ? 'var(--coep-maroon-700)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'my-bookings' ? 700 : 500,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={16} />
          <span>My Faculty Bookings ({facultyOwnBookings.length})</span>
        </button>
      </div>

      {/* Tab 1: Student Endorsements */}
      {activeTab === 'endorsements' && (
        <div>
          <Table
            columns={endorsementColumns}
            data={pendingEndorsements}
            searchKeys={['title', 'bookedBy', 'venueName', 'club']}
            searchPlaceholder="Search endorsement requests..."
            emptyTitle="All Endorsement Queues Clear"
            emptyMessage="There are currently no student club requests awaiting your faculty verification."
          />
        </div>
      )}

      {/* Tab 2: Faculty Own Bookings */}
      {activeTab === 'my-bookings' && (
        <div>
          <Table
            columns={[
              {
                title: 'Event Title',
                key: 'title',
                render: (val, row) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{row.id}</div>
                  </div>
                ),
              },
              { title: 'Venue', key: 'venueName' },
              { title: 'Date', key: 'date' },
              { title: 'Slot', key: 'timeSlot' },
              {
                title: 'Status',
                key: 'status',
                render: (val) => <StatusBadge status={val} />,
              },
            ]}
            data={facultyOwnBookings}
            emptyTitle="No Faculty Bookings"
            emptyMessage="You have not created any faculty events yet. Click 'New Academic Event Booking' to reserve a hall."
          />
        </div>
      )}

      {/* Review & Endorsement Modal */}
      {reviewModal && (
        <Modal
          isOpen={Boolean(reviewModal)}
          onClose={() => setReviewModal(null)}
          title={`Faculty Endorsement: ${reviewModal.id}`}
          size="md"
        >
          <div>
            <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
                {reviewModal.title}
              </h4>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Organized by: <strong>{reviewModal.bookedBy}</strong> • Club: <strong>{reviewModal.club}</strong>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                📍 Venue: <strong>{reviewModal.venueName}</strong> | 🗓️ Date: {reviewModal.date} ({reviewModal.timeSlot})
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <strong>Purpose:</strong> {reviewModal.purpose}
              </div>
            </div>

            <Textarea
              label="Faculty Recommendation Note / Conditions"
              rows={3}
              placeholder="Provide comments or conditions for HOD review (e.g. Verified student safety, faculty presence will be maintained)..."
              value={endorsementComment}
              onChange={(e) => setEndorsementComment(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <Button
                variant="danger"
                icon={XCircle}
                onClick={() => handleEndorse(reviewModal, false)}
              >
                Reject Request
              </Button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="secondary" onClick={() => setReviewModal(null)}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  icon={CheckCircle2}
                  onClick={() => handleEndorse(reviewModal, true)}
                >
                  Endorse & Forward to HOD
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Faculty Booking Modal */}
      <Modal
        isOpen={newBookingModal}
        onClose={() => setNewBookingModal(false)}
        title="Reserve Venue for Academic / Faculty Program"
        size="lg"
      >
        <form onSubmit={handleCreateFacultyBooking}>
          {formError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}
          <div className="grid-cols-2">
            <Select
              label="Select Desired Hall or Auditorium"
              required
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              options={venues.map((v) => ({
                value: v.id,
                label: `${v.name} (${v.location})`,
              }))}
            />

            <Input
              label="Academic Program / Lecture Title"
              required
              placeholder="e.g. IEEE Distinguished Seminar on Microelectronics"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid-cols-3">
            <Input
              label="Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Select
              label="Slot"
              required
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              options={[
                '09:00 AM - 01:00 PM',
                '02:00 PM - 05:00 PM',
                '09:00 AM - 05:00 PM',
              ]}
            />
            <Input
              label="Expected Attendees"
              type="number"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="e.g. 100"
            />
          </div>

          <Textarea
            label="Program Description & Guest Profile"
            required
            rows={3}
            placeholder="Details of visiting professor, department curriculum alignment, equipment..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setNewBookingModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Academic Requisition
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default FacultyDashboard;
