import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Building,
  CheckSquare,
  ShieldCheck,
  FileText,
  Sliders,
  CalendarOff,
  LogOut,
  Users,
  Compass,
} from 'lucide-react';

export function Sidebar({
  currentRole,
  activePage,
  onNavigate,
  onLogout,
  counts = {},
}) {
  // Navigation structure per role
  const getNavItems = () => {
    switch (currentRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'new-booking', label: 'Book a Venue', icon: CalendarDays },
          { id: 'my-bookings', label: 'My Reservations', icon: Clock, badge: counts.myBookings },
          { id: 'venues', label: 'Campus Venues', icon: Building },
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
          { id: 'endorsements', label: 'Club Endorsements', icon: CheckSquare, badge: counts.pendingEndorsements },
          { id: 'new-booking', label: 'Faculty Event Booking', icon: CalendarDays },
          { id: 'venues', label: 'Campus Venues', icon: Building },
        ];
      case 'hod':
        return [
          { id: 'dashboard', label: 'HOD Dashboard', icon: LayoutDashboard },
          { id: 'dept-approvals', label: 'Department Approvals', icon: CheckSquare, badge: counts.pendingHOD },
          { id: 'dept-bookings', label: 'Dept Timetable & Slots', icon: CalendarDays },
          { id: 'venues', label: 'Department Venues', icon: Building },
        ];
      case 'superadmin':
        return [
          { id: 'dashboard', label: 'Superadmin Dashboard', icon: LayoutDashboard },
          { id: 'all-bookings', label: 'All Bookings Master', icon: CalendarDays, badge: counts.allPending },
          { id: 'holidays', label: 'Holidays & Blocked Dates', icon: CalendarOff },
          { id: 'settings', label: 'Booking Settings', icon: Sliders },
          { id: 'audit-logs', label: 'System Audit Logs', icon: FileText },
          { id: 'manage', label: 'Users, Venues & Clubs', icon: Building },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const roleMeta = {
    student: { title: 'Student Portal', color: '#38bdf8', icon: Users },
    faculty: { title: 'Faculty Portal', color: '#fbbf24', icon: Compass },
    hod: { title: 'HOD Admin Console', color: '#a78bfa', icon: ShieldCheck },
    superadmin: { title: 'Registrar & Estate', color: '#f87171', icon: ShieldCheck },
  }[currentRole] || { title: 'COEP Portal', color: '#ffffff', icon: Users };

  const RoleIcon = roleMeta.icon;

  return (
    <aside className="coep-sidebar">
      {/* Role Indicator Banner */}
      <div className="coep-sidebar-header">
        <div className="coep-sidebar-role-indicator">
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: roleMeta.color,
            }}
          >
            <RoleIcon size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'rgba(255, 255, 255, 0.5)' }}>
              Active Clearance
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
              {roleMeta.title}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="coep-sidebar-nav">
        <div className="coep-sidebar-section-title">Navigation Menu</div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`coep-nav-link ${isActive ? 'active' : ''}`}
              style={{
                width: '100%',
                background: isActive ? undefined : 'transparent',
                textAlign: 'left',
              }}
            >
              <Icon size={18} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  style={{
                    backgroundColor: isActive ? 'var(--coep-gold-500)' : 'var(--coep-maroon-600)',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick link to test simulated 403 Access Denied */}
        {currentRole === 'student' && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="coep-sidebar-section-title">Test Guarded Access</div>
            <button
              onClick={() => onNavigate('settings')}
              className="coep-nav-link"
              style={{ width: '100%', background: 'transparent', opacity: 0.7, fontSize: '12px' }}
            >
              <Sliders size={16} />
              <span>Restricted Settings (403)</span>
            </button>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="coep-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>COEP Tech University</div>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>Shivajinagar, Pune 411005</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#ffffff',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
