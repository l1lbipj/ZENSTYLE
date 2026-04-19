export default function Card({ title, description, actions, children }) {
  return (
    <section className="zs-card">
      {(title || description || actions) && (
        <header className="zs-card__header">
          <div>
            {title && <h3 className="zs-card__title">{title}</h3>}
            {description && <p className="zs-card__description">{description}</p>}
          </div>
          {actions && <div className="zs-card__actions">{actions}</div>}
        </header>
      )}
      <div className="zs-card__body">{children}</div>
    </section>
  )
}
