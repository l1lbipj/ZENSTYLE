import homeHair from '../../assets/home-hair.jpg'
import registerWarm from '../../assets/register-warm.png'
import recoveryPic from '../../assets/recovery-pic.png'
import registerIn from '../../assets/register-in.jpg'
import { Link } from 'react-router-dom'

const products = [
  {
    title: 'Botanical Repair Oil',
    description: 'Lightweight blend to smooth and protect color-treated hair.',
    image: homeHair,
  },
  {
    title: 'Hydra Skin Mist',
    description: 'Daily hydration mist with calming lavender and aloe.',
    image: registerWarm,
  },
  {
    title: 'Restorative Scalp Serum',
    description: 'Balances scalp oils and supports healthy growth.',
    image: recoveryPic,
  },
  {
    title: 'Signature Glow Cream',
    description: 'Rich moisturizer for long-lasting softness and glow.',
    image: registerIn,
  },
]

export default function ProductsSection() {
  return (
    <section className="zs-section zs-section--products" id="products">
      <div className="zs-section__shell">
        <header className="zs-section__header">
          <h2 className="zs-section__title">Featured products</h2>
          <p className="zs-section__intro">
            Curated treatments you can take home. Clean formulas with salon-grade performance.
          </p>
        </header>
        <div className="zs-products-grid">
          {products.map((product) => (
            <article key={product.title} className="zs-product-card">
              <img src={product.image} alt="" className="zs-product-card__image" loading="lazy" />
              <div className="zs-product-card__body">
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <Link to="/products" className="zs-btn zs-btn--primary">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
