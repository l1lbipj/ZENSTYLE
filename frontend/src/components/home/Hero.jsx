import homeHero from '../../assets/home-hero.png'

export default function Hero() {
  return (
    <section className="zs-hero" style={{ '--hero-image': `url("${homeHero}")` }}>
      <div className="zs-hero__overlay">
        <div className="zs-hero__content-wrap">
          <div className="zs-hero__content">
            <h1 className="zs-hero__title">Find your ZenStyle</h1>
            <p className="zs-hero__lead">
              Step into a calm, modern space designed for focus and renewal. From tailored hair rituals to restorative
              skincare, every visit is shaped around your pace — quiet confidence, thoughtful care, and results you can
              feel.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
