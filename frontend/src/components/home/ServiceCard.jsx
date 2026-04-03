export default function ServiceCard({ image, title, subtitle, variant = 'half' }) {
  const isWide = variant === 'wide'

  return (
    <article className={`zs-service-card zs-service-card--${variant}`}>
      <img src={image} alt="" className="zs-service-card__img" loading="lazy" />
      <div className="zs-service-card__scrim" />
      <div className={`zs-service-card__body ${isWide ? 'zs-service-card__body--center' : ''}`}>
        <h3 className="zs-service-card__title">{title}</h3>
        {subtitle && <p className="zs-service-card__sub">{subtitle}</p>}
        <div className="zs-service-card__actions">
          {isWide ? (
            <button type="button" className="zs-btn zs-btn--gold zs-btn--lg">
              More Detail
            </button>
          ) : (
            <button type="button" className="zs-btn zs-btn--glass">
              View detail
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
