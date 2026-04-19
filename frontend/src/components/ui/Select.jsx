export default function Select({ label, options = [], className = '', ...props }) {
  return (
    <label className={`zs-field ${className}`.trim()}>
      {label && <span className="zs-field__label">{label}</span>}
      <select className="zs-select" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
