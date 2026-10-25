import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  Building,
  Sparkles,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { Input, Select, Textarea, Toggle } from '../components/common/FormControls';
import { ApprovalTimeline, describeRoute } from '../components/common/ApprovalTimeline';
import { SlotPicker } from '../components/booking/SlotPicker';
import { AvailabilityNotice } from '../components/booking/AvailabilityNotice';
import { useSlotAvailability } from '../hooks/useSlotAvailability';
import { STUDENT_SLOT_PRESETS } from '../config/timeSlots';

export function StudentDashboard({
  currentUser,
  bookings = [],
  venues = [],
  clubs = [],
  onNewBooking,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form State
  const [venueId, setVenueId] = useState('');
  const [title, setTitle] = useState('');
  const [isClubEvent, setIsClubEvent] = useState(false);
  const [clubId, setClubId] = useState('');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [attendees, setAttendees] = useState('');
  const [purpose, setPurpose] = useState('');
  const [formError, setFormError] = useState('');
  const availability = useSlotAvailability({ venueId, date, timeSlot });

  // Student specific bookings
  const myBookings = bookings.filter((b) => b.userId === currentUser.id);

  const selectedVenue = venues.find((v) => v.id === venueId);
  const clubRequired = isClubEvent || selectedVenue?.category === 'club';

  const pendingCount = myBookings.filter((b) => b.status.startsWith('Pending')).length;
  const approvedCount = myBookings.filter((b) => b.status === 'Approved').length;
  const rejectedCount = myBookings.filter((b) => b.status === 'Rejected').length;

  async function handleSubmitRequest(e) {
    e.preventDefault();
    setFormError('');

    if (!venueId || !title || !date || !timeSlot || !purpose) {
      setFormError('Please fill in all mandatory booking fields.');
      return;
    }

    if (clubRequired && !clubId) {
      setFormError('Please choose the club this event is for.');
      return;
    }

    try {
      await onNewBooking({ venueId, title, clubId: clubRequired ? clubId : undefined, date, timeSlot, attendees, purpose });
    } catch (err) {
      setFormError(err.message || 'Could not submit the booking request.');
      if (err.status === 409) availability.recheck(); // someone took the slot first
      return;
    }
    setModalOpen(false);
    // Reset form
    setVenueId('');
    setTitle('');
    setIsClubEvent(false);
    setClubId('');
    setDate('');
    setTimeSlot('');
    setAttendees('');
    setPurpose('');
  }

  const columns = [
    {
      title: 'Booking ID & Event',
      key: 'title',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.title}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.id} • {row.club || row.department}
          </div>
        </div>
      ),
    },
    {
      title: 'Reserved Venue',
      key: 'venueName',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={15} color="var(--coep-maroon-700)" />
          <span style={{ fontWeight: 600 }}>{row.venueName}</span>
        </div>
      ),
    },
    {
      title: 'Date & Slot',
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
      title: 'Workflow Status',
      key: 'status',
      sortable: true,
      render: (val, row) => <StatusBadge status={row.status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedBooking(row)}
        >
          Track Status
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Welcome & Quick Action Bar */}
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
            Welcome, {currentUser?.name || 'COEP Student'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            MIS: <strong>{currentUser?.mis || '112103045'}</strong> • Outlook: <strong>{currentUser?.email}</strong> • Dept: {currentUser?.department || 'Computer Engineering'}
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Request Venue Reservation
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              My Requests
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-navy-900)', marginTop: '4px' }}>
              {myBookings.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Total submissions</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info-solid)' }}>
            <FileText size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Pending Approvals
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--warning-solid)', marginTop: '4px' }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>In review pipeline</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-solid)' }}>
            <Clock size={24} />
          </div>
        </div>

        <div className="coep-stat-card">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Approved Venues
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-solid)', marginTop: '4px' }}>
              {approvedCount}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Ready for event</div>
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
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--coep-maroon-700)', marginTop: '4px' }}>
              {venues.length}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Auditoriums & Halls</div>
          </div>
          <div className="coep-stat-icon-wrapper" style={{ background: 'var(--danger-bg)', color: 'var(--coep-maroon-700)' }}>
            <Building size={24} />
          </div>
        </div>
      </div>

      {/* Main Table: My Reservations */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
            My Active Reservations & Status
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            Approval depends on the venue: Department venue → HOD • Auditorium / Academic Complex → Superadmin • Club event → Faculty Advisor, then Superadmin
          </span>
        </div>

        <Table
          columns={columns}
          data={myBookings}
          searchKeys={['title', 'venueName', 'id', 'club']}
          searchPlaceholder="Search my bookings by event or venue..."
          emptyTitle="No Reservations Submitted Yet"
          emptyMessage="You have not requested any campus spaces yet. Click 'Request Venue Reservation' above to reserve an auditorium or seminar hall."
        />
      </div>

      {/* Quick Catalog Preview of COEP Venues */}
      <div>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--coep-navy-900)', marginBottom: '14px' }}>
          Explore Available COEP Venues
        </h3>
        <div className="grid-cols-3">
          {venues.slice(0, 3).map((venue) => (
            <div
              key={venue.id}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  height: '140px',
                  backgroundImage: `url(${venue.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#ffffff',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  Cap: {venue.capacity}
                </div>
              </div>
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
                  {venue.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  <MapPin size={13} color="var(--coep-maroon-700)" />
                  <span>{venue.location}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                  {venue.amenities.slice(0, 3).map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '11px',
                        background: 'var(--bg-app)',
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <StatusBadge status={venue.status} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVenueId(venue.id);
                      setModalOpen(true);
                    }}
                  >
                    Select Venue
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Form Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="COEP Campus Space Reservation Request"
        size="lg"
      >
        <form onSubmit={handleSubmitRequest}>
          {formError && (
            <div style={{ backgroundColor: 'var(--danger-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', color: 'var(--danger-text)', fontSize: '13px', marginBottom: '14px', display: 'flex', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid-cols-2">
            <Select
              label="Select Desired Venue"
              required
              value={venueId}
              onChange={(e) => setVenueId(e.target.value)}
              placeholder="Choose Auditorium / Hall"
              options={venues.map((v) => ({
                value: v.id,
                label: `${v.name} (Cap: ${v.capacity} - ${v.location})`,
              }))}
            />

            <div>
              <Toggle
                id="club-event-toggle"
                label="This is a club event"
                description={selectedVenue?.category === 'club' ? 'Club venues are only for club events.' : 'Needs Faculty Advisor + Superadmin approval.'}
                checked={clubRequired}
                onChange={(e) => {
                  const on = e && e.target ? e.target.checked : !!e;
                  if (selectedVenue?.category !== 'club') setIsClubEvent(on);
                }}
              />
              {clubRequired && (
                <Select
                  label="Club"
                  required
                  value={clubId}
                  onChange={(e) => setClubId(e.target.value)}
                  placeholder="Select your club"
                  options={clubs.map((c) => ({
                    value: c.id,
                    label: `${c.name}${c.advisorName ? ` (Advisor: ${c.advisorName})` : ' (no advisor assigned)'}`,
                  }))}
                />
              )}
            </div>
          </div>

          <Input
            label="Event or Activity Title"
            required
            placeholder="e.g. Annual Technical Symposium Keynote"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid-cols-3">
            <Input
              label="Reservation Date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <SlotPicker value={timeSlot} onChange={setTimeSlot} presets={STUDENT_SLOT_PRESETS} />

            <Input
              label="Expected Attendees"
              type="number"
              placeholder="e.g. 250"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
            />
          </div>

          <AvailabilityNotice availability={availability} />

          {selectedVenue && (
            <div style={{ background: 'var(--info-bg)', color: 'var(--info-text, #1e40af)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', marginBottom: '14px' }}>
              {describeRoute({ role: 'student', venue: selectedVenue, isClub: clubRequired })}
            </div>
          )}

          <Textarea
            label="Detailed Event Purpose & Technical Requisitions"
            required
            rows={3}
            placeholder="Describe the nature of event, guest speakers, AV audio projector needs, and safety compliance..."
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            hint="A pending request holds the slot until it is approved, rejected or cancelled."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Reservation Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Track Status Timeline Modal */}
      {selectedBooking && (
        <Modal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          title={`Booking Timeline: ${selectedBooking.id}`}
          size="md"
        >
          <div>
            <div style={{ padding: '12px 16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
                {selectedBooking.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                📍 {selectedBooking.venueName} • 🗓️ {selectedBooking.date} ({selectedBooking.timeSlot})
              </div>
              <div style={{ marginTop: '8px' }}>
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            {/* Approval steps for this booking's route */}
            <div style={{ padding: '8px 12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Approval steps for this request:</h4>
              <ApprovalTimeline booking={selectedBooking} />


              {selectedBooking.rejectionReason && (
                <div style={{ marginTop: '20px', padding: '12px', background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                  <strong style={{ color: 'var(--danger-text)', fontSize: '13px' }}>Rejection Explanation:</strong>
                  <p style={{ color: 'var(--danger-text)', fontSize: '13px', marginTop: '4px' }}>
                    {selectedBooking.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <Button variant="secondary" onClick={() => setSelectedBooking(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default StudentDashboard;
