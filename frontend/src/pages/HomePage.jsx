import Navbar from '../components/home/Navbar'
import Hero from '../components/home/Hero'
import BookingWidget from '../components/home/BookingWidget'
import ServicesSection from '../components/home/ServicesSection'
import ContactSection from '../components/home/ContactSection'
import Footer from '../components/home/Footer'
import '../styles/home.css'

export default function HomePage() {
  return (
    <div className="zs-page">
      <Navbar />
      <main className="zs-main">
        <Hero />
        <section className="zs-booking-section" aria-label="Quick booking">
          <div className="zs-booking-section__inner">
            <BookingWidget />
          </div>
        </section>
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
