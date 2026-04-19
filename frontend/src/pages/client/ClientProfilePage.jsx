import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import businessApi from '../../Api/businessApi'

export default function ClientProfilePage() {
  const [form, setForm] = useState({
    client_name: '',
    email: '',
    phone: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true
    businessApi
      .myProfile()
      .then((res) => {
        if (!mounted) return
        const user = res?.data?.data?.user || {}
        setForm({
          client_name: user.client_name || '',
          email: user.email || '',
          phone: user.phone || '',
        })
      })
      .catch(() => {
        if (!mounted) return
        setMessage('Unable to load profile.')
      })

    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setMessage('')
    businessApi
      .updateMyProfile(form)
      .then(() => setMessage('Profile updated successfully.'))
      .catch((err) => setMessage(err?.response?.data?.message || 'Failed to update profile.'))
  }

  return (
    <Card title="Profile" description="Update your personal details.">
      {message ? <p>{message}</p> : null}
      <form className="zs-form" onSubmit={handleSubmit}>
        <Input label="Full name" value={form.client_name} onChange={(e) => setForm((p) => ({ ...p, client_name: e.target.value }))} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        <Button type="submit">Save changes</Button>
      </form>
    </Card>
  )
}
