import React, { useState, useEffect } from 'react';
import './index.css';

// Data
import { INITIAL_SETTINGS } from './config/defaultSettings';
import { api, setUnauthorizedHandler } from './services/client';

// Common Components & Feedback States
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import {
  LoadingState,
  EmptyState,
  ErrorMessage,
  AccessDeniedPage,
} from './components/common/FeedbackStates';
import { Table } from './components/common/Table';
import { StatusBadge } from './components/common/StatusBadge';
import { Button } from './components/common/Button';

// Role-specific Dashboards & Pages
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { FacultyDashboard } from './pages/FacultyDashboard';
import { HODDashboard } from './pages/HODDashboard';
import { SuperadminDashboard } from './pages/SuperadminDashboard';
import { AllBookingsPage } from './pages/AllBookingsPage';
import { HolidayManagementPage } from './pages/HolidayManagementPage';
import { BookingSettingsPage } from './pages/BookingSettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ManagementPage } from './pages/ManagementPage';
export function App() {
  // Auth state - restored from the server-side session cookie on load
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [booting, setBooting] = useState(true);
  const [loginNotice, setLoginNotice] = useState('');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const currentRole = currentUser?.role || 'student';

  // App routing state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data loaded from the backend
  const [bookings, setBookings] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [venues, setVenues] = useState([]);
  const [clubs, setClubs] = useState([]);

  const [dataLoading, setDataLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  function resetSession(message = '') {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setBookings([]);
    setHolidays([]);
    setAuditLogs([]);
    setVenues([]);
    setClubs([]);
    setApiError(null);
    setChangePasswordOpen(false);
    setLoginNotice(message);
  }

  async function loadAll(user) {
    setDataLoading(true);
    setApiError(null);
    try {
      const [v, b, h, st, c] = await Promise.all([
        api.venues(),
        api.bookings(),
        api.holidays(),
        api.settings(),
        api.clubs(),
      ]);
      setVenues(v);
      setClubs(c);
      setBookings(b);
      setHolidays(h);
      setSettings(st);
      if (user.role === 'superadmin') setAuditLogs(await api.auditLogs());
    } catch (e) {
      setApiError(e.message);
    } finally {
      setDataLoading(false);
    }
  }

  function startSession(user) {
    setLoginNotice('');
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActivePage('dashboard');
    loadAll(user);
  }

  // On first load: if the cookie is still valid, skip the login screen.
  useEffect(() => {
    setUnauthorizedHandler((msg) =>
      resetSession(msg && msg !== 'Not authenticated' ? msg : 'Your session has expired. Please sign in again.')
    );
    api
      .me()
      .then((user) => { if (user) startSession(user); })
      .catch((e) => setLoginNotice(e.message))
      .finally(() => setBooting(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audit entries are written by the server; superadmins just re-pull them after changes.
  async function refreshAudit() {
    if (currentRole !== 'superadmin') return;
    try { setAuditLogs(await api.auditLogs()); } catch { /* non-critical */ }
  }

  function handleLoginSuccess(user) {
    startSession(user);
  }

  async function handleLogout() {
    try { await api.logout(); } catch { /* cookie is cleared server-side if reachable */ }
    resetSession('');
  }

  function replaceBooking(updated) {
    setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  // Runs an API call; on failure shows the banner instead of throwing into a click handler.
  async function guarded(fn) {
    setApiError(null);
    try {
      return await fn();
    } catch (e) {
      if (e.status !== 401) setApiError(e.message);
      return null;
    }
  }

  // Approve / endorse / reject. The server decides stage + approver text and validates the role.
  async function handleUpdateBookingStatus(bookingId, newStatus, additionalData = {}) {
    const { endorsement, rejectionReason, hodNotes } = additionalData;
    const updated = await guarded(() =>
      api.updateBookingStatus(bookingId, newStatus, { endorsement, rejectionReason, hodNotes })
    );
    if (updated) {
      replaceBooking(updated);
      refreshAudit();
    }
  }

  // Superadmin mandatory-reason cancellation
  async function handleCancelBooking(bookingId, reason) {
    const updated = await guarded(() => api.cancelBooking(bookingId, reason));
    if (updated) {
      replaceBooking(updated);
      refreshAudit();
    }
  }

  // Create booking. Errors propagate so the form can show them and stay open.
  async function handleNewBooking(draft) {
    const created = await api.createBooking({
      venueId: draft.venueId,
      title: draft.title,
      clubId: draft.clubId,
      bookingType: draft.bookingType,
      date: draft.date,
      timeSlot: draft.timeSlot,
      attendees: draft.attendees,
      purpose: draft.purpose,
    });
    setBookings((prev) => [created, ...prev]);
    refreshAudit();
    return created;
  }

  // Holidays / Blocked Dates
  async function handleAddHoliday(newHoliday) {
    const created = await guarded(() => api.addHoliday(newHoliday));
    if (created) {
      setHolidays((prev) => [created, ...prev]);
      refreshAudit();
    }
  }

  async function handleRemoveHoliday(holidayId) {
    const res = await guarded(() => api.removeHoliday(holidayId));
    if (res) {
      setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
      refreshAudit();
    }
  }

  // Settings
  async function handleSaveSettings(newSettings) {
    const saved = await guarded(() => api.saveSettings(newSettings));
    if (saved) {
      setSettings(saved);
      refreshAudit();
    }
    return !!saved;
  }

  // Password changed (the modal calls the API itself; the server writes the audit entry)
  function handlePasswordChanged() {
    refreshAudit();
  }

  // Route permission check (Role-Based Access Control)
  function isRouteAuthorized(page, role) {
    const adminPages = ['all-bookings', 'holidays', 'settings', 'audit-logs', 'manage'];
    const hodPages = ['dept-approvals', 'dept-bookings'];
    const facultyPages = ['endorsements'];

    if (adminPages.includes(page) && role !== 'superadmin') {
      return false;
    }
    if (hodPages.includes(page) && role !== 'hod' && role !== 'superadmin') {
      return false;
    }
    if (facultyPages.includes(page) && role !== 'faculty' && role !== 'superadmin') {
      return false;
    }
    return true;
  }

  // Calculate pending counts for badge display
  const badgeCounts = {
    myBookings: bookings.filter((b) => b.userId === currentUser?.id).length,
    pendingEndorsements: bookings.filter((b) => b.status === 'Pending Faculty').length,
    pendingHOD: bookings.filter((b) => b.status === 'Pending HOD').length,
    allPending: bookings.filter((b) => b.status.startsWith('Pending')).length,
  };

  // Checking for an existing session
  if (booting) {
    return <LoadingState fullScreen message="Restoring your session..." />;
  }

  // If not authenticated, render LoginPage
  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} notice={loginNotice} />;
  }

  // Render Page Content with Route Guard
  function renderMainContent() {
    if (dataLoading) {
      return <LoadingState message="Connecting to COEP Central Facilities Database..." />;
    }

    if (!isRouteAuthorized(activePage, currentRole)) {
      return (
        <AccessDeniedPage
          requiredRole={
            ['all-bookings', 'holidays', 'settings', 'audit-logs', 'manage'].includes(activePage)
              ? 'Superadmin / Registrar'
              : activePage.includes('dept')
                ? 'Head of Department (HOD)'
                : 'Faculty Advisor'
          }
          currentRole={currentUser.role}
          onBack={() => setActivePage('dashboard')}
        />
      );
    }

    switch (activePage) {
      case 'dashboard':
      case 'my-bookings':
      case 'new-booking':
        if (currentRole === 'student') {
          return (
            <StudentDashboard
              currentUser={currentUser}
              bookings={bookings}
              venues={venues}
              clubs={clubs}
              onNewBooking={handleNewBooking}
            />
          );
        }
        if (currentRole === 'faculty') {
          return (
            <FacultyDashboard
              currentUser={currentUser}
              bookings={bookings}
              venues={venues}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onNewBooking={handleNewBooking}
            />
          );
        }
        if (currentRole === 'hod') {
          return (
            <HODDashboard
              currentUser={currentUser}
              bookings={bookings}
              venues={venues}
              onUpdateBookingStatus={handleUpdateBookingStatus}
            />
          );
        }
        return (
          <SuperadminDashboard
            currentUser={currentUser}
            bookings={bookings}
            venues={venues}
            holidays={holidays}
            auditLogs={auditLogs}

            onNavigate={(page) => {
              console.log('Sidebar navigation clicked:', page);
              setActivePage(page);
            }}

          />
        );

      case 'endorsements':
        return (
          <FacultyDashboard
            currentUser={currentUser}
            bookings={bookings}
            venues={venues}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onNewBooking={handleNewBooking}
          />
        );

      case 'dept-approvals':
      case 'dept-bookings':
        return (
          <HODDashboard
            currentUser={currentUser}
            bookings={bookings}
            venues={venues}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        );

      case 'all-bookings':
        return (
          <AllBookingsPage
            bookings={bookings}
            venues={venues}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onCancelBooking={handleCancelBooking}
            currentUser={currentUser}
          />
        );

      case 'holidays':
        return (
          <HolidayManagementPage
            holidays={holidays}
            venues={venues}
            onAddHoliday={handleAddHoliday}
            onRemoveHoliday={handleRemoveHoliday}
            currentUser={currentUser}
          />
        );

      case 'settings':
        return (
          <BookingSettingsPage
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        );

      case 'audit-logs':
        return <AuditLogPage auditLogs={auditLogs} />;
      case 'manage':
        return (
          <ManagementPage
            venues={venues}
            clubs={clubs}
            onChanged={async () => {
              try {
                const [v, c] = await Promise.all([api.venues(), api.clubs()]);
                setVenues(v);
                setClubs(c);
              } catch { /* shown on next load */ }
              refreshAudit();
            }}
          />
        );

      case 'venues':
        return (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
                COEP Campus Venues & Spaces Catalog
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Official repository of heritage auditoriums, waterfront lawns, and smart departmental seminar facilities.
              </p>
            </div>
            <div className="grid-cols-3">
              {venues.map((v) => (
                <div
                  key={v.id}
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
                      height: '160px',
                      backgroundImage: `url(${v.image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>{v.name}</h3>
                      <StatusBadge status={v.status} />
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--coep-maroon-700)', fontWeight: 600, marginTop: '2px' }}>
                      📍 {v.location}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      Capacity: <strong>{v.capacity}</strong> attendees • Dept: {v.department}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '10px' }}>
                      {v.amenities.map((a, i) => (
                        <span key={i} style={{ fontSize: '11px', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px' }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <EmptyState
            title="Page in Development"
            message="This specific section is under preparation."
            actionLabel="Return to Dashboard"
            onAction={() => setActivePage('dashboard')}
          />
        );
    }
  }

  return (
    <div className="coep-app-container">
      <div style={{ display: 'flex', flex: 1, minHeight: '100vh' }}>
        {/* Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activePage={activePage}
          onNavigate={(page) => {
            console.log('Sidebar navigation clicked:', page);
            setActivePage(page);
          }}
          onLogout={handleLogout}
          counts={badgeCounts}
        />

        {/* Main Content Area */}
        <div className="coep-main-wrapper">
          <Navbar
            currentUser={currentUser}
            currentRole={currentRole}
            onLogout={handleLogout}
            onOpenChangePassword={() => setChangePasswordOpen(true)}
            pendingCount={
              currentRole === 'superadmin'
                ? badgeCounts.allPending
                : currentRole === 'hod'
                  ? badgeCounts.pendingHOD
                  : currentRole === 'faculty'
                    ? badgeCounts.pendingEndorsements
                    : 0
            }
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />

          <main className="coep-content-area">
            {apiError && (
              <ErrorMessage
                title="Request failed"
                message={apiError}
                onDismiss={() => setApiError(null)}
                onRetry={() => loadAll(currentUser)}
              />
            )}
            {renderMainContent()}
          </main>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        user={currentUser}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  );
}

export default App;
