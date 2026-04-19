import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import staffApi from '../../Api/staffApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'

const columns = [
  { key: 'image', header: 'Image' },
  { key: 'name', header: 'Staff member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
]

function getApiErrorMessage(err, fallback) {
  const fieldErrors = err?.response?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldErrors = Object.values(fieldErrors).find((messages) => Array.isArray(messages) && messages.length)
    if (firstFieldErrors) return firstFieldErrors[0]
  }

  return err?.response?.data?.message || fallback
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([])
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '',
    role: '',
    status: 'active',
    email: '',
    phone: '',
    dob: '',
    image_data: '',
    password: 'Staff@12345',
  })
  const [error, setError] = useState('')

  const loadData = () => {
    staffApi.getAll().then((res) => {
      const rows = res?.data?.data?.data || []
      setStaff(
        rows.map((item) => ({
          id: item.staff_id,
          imageData: item.image_data || '',
          name: item.staff_name,
          role: item.specialization,
          status: item.status,
          email: item.email,
          phone: item.phone,
          dob: item.dob || '',
        })),
      )
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return staff
      .filter((item) => (status === 'all' ? true : item.status === status))
      .filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({
        ...item,
        image: (
          <img
            src={getEntityImage({ image_data: item.imageData }, 'https://ui-avatars.com/api/?name=Staff')}
            alt={item.name}
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 12 }}
          />
        ),
        raw: item,
        status: <Badge tone={item.status === 'active' ? 'success' : 'warning'}>{item.status}</Badge>,
      }))
  }, [query, status, staff])

  const openCreate = () => {
    setEditing(null)
    setError('')
    setForm({ name: '', role: '', status: 'active', email: '', phone: '', dob: '', image_data: '', password: 'Staff@12345' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    const source = item.raw || item
    setEditing(item)
    setError('')
    setForm({
      name: source.name,
      role: source.role,
      status: source.status,
      email: source.email || '',
      phone: source.phone || '',
      dob: source.dob || '',
      image_data: source.imageData || '',
      password: 'Staff@12345',
    })
    setModalOpen(true)
  }

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const image_data = await fileToDataUrl(file)
      setForm((prev) => ({ ...prev, image_data }))
      setError('')
    } catch (err) {
      setError(err.message || 'Unable to read image.')
    } finally {
      event.target.value = ''
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')
    const payload = {
      staff_name: form.name,
      specialization: form.role,
      status: form.status,
      email: form.email,
      phone: form.phone,
      dob: form.dob || null,
      image_data: form.image_data || null,
    }

    const action = editing
      ? staffApi.update(editing.id, payload)
      : staffApi.create({
          ...payload,
          password: form.password,
          password_confirmation: form.password,
        })

    action.then(() => {
      setModalOpen(false)
      loadData()
    })
      .catch((err) => setError(getApiErrorMessage(err, 'Unable to save staff.')))
  }

  const removeStaff = (id) => {
    staffApi.delete(id).then(() => loadData())
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Staff management" subtitle="Manage team availability, roles, and performance." />
      <Section
        title="Staff directory"
        description="Track headcount, assignments, and activity status."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Add staff
          </button>
        }
      >
        <div className="zs-toolbar">
          <input
            className="zs-input zs-toolbar__input"
            placeholder="Search staff..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="zs-toolbar__filters">
            {['all', 'active', 'inactive'].map((item) => (
              <button
                key={item}
                type="button"
                className={`zs-chip ${status === item ? 'is-active' : ''}`}
                onClick={() => setStatus(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          actionsLabel="Manage"
          renderActions={(row) => (
            <div className="zs-table__actions">
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>
                Edit
              </button>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => removeStaff(row.id)}>
                Delete
              </button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit staff' : 'Add staff'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          {error ? <p className="zs-alert zs-alert--error">{error}</p> : null}
          <input className="zs-input" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="zs-input" placeholder="Specialization" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} required />
          <input className="zs-input" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <input className="zs-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
          <input className="zs-input" type="date" value={form.dob} onChange={(e) => setForm((p) => ({ ...p, dob: e.target.value }))} />
          <label className="zs-field">
            <span className="zs-field__label">Staff image</span>
            <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
          </label>
          {form.image_data ? (
            <div>
              <img src={form.image_data} alt="Staff preview" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 16, marginBottom: 8 }} />
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setForm((p) => ({ ...p, image_data: null }))}>Remove image</button>
            </div>
          ) : null}
          {!editing ? (
            <input className="zs-input" placeholder="Password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} required />
          ) : null}
          <select className="zs-select" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
