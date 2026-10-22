import React, { useState } from 'react';
import './index.css';

// Data
import {
  INITIAL_USERS,
  INITIAL_BOOKINGS,
  INITIAL_HOLIDAYS,
  INITIAL_SETTINGS,
  INITIAL_AUDIT_LOGS,
  VENUES,
} from './data/mockData';

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

export function App() {
  // Auth state - Login screen is presented first when website opens
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('student');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // App routing state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // System Database state
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [holidays, setHolidays] = useState(INITIAL_HOLIDAYS);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [venues, setVenues] = useState(VENUES);

  // Demo feedback state controls
  const [simulatedLoading, setSimulatedLoading] = useState(false);
  const [simulatedError, setSimulatedError] = useState(null);

  // Helper to log audit actions
  function addAuditLog(action, target, details, status = 'SUCCESS') {
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString(),
      actor: currentUser?.name || 'Authorized User',
      role: currentRole,
      action,
      target,
      ipAddress: '10.20.1.18 (COEP Secure Subnet)',
      status,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }

  // Handle Login
  function handleLoginSuccess(user) {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setIsAuthenticated(true);
    setActivePage('dashboard');
    addAuditLog('USER_LOGIN', `Session ${user.email}`, 'Successful authenticated login via COEP SSO.');
  }

  // Handle Logout
  function handleLogout() {
    addAuditLog('USER_LOGOUT', `Session ${currentUser.email}`, 'User terminated active session.');
    setIsAuthenticated(false);
  }

  // Quick Switch Role (for interactive pair evaluation)
  function handleRoleSwitch(role) {
    const matchingUser = INITIAL_USERS.find((u) => u.role === role);
    if (matchingUser) {
      setCurrentUser(matchingUser);
      setCurrentRole(role);
      setActivePage('dashboard');
    }
  }

  // Booking updates
  function handleUpdateBookingStatus(bookingId, newStatus, additionalData = {}) {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: newStatus,
            ...additionalData,
          };
        }
        return b;
      })
    );

    addAuditLog(
      `BOOKING_${newStatus.toUpperCase().replace(/\s+/g, '_')}`,
      bookingId,
      `Status changed to "${newStatus}". Updated by ${currentUser.name} (${currentRole}).`
    );
  }

  // Superadmin Mandatory Reason Cancellation
  function handleCancelBooking(bookingId, reason, meta = {}) {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          return {
            ...b,
            status: 'Cancelled',
            cancellationReason: reason,
            cancelledBy: meta.cancelledBy || currentUser.name,
            cancelledAt: meta.cancelledAt || new Date().toLocaleString(),
          };
        }
        return b;
      })
    );

    addAuditLog(
      'BOOKING_CANCELLED',
      bookingId,
      `Superadmin revoked booking. Mandatory reason: "${reason}". Dispatched to security gate.`,
      'WARNING'
    );
  }

  // Create new booking
  function handleNewBooking(newBooking) {
    setBookings((prev) => [newBooking, ...prev]);
    addAuditLog(
      'BOOKING_SUBMITTED',
      `${newBooking.id} (${newBooking.title})`,
      `Submitted reservation for ${newBooking.venueName} on ${newBooking.date} by ${newBooking.bookedBy}.`
    );
  }

  // Holidays / Blocked Dates
  function handleAddHoliday(newHoliday) {
    setHolidays((prev) => [newHoliday, ...prev]);
    addAuditLog(
      'BLOCKED_DATE_ADDED',
      `${newHoliday.title}`,
      `Lockout added: ${newHoliday.startDate} to ${newHoliday.endDate}. Severity: ${newHoliday.type}.`
    );
  }

  function handleRemoveHoliday(holidayId) {
    setHolidays((prev) => prev.filter((h) => h.id !== holidayId));
    addAuditLog('BLOCKED_DATE_REMOVED', holidayId, 'Released university lockout window.');
  }

  // Settings
  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    addAuditLog(
      'SETTINGS_UPDATED',
      'Global Booking Settings',
      `Lead time set to ${newSettings.minLeadTimeDays} days, auto-escalation: ${newSettings.autoEscalateHours} hrs.`
    );
  }

  // Password changed
  function handlePasswordChanged(details) {
    addAuditLog('PASSWORD_CHANGED', `User ${currentUser.email}`, 'User self-service password update.');
  }

  // Route permission check (Role-Based Access Control)
  function isRouteAuthorized(page, role) {
    const adminPages = ['all-bookings', 'holidays', 'settings', 'audit-logs'];
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

  // If not authenticated, render LoginPage
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Render Page Content with Route Guard
  function renderMainContent() {
    if (simulatedLoading) {
      return <LoadingState message="Connecting to COEP Central Facilities Database..." />;
    }

    if (!isRouteAuthorized(activePage, currentRole)) {
      return (
        <AccessDeniedPage
          requiredRole={
            ['all-bookings', 'holidays', 'settings', 'audit-logs'].includes(activePage)
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
            onNavigate={(page) => setActivePage(page)}
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
      {/* Demo Floating Quick Controls */}
      <div className="coep-role-switcher-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 800, color: 'var(--coep-gold-400)' }}>COEP Tech Portal Demo:</span>
          <span>Switch clearance role instantaneously to evaluate role-tailored workflows:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {['student', 'faculty', 'hod', 'superadmin'].map((r) => (
            <button
              key={r}
              className={`role-pill ${currentRole === r ? 'active' : ''}`}
              onClick={() => handleRoleSwitch(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
          <button
            onClick={() => setSimulatedLoading(!simulatedLoading)}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              borderRadius: '4px',
              background: simulatedLoading ? 'var(--warning-solid)' : 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              marginLeft: '12px',
            }}
          >
            {simulatedLoading ? 'Exit Loading State' : 'Test Loading State'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 38px)' }}>
        {/* Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activePage={activePage}
          onNavigate={(page) => setActivePage(page)}
          onLogout={handleLogout}
          counts={badgeCounts}
        />

        {/* Main Content Area */}
        <div className="coep-main-wrapper">
          <Navbar
            currentUser={currentUser}
            currentRole={currentRole}
            onRoleChange={handleRoleSwitch}
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
            {simulatedError && (
              <ErrorMessage
                title="Simulated System Alert"
                message={simulatedError}
                onDismiss={() => setSimulatedError(null)}
                onRetry={() => setSimulatedError(null)}
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
