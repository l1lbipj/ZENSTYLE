export default function Badge({ tone = 'neutral', children }) {
  return <span className={`zs-badge zs-badge--${tone}`}>{children}</span>
}
