import registerWarm from '../../assets/register-warm.png'
import { Link } from 'react-router-dom'

export default function PromotionSection() {
  return (
    <section className="zs-section zs-section--promo" id="promotions">
      <div className="zs-section__shell zs-section__shell--promo">
        <div className="zs-promo">
          <div className="zs-promo__content">
            <p className="zs-promo__eyebrow">April promotion</p>
            <h2 className="zs-section__title">Mid-season reset</h2>
            <p className="zs-section__intro">
              Refresh your routine with a full hair + skin reset. Book any signature service and receive a complimentary
              take-home ritual kit crafted for calm, shine, and long-lasting glow.
            </p>
            <div className="zs-promo__meta">
              <span className="zs-promo__pill">Save 20% on ritual pairings</span>
              <span className="zs-promo__pill">Complimentary aroma blend</span>
              <span className="zs-promo__pill">Valid until April 30</span>
            </div>
            <div className="zs-promo__actions">
              <Link className="zs-btn zs-btn--gold" to="/products">
                Explore
              </Link>
              <Link className="zs-btn zs-btn--primary" to="/products">
                Shop the set
              </Link>
            </div>
          </div>
          <div className="zs-promo__media">
            <img src={registerWarm} alt="" loading="lazy" />
            <span className="zs-promo__badge">Limited time</span>
          </div>
        </div>
      </div>
    </section>
  )
}
