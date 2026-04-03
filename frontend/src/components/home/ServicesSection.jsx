import homeHair from '../../assets/home-hair.jpg'
import registerWarm from '../../assets/register-warm.png'
import loginBanner from '../../assets/login-banner.jpg'
import ServiceCard from './ServiceCard'

export default function ServicesSection() {
  return (
    <section className="zs-section zs-section--services" id="about">
      <div className="zs-section__shell" id="services">
        <header className="zs-section__header">
          <h2 className="zs-section__title">Where efficiency meets exceptional care</h2>
          <p className="zs-section__intro">
            ZenStyle brings scheduling, specialists, and service quality together so clients move smoothly from booking
            to checkout — less waiting, more time for craft. Explore our core experiences below.
          </p>
        </header>

        <div className="zs-services-grid">
          <ServiceCard image={homeHair} title="Hair" variant="half" />
          <ServiceCard image={registerWarm} title="Skins" variant="half" />
          <ServiceCard
            image={loginBanner}
            title="The Ritual of Beauty"
            subtitle="A full-room spa journey — steam, touch, and tailored botanicals."
            variant="wide"
          />
        </div>
      </div>
    </section>
  )
}
