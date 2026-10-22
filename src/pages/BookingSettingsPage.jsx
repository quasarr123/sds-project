import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  Clock,
  Shield,
  Bell,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input, Select, Textarea, Toggle } from '../components/common/FormControls';
import { INITIAL_SETTINGS } from '../data/mockData';

export function BookingSettingsPage({ settings = INITIAL_SETTINGS, onSaveSettings }) {
  const [formData, setFormData] = useState({ ...INITIAL_SETTINGS, ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleFieldChange(field, val) {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }

  function handleSave(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSaveSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 600);
  }

  return (
    <div>
      {/* Page Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                backgroundColor: 'var(--info-bg)',
                color: 'var(--info-solid)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              System Configuration
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            Institutional Booking Settings
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Govern university lead times, approval escalation schedules, sound limits, and campus space policies.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Save}
          loading={loading}
          onClick={handleSave}
        >
          Save Configuration
        </Button>
      </div>

      {savedSuccess && (
        <div
          style={{
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--success-text)',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>System settings updated successfully and broadcast to all departments!</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Lead Time & Advance Booking */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Clock size={20} color="var(--coep-maroon-700)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Reservation Window & Lead Times
            </h3>
          </div>

          <div className="grid-cols-3">
            <Input
              label="Minimum Lead Time (Days)"
              type="number"
              min="1"
              max="30"
              required
              value={formData.minLeadTimeDays}
              onChange={(e) => handleFieldChange('minLeadTimeDays', Number(e.target.value))}
              hint="Minimum days in advance a student or club must submit a request."
            />

            <Input
              label="Maximum Advance Window (Days)"
              type="number"
              min="7"
              max="180"
              required
              value={formData.maxAdvanceDays}
              onChange={(e) => handleFieldChange('maxAdvanceDays', Number(e.target.value))}
              hint="How far into the future reservations may be booked."
            />

            <Input
              label="Auto-Escalate Window (Hours)"
              type="number"
              min="12"
              max="168"
              required
              value={formData.autoEscalateHours}
              onChange={(e) => handleFieldChange('autoEscalateHours', Number(e.target.value))}
              hint="Hours before pending request escalates to Registrar if unattended."
            />
          </div>

          <div className="grid-cols-2" style={{ marginTop: '12px' }}>
            <Input
              label="Campus Daily Opening Time"
              type="time"
              required
              value={formData.dailyOpeningTime}
              onChange={(e) => handleFieldChange('dailyOpeningTime', e.target.value)}
            />

            <Input
              label="Campus Daily Closing Curfew"
              type="time"
              required
              value={formData.dailyClosingTime}
              onChange={(e) => handleFieldChange('dailyClosingTime', e.target.value)}
              hint="All sound rigs and auditorium activities must terminate by this time."
            />
          </div>
        </div>

        {/* Section 2: Institutional Governance Toggles */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={20} color="var(--coep-maroon-700)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Approval Chain Enforcement Rules
            </h3>
          </div>

          <Toggle
            label="Require Faculty Advisor Endorsement for All Student Club Requests"
            description="Enforces mandatory Level 1 review by faculty mentor before request reaches department HOD."
            checked={formData.requireFacultyEndorsementForStudents}
            onChange={(val) => handleFieldChange('requireFacultyEndorsementForStudents', val)}
          />

          <Toggle
            label="Require Department Head (HOD) Approval for All Academic Seminar Complexes"
            description="Departmental seminar halls cannot be finalized by estate without HOD timetable clearance."
            checked={formData.requireHODApprovalForDeptVenues}
            onChange={(val) => handleFieldChange('requireHODApprovalForDeptVenues', val)}
          />

          <Toggle
            label="Allow Weekend & Sunday Reservations"
            description="Permits booking Boat Club Lawn, OAT, and Auditorium on Saturdays and Sundays."
            checked={formData.allowWeekendBooking}
            onChange={(val) => handleFieldChange('allowWeekendBooking', val)}
          />

          <Toggle
            label="Automated Security Gate Pass Dispatch (Email & SMS)"
            description="Immediately dispatches digital entry passes to Campus Security Gate No. 1 and No. 2 upon final Superadmin approval."
            checked={formData.autoNotifyEmail}
            onChange={(val) => handleFieldChange('autoNotifyEmail', val)}
          />
        </div>

        {/* Section 3: Terms and Conditions Policy */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <FileCheck size={20} color="var(--coep-maroon-700)" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--coep-navy-900)' }}>
              Institutional Terms & Sound Ordinance Text
            </h3>
          </div>

          <Textarea
            label="Statutory Terms Presented to Organizers at Booking Submission"
            rows={4}
            value={formData.termsAndConditions}
            onChange={(e) => handleFieldChange('termsAndConditions', e.target.value)}
            hint="Printed on official approval gate pass and booking confirmation PDFs."
          />
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Save}
            loading={loading}
          >
            Save All Booking Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

export default BookingSettingsPage;
