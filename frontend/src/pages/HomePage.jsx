import { Link } from 'react-router-dom'
import logo from '../assets/logo.png'
import homeHero from '../assets/home-hero.png'
import homeHair from '../assets/home-hair.jpg'
import homeSpa from '../assets/register-in.jpg'
import '../styles/home.css'

const HomePage = () => {
  return (
    <div className="home-page">
      <header
        className="hero"
        style={{ '--hero-image': `url(${homeHero})` }}
      >
        <nav className="hero-nav">
          <div className="logo">
            <span className="logo-mark" aria-hidden="true">
              <img src={logo} alt="ZenStyle logo" />
            </span>
            <span className="logo-text">ZenStyle</span>
          </div>
          <ul className="hero-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#product">Product</a></li>
            <li><a href="#service">Service</a></li>
            <li><a href="#about">About ZenStyle</a></li>
            <li><a href="#booking">Booking</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          <div className="hero-actions">
            <button className="icon-button" aria-label="Cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2Zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2ZM6.2 6l.6 3h10.9l1.1-5H6.2Zm-1.2-2h15.4c.7 0 1.2.6 1.1 1.3l-1.6 7.3c-.1.6-.6 1-1.2 1H7.1l-.4 2h12.3v2H6.1c-.7 0-1.2-.6-1.1-1.3l1.2-6.7L4 4H2V2h3.2c.6 0 1 .4 1 .9Z" />
              </svg>
            </button>
            <button className="icon-button" aria-label="Notifications">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11c0-3.1-1.6-5.6-4.5-6.3V4c0-.8-.7-1.5-1.5-1.5S10.5 3.2 10.5 4v.7C7.6 5.4 6 7.9 6 11v5l-2 2v1h16v-1l-2-2Z" />
              </svg>
            </button>
            <Link className="login-button" to="/login">Login</Link>
          </div>
        </nav>

        <div className="hero-content" id="home">
          <div className="hero-text">
            <p className="hero-kicker">Find your</p>
            <h1>
              <span>Zen</span>
              <em>Style</em>
            </h1>
            <p className="hero-description">
              Discover a tranquil space where self-care meets serenity. At our salon, every
              experience is designed not only to enhance your outer beauty but also to nurture
              your inner confidence and radiance.
            </p>
          </div>
        </div>

        <div className="booking-card" id="booking">
          <div className="booking-field">
            <span>Select service</span>
            <select>
              <option>Choose your service</option>
            </select>
          </div>
          <div className="booking-field">
            <span>With specialist</span>
            <select>
              <option>Choose your specialist</option>
            </select>
          </div>
          <div className="booking-field">
            <span>Preferred date</span>
            <input type="text" placeholder="mm/dd/yy" />
          </div>
          <button className="booking-button">Check Availability</button>
        </div>
      </header>

      <section className="efficiency" id="service">
        <div className="efficiency-text">
          <h2>Where efficiency Meets Exceptional Care</h2>
          <p>
            With ZenStyle, every detail is thoughtfully managed - from booking to billing - ensuring
            a refined and stress-free journey for both salon owners and clients. It's more than
            just a system; it's a modern approach to salon success designed to enhance
            productivity, elevate service quality, and leave a lasting impression.
          </p>
        </div>
        <div className="efficiency-cards">
          <article className="service-card">
            <div className="service-image">
              <img src={homeHair} alt="Hair service" />
            </div>
            <h3>Hair</h3>
          </article>
          <article className="service-card">
            <div className="service-image">
              <img src={homeSpa} alt="Spa service" />
            </div>
            <h3>SPA</h3>
          </article>
        </div>
      </section>

      <section className="visit" id="contact">
        <div className="visit-info">
          <h2>Visit ZenStyle</h2>
          <ul>
            <li>
              <span className="info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7Zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5s2.5 1.1 2.5 2.5S13.4 11.5 12 11.5Z" />
                </svg>
              </span>
              13 Ly Tu Trong street, Ninh Kieu, Can Tho city, Viet Nam
            </li>
            <li>
              <span className="info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M6.6 10.8c1.5 2.9 3.8 5.2 6.7 6.7l2.2-2.2c.3-.3.8-.4 1.2-.2 1.3.5 2.7.8 4.2.8.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.1c.6 0 1 .4 1 1 0 1.5.3 2.9.8 4.2.1.4 0 .9-.3 1.2l-2 2.4Z" />
                </svg>
              </span>
              02923 877 654
            </li>
            <li>
              <span className="info-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm.8 4.5v4.1l3.2 1.9-.8 1.3-4-2.4V8.5h1.6Z" />
                </svg>
              </span>
              Mon - Fri: 8:30 AM - 8:30 PM
              <br />
              Sat - Sun: 9:00 AM - 6:00 PM
            </li>
          </ul>
        </div>
        <div className="visit-map">
          <div className="map-placeholder">Map</div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <span className="logo-mark" aria-hidden="true">
            <img src={logo} alt="ZenStyle logo" />
          </span>
          <span className="logo-text">ZENSTYLE</span>
        </div>
        <div className="footer-links">
          <span>Discover</span>
          <span>Support</span>
          <span>Connect</span>
        </div>
        <div className="footer-copy">(c) 2026 ZenStyle. All Right Reserved</div>
      </footer>
    </div>
  )
}

export default HomePage
