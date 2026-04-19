import { Link } from 'react-router-dom'
import { services } from '../../data/services'

export default function ServiceDetailsSection() {
  return (
    <section className="zs-section zs-section--details" id="service-details">
      <div className="zs-section__shell">
        <header className="zs-section__header">
          <h2 className="zs-section__title">Service details</h2>
          <p className="zs-section__intro">
            Transparent pricing and time estimates so clients know exactly what to expect.
          </p>
        </header>
        <div className="zs-details-grid">
          {services.map((service) => (
            <article key={service.id} className="zs-detail-card">
              <img src={service.image} alt="" className="zs-detail-card__image" loading="lazy" />
              <div className="zs-detail-card__top">
                <h3>{service.title}</h3>
                <span className="zs-detail-card__price">{service.price}</span>
              </div>
              <p className="zs-detail-card__meta">{service.duration}</p>
              <p className="zs-detail-card__desc">{service.description}</p>
              <Link to={`/services/${service.id}`} className="zs-btn zs-btn--gold">
                View details
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
