import { Outlet } from 'react-router-dom'
import Navbar from '../components/home/Navbar'
import Footer from '../components/home/Footer'
import '../styles/public.css'

export default function PublicLayout() {
  return (
    <div className="zs-public">
      <Navbar />
      <main className="zs-public__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
