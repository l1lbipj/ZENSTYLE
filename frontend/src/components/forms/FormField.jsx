import { useId } from 'react'

function FieldShell({ label, required, hint, error, hintId, errorId, children }) {
  return (
    <label className="zs-field">
      <div className="zs-field__head">
        <span className="zs-field__label">
          {label}
          {required ? <span className="zs-field__required" aria-hidden> *</span> : null}
        </span>
      </div>
      {children}
      {hint ? (
        <span className="zs-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="zs-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function InputField({ label, required, hint, error, className = '', id, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <FieldShell label={label} required={required} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <input
        id={inputId}
        className={`zs-input ${error ? 'is-invalid' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
    </FieldShell>
  )
}

export function TextAreaField({ label, required, hint, error, className = '', id, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <FieldShell label={label} required={required} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <textarea
        id={inputId}
        className={`zs-textarea ${error ? 'is-invalid' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
    </FieldShell>
  )
}

export function SelectField({ label, required, hint, error, options = [], className = '', id, children, ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  const hintId = hint ? `${inputId}-hint` : undefined
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <FieldShell label={label} required={required} hint={hint} hintId={hintId} error={error} errorId={errorId}>
      <select
        id={inputId}
        className={`zs-select ${error ? 'is-invalid' : ''} ${className}`.trim()}
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {children}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  )
}

export function FormSection({ title, description, action, children }) {
  return (
    <section className="zs-form-section">
      {(title || description || action) && (
        <header className="zs-form-section__header">
          <div>
            {title ? <h3>{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {action ? <div className="zs-form-section__action">{action}</div> : null}
        </header>
      )}
      <div className="zs-form-section__body">{children}</div>
    </section>
  )
}

export function FormActions({ primaryLabel, secondaryLabel = 'Cancel', onSecondary, primaryProps = {}, secondaryProps = {}, align = 'start' }) {
  return (
    <div className={`zs-form-actions zs-form-actions--${align}`}>
      <button type="submit" className="zs-btn zs-btn--primary" {...primaryProps}>
        {primaryLabel}
      </button>
      <button type="button" className="zs-btn zs-btn--ghost" onClick={onSecondary} {...secondaryProps}>
        {secondaryLabel}
      </button>
    </div>
  )
}

export function CheckboxGrid({ label, hint, error, children }) {
  return (
    <div className="zs-field">
      <div className="zs-field__head">
        <span className="zs-field__label">{label}</span>
      </div>
      <div className="zs-checkbox-grid">{children}</div>
      {hint ? <span className="zs-field__hint">{hint}</span> : null}
      {error ? <span className="zs-field__error" role="alert">{error}</span> : null}
    </div>
  )
}

export function MultiSelect({ label, required, hint, error, options = [], value = [], onChange, id }) {
  const generatedId = useId()
  const groupId = id || generatedId
  const hintId = hint ? `${groupId}-hint` : undefined
  const errorId = error ? `${groupId}-error` : undefined

  const toggleValue = (nextValue) => {
    const normalized = Number.isNaN(Number(nextValue)) ? nextValue : Number(nextValue)
    if (!onChange) return
    if (value.includes(normalized)) {
      onChange(value.filter((item) => item !== normalized))
      return
    }
    onChange([...value, normalized])
  }

  return (
    <div className="zs-field">
      <div className="zs-field__head">
        <span className="zs-field__label" id={groupId}>
          {label}
          {required ? <span className="zs-field__required" aria-hidden> *</span> : null}
        </span>
      </div>
      <div className="zs-checkbox-grid" role="group" aria-labelledby={groupId}>
        {options.map((option) => {
          const selected = value.includes(option.value)
          return (
            <label key={option.value} className={`zs-choice-card zs-choice-card--multi ${selected ? 'is-active' : ''}`}>
              <input type="checkbox" checked={selected} onChange={() => toggleValue(option.value)} />
              <span>
                <strong>{option.label}</strong>
                {option.description ? <small>{option.description}</small> : null}
              </span>
            </label>
          )
        })}
      </div>
      {hint ? (
        <span className="zs-field__hint" id={hintId}>
          {hint}
        </span>
      ) : null}
      {error ? (
        <span className="zs-field__error" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </div>
  )
}

export function ChoiceCard({ checked, children, ...props }) {
  return (
    <label className={`zs-choice-card ${checked ? 'is-active' : ''}`}>
      <input type="checkbox" checked={checked} {...props} />
      <span>{children}</span>
    </label>
  )
}
