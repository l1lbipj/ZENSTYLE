export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="zs-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="zs-page-header__action">{action}</div>}
    </div>
  )
}
