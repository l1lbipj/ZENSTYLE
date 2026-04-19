function IconPin() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-10a7 7 0 1 0-14 0c0 5.65 7 10 7 10z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  )
}

function IconPhone() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 16.92v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.11a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export default function ContactSection() {
  return (
    <section className="zs-contact" id="contact">
      <div className="zs-contact__inner">
        <div className="zs-contact__info">
          <h2 className="zs-contact__title">Visit ZenStyle</h2>
          <ul className="zs-contact__list">
            <li>
              <span className="zs-contact__icon">
                <IconPin />
              </span>
              <span>1 Ly Tu Trong, An Phu Ward, Can Tho City</span>
            </li>
            <li>
              <span className="zs-contact__icon">
                <IconPhone />
              </span>
              <a href="tel:+842812345678">+84 28 1234 5678</a>
            </li>
            <li>
              <span className="zs-contact__icon">
                <IconClock />
              </span>
              <span>Mon-Sat 9:00-20:00 · Sun 10:00-18:00</span>
            </li>
          </ul>
        </div>
        <div className="zs-contact__map-wrap">
          <iframe
            title="ZenStyle on map"
            className="zs-contact__map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=105.7550%2C10.0110%2C105.7700%2C10.0210&layer=mapnik&marker=10.0160%2C105.7625"
          />
        </div>
      </div>
    </section>
  )
}


