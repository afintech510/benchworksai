'use client';

import type { DiscoveryField, RangeRow, SubField } from '@/lib/reports/discovery';

// Generic field renderer. One switch drives all 14 field types. Every field is
// described by the schema; nothing here is client-specific.
//
// Value shapes (kept consistent so the API/email can parse them):
//   text, textarea, number, percent, currency, tel, email, date, select, radio
//                       -> string
//   multiselect, checkgrid                -> string[]
//   repeater  -> Array<Record<subfieldId, string | string[]>>
//   rangegrid -> Record<rowId, { low: string; high: string }>

export type FieldValue =
  | string
  | string[]
  | Array<Record<string, unknown>>
  | Record<string, { low: string; high: string }>
  | undefined;

interface FieldProps {
  field: DiscoveryField;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  /** Show a required error for this field (complete-submit validation). */
  invalid?: boolean;
}

/** Text-like input types that share a simple <input>. */
const INPUT_TYPE: Partial<Record<DiscoveryField['type'], string>> = {
  text: 'text',
  number: 'number',
  percent: 'text',
  currency: 'text',
  tel: 'tel',
  email: 'email',
  date: 'date',
};

const INPUT_MODE: Partial<
  Record<DiscoveryField['type'], 'text' | 'numeric' | 'decimal' | 'tel' | 'email'>
> = {
  number: 'numeric',
  percent: 'numeric',
  currency: 'decimal',
  tel: 'tel',
  email: 'email',
};

export function Field({ field, value, onChange, invalid }: FieldProps) {
  const fieldId = `f-${field.id}`;
  const helpId = field.help ? `${fieldId}-help` : undefined;

  return (
    <div className="df-field" data-invalid={invalid ? 'true' : undefined}>
      {field.label && (
        <label className="df-label" htmlFor={fieldId}>
          <span>{field.label}</span>
          {field.required ? (
            <span className="df-req" aria-hidden="true">
              *
            </span>
          ) : field.optional ? (
            <span className="df-opt">optional</span>
          ) : null}
        </label>
      )}
      {field.help && (
        <p className="df-help" id={helpId}>
          {field.help}
        </p>
      )}

      <Control
        field={field}
        fieldId={fieldId}
        helpId={helpId}
        value={value}
        onChange={onChange}
      />

      {invalid && (
        <p className="df-error" role="alert">
          This one&apos;s required.
        </p>
      )}
    </div>
  );
}

interface ControlProps {
  field: DiscoveryField;
  fieldId: string;
  helpId?: string;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
}

function Control({ field, fieldId, helpId, value, onChange }: ControlProps) {
  switch (field.type) {
    case 'textarea': {
      const rows = typeof field.rows === 'number' ? field.rows : 4;
      return (
        <textarea
          id={fieldId}
          className="df-input df-textarea"
          rows={rows}
          placeholder={field.placeholder}
          aria-describedby={helpId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }

    case 'select': {
      return (
        <select
          id={fieldId}
          className="df-input df-select"
          aria-describedby={helpId}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    case 'radio': {
      const current = typeof value === 'string' ? value : '';
      return (
        <div className="df-radio-group" role="radiogroup" aria-describedby={helpId}>
          {(field.options ?? []).map((opt) => (
            <label key={opt} className="df-radio">
              <input
                type="radio"
                name={fieldId}
                value={opt}
                checked={current === opt}
                onChange={() => onChange(opt)}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'multiselect': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="df-check-group" aria-describedby={helpId}>
          {(field.options ?? []).map((opt) => {
            const checked = arr.includes(opt);
            return (
              <label key={opt} className="df-check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange(
                      checked ? arr.filter((v) => v !== opt) : [...arr, opt]
                    )
                  }
                />
                <span>{opt}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case 'checkgrid': {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="df-checkgrid" aria-describedby={helpId}>
          {(field.groups ?? []).map((grp) => (
            <fieldset key={grp.label} className="df-checkgrid-group">
              <legend className="df-checkgrid-legend">{grp.label}</legend>
              <div className="df-check-group">
                {grp.options.map((opt) => {
                  const checked = arr.includes(opt);
                  return (
                    <label key={opt} className="df-check">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          onChange(
                            checked
                              ? arr.filter((v) => v !== opt)
                              : [...arr, opt]
                          )
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      );
    }

    case 'repeater': {
      const entries = Array.isArray(value)
        ? (value as Array<Record<string, unknown>>)
        : [];
      const subfields = field.subfields ?? [];
      const max = field.max ?? Infinity;

      const update = (idx: number, subId: string, v: unknown) => {
        const next = entries.map((e, i) =>
          i === idx ? { ...e, [subId]: v } : e
        );
        onChange(next);
      };
      const add = () => onChange([...entries, {}]);
      const remove = (idx: number) =>
        onChange(entries.filter((_, i) => i !== idx));

      return (
        <div className="df-repeater" aria-describedby={helpId}>
          {entries.map((entry, idx) => (
            <div key={idx} className="df-repeater-item">
              <div className="df-repeater-head">
                <span className="df-repeater-num">#{idx + 1}</span>
                <button
                  type="button"
                  className="df-repeater-remove"
                  onClick={() => remove(idx)}
                >
                  Remove
                </button>
              </div>
              {subfields.map((sf) => (
                <SubfieldControl
                  key={sf.id}
                  subfield={sf}
                  parentId={`${fieldId}-${idx}`}
                  value={entry[sf.id]}
                  onChange={(v) => update(idx, sf.id, v)}
                />
              ))}
            </div>
          ))}
          {entries.length < max && (
            <button type="button" className="df-add" onClick={add}>
              {field.addLabel ?? 'Add another'}
            </button>
          )}
        </div>
      );
    }

    case 'rangegrid': {
      const rows: RangeRow[] = Array.isArray(field.rows)
        ? (field.rows as RangeRow[])
        : [];
      const cols = field.columns ?? ['Low', 'High'];
      const obj =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, { low: string; high: string }>)
          : {};

      const setCell = (rowId: string, key: 'low' | 'high', v: string) => {
        const prev = obj[rowId] ?? { low: '', high: '' };
        onChange({ ...obj, [rowId]: { ...prev, [key]: v } });
      };

      return (
        <div className="df-rangegrid" aria-describedby={helpId}>
          {rows.map((row) => {
            const cell = obj[row.id] ?? { low: '', high: '' };
            return (
              <div key={row.id} className="df-rangegrid-row">
                <div className="df-rangegrid-label">
                  {row.label}
                  {row.unit && (
                    <span className="df-rangegrid-unit">{row.unit}</span>
                  )}
                </div>
                <div className="df-rangegrid-cells">
                  <label className="df-rangegrid-cell">
                    <span className="df-rangegrid-colname">{cols[0]}</span>
                    <span className="df-affix df-affix-currency">
                      <span className="df-prefix">$</span>
                      <input
                        className="df-input"
                        inputMode="decimal"
                        value={cell.low}
                        onChange={(e) => setCell(row.id, 'low', e.target.value)}
                      />
                    </span>
                  </label>
                  <label className="df-rangegrid-cell">
                    <span className="df-rangegrid-colname">{cols[1]}</span>
                    <span className="df-affix df-affix-currency">
                      <span className="df-prefix">$</span>
                      <input
                        className="df-input"
                        inputMode="decimal"
                        value={cell.high}
                        onChange={(e) => setCell(row.id, 'high', e.target.value)}
                      />
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Text-like inputs: text, number, percent, currency, tel, email, date
    default: {
      const type = INPUT_TYPE[field.type] ?? 'text';
      const inputMode = INPUT_MODE[field.type];
      const str = typeof value === 'string' ? value : '';
      const isCurrency = field.type === 'currency';
      const isPercent = field.type === 'percent';

      const input = (
        <input
          id={fieldId}
          className="df-input"
          type={type}
          inputMode={inputMode}
          placeholder={field.placeholder}
          aria-describedby={helpId}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );

      if (isCurrency) {
        return (
          <span className="df-affix df-affix-currency">
            <span className="df-prefix">$</span>
            {input}
          </span>
        );
      }
      if (isPercent) {
        return (
          <span className="df-affix df-affix-percent">
            {input}
            <span className="df-suffix">%</span>
          </span>
        );
      }
      return input;
    }
  }
}

// Repeater subfields reuse the same control primitives but only ever hold a
// string (or string[] for multiselect) — no nested repeaters/grids.
function SubfieldControl({
  subfield,
  parentId,
  value,
  onChange,
}: {
  subfield: SubField;
  parentId: string;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const asField: DiscoveryField = {
    id: `${parentId}-${subfield.id}`,
    label: subfield.label,
    type: subfield.type,
    options: subfield.options,
    placeholder: subfield.placeholder,
    optional: subfield.optional,
    required: subfield.required,
    help: subfield.help,
  };
  return (
    <Field
      field={asField}
      value={value as FieldValue}
      onChange={(v) => onChange(v)}
    />
  );
}
