import React from 'react';

/** Steps a booking goes through, derived from its approval route. */
export function stepsForRoute(route) {
  switch (route) {
    case 'club':
      return [
        { key: 'advisor', label: 'Club Faculty Advisor', pending: 'Pending Faculty' },
        { key: 'superadmin', label: 'Superadmin', pending: 'Pending Superadmin' },
      ];
    case 'hod':
      return [{ key: 'hod', label: 'Departmental HOD', pending: 'Pending HOD' }];
    case 'auto':
      return [{ key: 'auto', label: 'Availability check (auto-approved)', pending: null }];
    default:
      return [{ key: 'superadmin', label: 'Superadmin', pending: 'Pending Superadmin' }];
  }
}

/** Short sentence describing who must approve a request (used on the booking forms). */
export function describeRoute({ role, venue, isClub, extraClass }) {
  if (!venue) return '';
  if (role === 'faculty') {
    return extraClass
      ? 'Extra class: no approval needed. It is confirmed automatically if the slot is free.'
      : 'Approval needed from the relevant HOD.';
  }
  if (isClub || venue.category === 'club') return 'Approval needed: Club Faculty Advisor first, then Superadmin.';
  if (venue.category === 'central') return 'Approval needed from the Superadmin.';
  return `Approval needed from the HOD of ${venue.department}.`;
}

export function ApprovalTimeline({ booking }) {
  const steps = stepsForRoute(booking.route);
  const trail = booking.approvals || [];
  const rejected = booking.status === 'Rejected';
  const cancelled = booking.status === 'Cancelled';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px' }}>
      {steps.map((s, i) => {
        const rec = trail.find((a) => a.step === s.key);
        let color = '#cbd5e1';
        let text = 'Waiting for the previous step';
        if (rec && rec.decision === 'approved') {
          color = 'var(--success-solid)';
          text = `✅ Approved by ${rec.by}${rec.at ? ` • ${rec.at}` : ''}`;
        } else if (rec && rec.decision === 'rejected') {
          color = 'var(--danger-solid, #dc2626)';
          text = `❌ Rejected by ${rec.by}${rec.at ? ` • ${rec.at}` : ''}`;
        } else if (!rejected && !cancelled && s.pending === booking.status) {
          color = 'var(--warning-solid)';
          text = '⏳ Waiting for this approval';
        } else if (cancelled) {
          text = 'Booking cancelled';
        } else if (rejected) {
          text = 'Not reached';
        }
        return (
          <div key={s.key} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-24px', top: '2px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: color }} />
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{i + 1}. {s.label}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{text}</div>
            {rec?.note && <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>“{rec.note}”</div>}
          </div>
        );
      })}
    </div>
  );
}

export default ApprovalTimeline;
