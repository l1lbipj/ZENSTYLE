import logo from '../../assets/logo.png'

export default function Footer() {
  return (
    <footer className="zs-footer">
      <div className="zs-footer__grid">
        <div className="zs-footer__brand-block">
          <img src={logo} alt="" className="zs-footer__logo" width={160} height={64} />
          <p className="zs-footer__tagline">
            ZENSTYLE SALON - modern cuts, restorative skin rituals, and calm service in the heart of the city.
          </p>
        </div>
        <div>
          <h3 className="zs-footer__heading">Support</h3>
          <ul className="zs-footer__links">
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                Facebook
              </a>
            </li>
            <li>
              <a href="/#contact">Contact</a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="zs-footer__heading">Connect</h3>
          <ul className="zs-footer__links">
            <li>
              <a href="https://instagram.com" target="_blank" rel="noreferrer">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://facebook.com" target="_blank" rel="noreferrer">
                Facebook
              </a>
            </li>
          </ul>
        </div>
      </div>
      <p className="zs-footer__copy">(c) {new Date().getFullYear()} ZenStyle Salon. All rights reserved.</p>
    </footer>
  )
}
