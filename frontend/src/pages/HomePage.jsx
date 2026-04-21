import { Link, Navigate } from 'react-router-dom'
import Hero from '../components/home/Hero'
import BookingWidget from '../components/home/BookingWidget'
import ProductsSection from '../components/home/ProductsSection'
import PromotionSection from '../components/home/PromotionSection'
import ServicesSection from '../components/home/ServicesSection'
import ServiceDetailsSection from '../components/home/ServiceDetailsSection'
import ContactSection from '../components/home/ContactSection'
import '../styles/home.css'
import { useAuth } from '../context/useAuth'
import { Roles } from '../routes/roleConfig'
import { getRoleRedirectPath } from '../routes/roleRedirect'

export default function HomePage() {
  const { user } = useAuth()

  if (user?.role === Roles.ADMIN || user?.role === Roles.STAFF) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />
  }

  return (
    <div className="zs-page">
      <main className="zs-main">
        <Hero />
        {user?.role === Roles.CLIENT ? (
          <section className="zs-home-account" aria-label="My account shortcuts">
            <div className="zs-home-account__inner">
              <div>
                <p className="zs-home-account__eyebrow">My account</p>
                <h2 className="zs-home-account__title">Welcome back, {user.name || 'client'}</h2>
                <p className="zs-home-account__desc">
                  Go straight to your profile, appointments, and rewards without searching through the site.
                </p>
              </div>
              <div className="zs-home-account__actions">
                <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/client/profile">
                  My account
                </Link>
                <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/appointments">
                  My appointments
                </Link>
                <Link className="zs-btn zs-btn--ghost zs-btn--sm" to="/client/rewards">
                  Rewards
                </Link>
              </div>
            </div>
          </section>
        ) : null}
        <section className="zs-booking-section" aria-label="Quick booking">
          <div className="zs-booking-section__inner">
            <BookingWidget />
          </div>
        </section>
        <ProductsSection />
        <PromotionSection />
        <ServicesSection />
        <ServiceDetailsSection />
        <ContactSection />
      </main>
    </div>
  )
}