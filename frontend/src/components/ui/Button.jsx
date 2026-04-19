export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button className={`zs-btn zs-btn--${variant} zs-btn--${size} ${className}`.trim()} {...props} />
  )
}
