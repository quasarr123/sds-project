// Thin fetch wrapper for the Elysia backend. In dev, Vite proxies /api -> http://localhost:3001
const BASE = '/api';

let unauthorizedHandler = null;

/** App registers a callback that runs when the server says the session is gone. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body, { silent401 = false } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running (bun run dev:server)?', 0);
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !silent401) {
    if (unauthorizedHandler) unauthorizedHandler(data.message);
  }
  if (!res.ok) {
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status);
  }
  return data;
}

export const api = {
  // auth
  login: (identifier, password) => request('POST', '/auth/login', { identifier, password }, { silent401: true }),
  logout: () => request('POST', '/auth/logout'),
  /** Resolves to the user, or null if there is no valid session. */
  me: async () => {
    try {
      const data = await request('GET', '/auth/me', undefined, { silent401: true });
      return data.user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
  changePassword: (currentPassword, newPassword) =>
    request('POST', '/auth/change-password', { currentPassword, newPassword }),

  // data
  venues: () => request('GET', '/venues'),
  bookings: () => request('GET', '/bookings'),
  createBooking: (payload) => request('POST', '/bookings', payload),
  updateBookingStatus: (id, status, extra = {}) =>
    request('PATCH', `/bookings/${encodeURIComponent(id)}/status`, { status, ...extra }),
  cancelBooking: (id, reason) => request('POST', `/bookings/${encodeURIComponent(id)}/cancel`, { reason }),
  holidays: () => request('GET', '/holidays'),
  addHoliday: (payload) => request('POST', '/holidays', payload),
  removeHoliday: (id) => request('DELETE', `/holidays/${encodeURIComponent(id)}`),
  settings: () => request('GET', '/settings'),
  saveSettings: (payload) => request('PUT', '/settings', payload),
  auditLogs: () => request('GET', '/audit-logs'),
};
