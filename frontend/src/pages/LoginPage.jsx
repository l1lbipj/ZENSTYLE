import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: 560, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)' }}>Login</h1>
      <p style={{ color: 'var(--text-muted)' }}>
        Authentication will connect here per project requirements. Return to{' '}
        <Link to="/">home</Link>.
      </p>
    </div>
  )
}
