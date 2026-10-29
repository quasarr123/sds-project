import React, { useState, useMemo } from 'react';
import {
  FileText,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Table } from '../components/common/Table';
import { Modal } from '../components/common/Modal';

export function AuditLogPage({ auditLogs = [] }) {
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [inspectLog, setInspectLog] = useState(null);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (roleFilter !== 'ALL' && log.role !== roleFilter) return false;
      if (actionFilter !== 'ALL' && log.action !== actionFilter) return false;
      return true;
    });
  }, [auditLogs, roleFilter, actionFilter]);

  const columns = [
    {
      title: 'Timestamp & Log ID',
      key: 'timestamp',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '13px' }}>{row.timestamp}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {row.id}
          </div>
        </div>
      ),
    },
    {
      title: 'Actor & Role',
      key: 'actor',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--coep-navy-900)' }}>{row.actor}</div>
          <span
            style={{
              fontSize: '11px',
              textTransform: 'capitalize',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 'var(--radius-full)',
              backgroundColor:
                row.role === 'superadmin'
                  ? 'var(--danger-bg)'
                  : row.role === 'hod'
                  ? 'var(--purple-bg)'
                  : row.role === 'faculty'
                  ? 'var(--warning-bg)'
                  : 'var(--info-bg)',
              color:
                row.role === 'superadmin'
                  ? 'var(--danger-text)'
                  : row.role === 'hod'
                  ? 'var(--purple-text)'
                  : row.role === 'faculty'
                  ? 'var(--warning-text)'
                  : 'var(--info-text)',
            }}
          >
            {row.role}
          </span>
        </div>
      ),
    },
    {
      title: 'Action Performed',
      key: 'action',
      sortable: true,
      render: (val) => (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--coep-maroon-700)',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      title: 'Target Entity',
      key: 'target',
      render: (val) => <span style={{ fontWeight: 500, fontSize: '13px' }}>{val}</span>,
    },
    {
      title: 'Client IP / Network',
      key: 'ipAddress',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {val}
        </span>
      ),
    },
    {
      title: 'Result',
      key: 'status',
      render: (val) => {
        const isSuccess = val === 'SUCCESS';
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 700,
              color: isSuccess ? 'var(--success-solid)' : 'var(--warning-solid)',
            }}
          >
            {isSuccess ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
            {val}
          </span>
        );
      },
    },
    {
      title: 'Action',
      key: 'inspect',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setInspectLog(row)}
          title="Inspect Audit Event"
        >
          <Eye size={14} />
          <span>Inspect</span>
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* Title */}
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
                backgroundColor: 'var(--purple-bg)',
                color: 'var(--purple-text)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Tamper-evident Security Log
            </span>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--coep-navy-900)' }}>
            Institutional System Audit Logs
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Cryptographically sealed chronological log of all approval decisions, cancellations, lockouts, and setting changes.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={Download}
          size="sm"
          onClick={() => alert('Downloading official COEP Audit Certificate (JSON)...')}
        >
          Export Log File
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '14px 18px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
          <Filter size={15} />
          <span>Filter Logs:</span>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="coep-select"
          style={{ width: '170px', padding: '6px 12px', fontSize: '13px' }}
        >
          <option value="ALL">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="hod">HOD</option>
          <option value="superadmin">Superadmin</option>
        </select>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="coep-select"
          style={{ width: '220px', padding: '6px 12px', fontSize: '13px' }}
        >
          <option value="ALL">All Action Types</option>
          <option value="BOOKING_APPROVED">BOOKING_APPROVED</option>
          <option value="BOOKING_SUBMITTED">BOOKING_SUBMITTED</option>
          <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
          <option value="BOOKING_REJECTED">BOOKING_REJECTED</option>
          <option value="BLOCKED_DATE_ADDED">BLOCKED_DATE_ADDED</option>
          <option value="SETTINGS_UPDATED">SETTINGS_UPDATED</option>
          <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
        </select>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: 'var(--text-tertiary)' }}>
          Showing <strong>{filteredLogs.length}</strong> log entries
        </span>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={filteredLogs}
        searchKeys={['actor', 'action', 'target', 'details', 'id', 'ipAddress']}
        searchPlaceholder="Search audit trails by actor, IP, or target..."
        emptyTitle="No Audit Records Found"
        emptyMessage="No system events match the selected criteria."
      />

      {/* Inspect Log Modal */}
      {inspectLog && (
        <Modal
          isOpen={Boolean(inspectLog)}
          onClose={() => setInspectLog(null)}
          title={`Audit Payload: ${inspectLog.id}`}
          size="md"
        >
          <div>
            <div style={{ padding: '14px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: 'var(--coep-maroon-700)' }}>
                  {inspectLog.action}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{inspectLog.timestamp}</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--coep-navy-900)', marginTop: '6px' }}>
                Actor: {inspectLog.actor} ({inspectLog.role})
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                Client IP: {inspectLog.ipAddress}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Event Log Details:
              </label>
              <div style={{ padding: '12px', background: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-primary)', marginTop: '4px', lineHeight: 1.5 }}>
                {inspectLog.details}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                Target Entity:
              </label>
              <div style={{ padding: '8px 12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                {inspectLog.target}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <Button variant="secondary" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AuditLogPage;
