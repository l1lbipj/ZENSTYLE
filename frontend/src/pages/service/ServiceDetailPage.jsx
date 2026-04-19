import { Link, useNavigate, useParams } from 'react-router-dom'
import { services } from '../../data/services'
import { useAuth } from '../../context/useAuth'
import '../../styles/service.css'

export default function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const service = services.find((item) => item.id === id) || services[0]

  const handleBook = () => {
    if (!user) {
      navigate('/login')
      return
    }
    if (user.role === 'client') {
      navigate('/client/book')
      return
    }
    // Staff/admin shouldn't book as client.
    navigate('/')
  }

  return (
    <section className="zs-service-detail">
      <div className="zs-service-detail__breadcrumbs">
        <Link to="/">Home</Link> / <Link to="/#service-details">Services</Link> / <span>{service.title}</span>
      </div>
      <div className="zs-service-detail__card zs-service-detail__card--compact">
        <img src={service.image} alt={service.title} className="zs-service-detail__image" />
        <div className="zs-service-detail__info">
          <div className="zs-service-detail__header">
            <div>
              <span className="zs-service-detail__category">{service.category}</span>
              <h1>{service.title}</h1>
              <p>{service.description}</p>
            </div>
          </div>
          <div className="zs-service-detail__meta">
            <span>{service.price}</span>
            <span>{service.duration}</span>
          </div>
          <div className="zs-service-detail__includes">
            <h3>Includes</h3>
            <ul>
              {service.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="zs-service-detail__actions">
            <button type="button" onClick={handleBook}>
              Book now
            </button>
            <button type="button" className="is-ghost">
              Ask a question
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
