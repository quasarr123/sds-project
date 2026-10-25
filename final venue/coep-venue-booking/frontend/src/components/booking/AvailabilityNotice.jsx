import React from 'react';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const TONES = {
  available: { Icon: CheckCircle2, bg: 'var(--success-bg)', border: 'var(--success-border)', text: 'var(--success-text)' },
  conflict: { Icon: AlertCircle, bg: 'var(--danger-bg)', border: 'var(--danger-border)', text: 'var(--danger-text)' },
  info: { Icon: Clock, bg: 'var(--info-bg)', border: 'var(--info-border)', text: 'var(--info-text)' },
};

const STATE_TEXT = { PENDING: 'awaiting approval', CONFIRMED: 'booked' };

function headline({ status, result }) {
  switch (status) {
    case 'checking':
      return 'Checking availability…';
    case 'error':
      return 'Could not check availability right now. It will be checked again when you submit.';
    case 'day':
      return result.busy.length ? 'Already taken on this date:' : 'Nothing is booked at this venue on this date.';
    case 'available':
      return `${result.message} Submitting holds it while your request waits for approval.`;
    default:
      return result.message; // conflict: the server's message, including the actual overlap
  }
}

/** Shows the result of useSlotAvailability under the date / time fields. */
export function AvailabilityNotice({ availability }) {
  const { status, result } = availability;
  if (status === 'idle') return null;

  const tone = TONES[status] ?? TONES.info;
  const taken = status === 'day' && result.busy.map((b) => `${b.label} (${STATE_TEXT[b.state]})`).join(', ');
  const free = (status === 'day' || status === 'conflict') && result.free.map((f) => f.label).join(', ');

  return (
    <div
      role="status"
      style={{
        display: 'flex', gap: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '13px',
        borderRadius: 'var(--radius-md)', background: tone.bg, color: tone.text, border: `1px solid ${tone.border}`,
      }}
    >
      <tone.Icon size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div>{headline(availability)}</div>
        {taken && <div>{taken}</div>}
        {free && <div style={{ marginTop: '2px' }}>Free: {free}</div>}
      </div>
    </div>
  );
}

export default AvailabilityNotice;
