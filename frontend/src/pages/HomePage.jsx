import { Navigate } from 'react-router-dom'
import Navbar from '../components/home/Navbar'
import Hero from '../components/home/Hero'
import BookingWidget from '../components/home/BookingWidget'
import ProductsSection from '../components/home/ProductsSection'
import PromotionSection from '../components/home/PromotionSection'
import ServicesSection from '../components/home/ServicesSection'
import ServiceDetailsSection from '../components/home/ServiceDetailsSection'
import ContactSection from '../components/home/ContactSection'
import Footer from '../components/home/Footer'
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
