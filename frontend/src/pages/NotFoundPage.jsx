import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="zs-page-state">
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Return to home</Link>
    </div>
  )
}
