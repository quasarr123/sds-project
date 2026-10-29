import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/client';

/**
 * Asks the server whether a venue / date / time range is free while the user fills in the form.
 *
 * status: 'idle'      not enough chosen yet
 *         'checking'  request in flight
 *         'day'       venue and date chosen, no time yet (result lists what is taken / free)
 *         'available' the chosen range is free
 *         'conflict'  the chosen range overlaps a pending or confirmed booking
 *         'error'     could not check
 *
 * The answer is advisory: the booking request is checked again, under a lock, when it is submitted.
 */
export function useSlotAvailability({ venueId, date, timeSlot }) {
  const [state, setState] = useState({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);
  const recheck = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    if (!venueId || !date) {
      setState({ status: 'idle' });
      return undefined;
    }
    let stale = false;
    setState({ status: 'checking' });
    const timer = setTimeout(async () => {
      try {
        const result = await api.availability({ venueId, date, timeSlot });
        if (stale) return;
        const status = !timeSlot ? 'day' : result.available ? 'available' : 'conflict';
        setState({ status, result });
      } catch (e) {
        if (!stale) setState({ status: 'error', message: e.message });
      }
    }, 300);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [venueId, date, timeSlot, attempt]);

  return { ...state, recheck };
}
