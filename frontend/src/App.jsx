import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RecoveryEmailPage from './pages/RecoveryEmailPage'
import RecoveryOtpPage from './pages/RecoveryOtpPage'
import RecoveryResetPage from './pages/RecoveryResetPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<RecoveryEmailPage />} />
        <Route path="/forgot-otp" element={<RecoveryOtpPage />} />
        <Route path="/reset-password" element={<RecoveryResetPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
