export default function Section({ title, description, action, children }) {
  return (
    <section className="zs-section-block">
      {(title || description || action) && (
        <header className="zs-section-block__header">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p>{description}</p>}
          </div>
          {action && <div className="zs-section-block__action">{action}</div>}
        </header>
      )}
      <div className="zs-section-block__body">{children}</div>
    </section>
  )
}
