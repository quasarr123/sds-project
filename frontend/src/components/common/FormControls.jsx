import React from 'react';

export function Input({
  label,
  id,
  error,
  hint,
  required,
  className = '',
  type = 'text',
  icon: Icon,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`coep-form-group ${className}`}>
      {label && (
        <label htmlFor={inputId} className={`coep-label ${required ? 'coep-label-required' : ''}`}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {Icon && (
          <span style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
            <Icon size={16} />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          className={`coep-input ${error ? 'coep-input-error' : ''}`}
          style={Icon ? { paddingLeft: '38px' } : {}}
          {...props}
        />
      </div>
      {error && <span className="coep-form-error">{error}</span>}
      {hint && !error && <span className="coep-form-hint">{hint}</span>}
    </div>
  );
}

export function Select({
  label,
  id,
  options = [],
  error,
  hint,
  required,
  className = '',
  placeholder = 'Select an option',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`coep-form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className={`coep-label ${required ? 'coep-label-required' : ''}`}>
          {label}
        </label>
      )}
      <select id={selectId} className={`coep-select ${error ? 'coep-input-error' : ''}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {error && <span className="coep-form-error">{error}</span>}
      {hint && !error && <span className="coep-form-hint">{hint}</span>}
    </div>
  );
}

export function Textarea({
  label,
  id,
  error,
  hint,
  required,
  rows = 3,
  className = '',
  ...props
}) {
  const areaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`coep-form-group ${className}`}>
      {label && (
        <label htmlFor={areaId} className={`coep-label ${required ? 'coep-label-required' : ''}`}>
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        rows={rows}
        className={`coep-textarea ${error ? 'coep-input-error' : ''}`}
        {...props}
      />
      {error && <span className="coep-form-error">{error}</span>}
      {hint && !error && <span className="coep-form-hint">{hint}</span>}
    </div>
  );
}

export function Toggle({ label, id, checked, onChange, description }) {
  const toggleId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <label htmlFor={toggleId} style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', cursor: 'pointer' }}>
          {label}
        </label>
        {description && <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{description}</p>}
      </div>
      <input
        type="checkbox"
        id={toggleId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          width: '42px',
          height: '24px',
          accentColor: 'var(--coep-maroon-700)',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}
