import { Link } from 'react-router-dom'

export default function ServiceCard({ image, title, subtitle, variant = 'half', to = '/#service-details' }) {
  const isWide = variant === 'wide'
  const isInternal = to.startsWith('/')
  const ActionTag = isInternal ? Link : 'a'
  const actionProps = isInternal ? { to } : { href: to }

  return (
    <article className={`zs-service-card zs-service-card--${variant}`}>
      <img src={image} alt="" className="zs-service-card__img" loading="lazy" />
      <div className="zs-service-card__scrim" />
      <div className={`zs-service-card__body ${isWide ? 'zs-service-card__body--center' : ''}`}>
        <h3 className="zs-service-card__title">{title}</h3>
        {subtitle && <p className="zs-service-card__sub">{subtitle}</p>}
        <div className="zs-service-card__actions">
          {isWide ? (
            <ActionTag {...actionProps} className="zs-btn zs-btn--gold zs-btn--lg">
              More Detail
            </ActionTag>
          ) : (
            <ActionTag {...actionProps} className="zs-btn zs-btn--glass">
              View detail
            </ActionTag>
          )}
        </div>
      </div>
    </article>
  )
}
