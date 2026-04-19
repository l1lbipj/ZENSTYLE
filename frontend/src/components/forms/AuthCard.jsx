import Card from '../ui/Card'

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="zs-auth">
      <Card title={title} description={subtitle}>
        <div className="zs-auth__content">{children}</div>
        {footer && <div className="zs-auth__footer">{footer}</div>}
      </Card>
    </div>
  )
}
