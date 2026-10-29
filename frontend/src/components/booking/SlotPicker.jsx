import React, { useState } from 'react';
import { Input, Select } from '../common/FormControls';

const CUSTOM = '__custom__';

/** '15:30' -> '03:30 PM' (the format the server reads). */
function to12h(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Slot text for a custom range, or '' until both times are set and in order. */
function customSlot(start, end) {
  return start && end && end > start ? `${to12h(start)} - ${to12h(end)}` : '';
}

/**
 * Time slot field: ready-made slots plus a "Custom time…" option with a from/to time range.
 * Calls onChange with the slot text the API expects, e.g. '03:30 PM - 04:30 PM'.
 */
export function SlotPicker({ value, onChange, presets, label = 'Time Slot' }) {
  const [custom, setCustom] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  function choose(choice) {
    setCustom(choice === CUSTOM);
    onChange(choice === CUSTOM ? customSlot(start, end) : choice);
  }

  function setTimes(nextStart, nextEnd) {
    setStart(nextStart);
    setEnd(nextEnd);
    onChange(customSlot(nextStart, nextEnd));
  }

  return (
    <div>
      <Select
        label={label}
        required
        value={custom ? CUSTOM : value}
        onChange={(e) => choose(e.target.value)}
        placeholder="Select Slot"
        options={[...presets, { value: CUSTOM, label: 'Custom time…' }]}
      />
      {custom && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <Input id="slot-start" label="From" type="time" required value={start} onChange={(e) => setTimes(e.target.value, end)} />
          <Input
            id="slot-end"
            label="To"
            type="time"
            required
            value={end}
            onChange={(e) => setTimes(start, e.target.value)}
            error={start && end && end <= start ? 'Must be after the start time' : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default SlotPicker;
