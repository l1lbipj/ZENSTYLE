export default function Input({ label, hint, className = '', ...props }) {
  return (
    <label className={`zs-field ${className}`.trim()}>
      {label && <span className="zs-field__label">{label}</span>}
      <input className="zs-input" {...props} />
      {hint && <span className="zs-field__hint">{hint}</span>}
    </label>
  )
}
