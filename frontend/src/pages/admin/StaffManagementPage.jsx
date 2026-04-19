import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import staffApi from '../../Api/staffApi'

const columns = [
  { key: 'name', header: 'Staff member' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
]

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
    password: 'Staff@12345',
  })

  const loadData = () => {
    staffApi.getAll().then((res) => {
      const rows = res?.data?.data?.data || []
      setStaff(
        rows.map((item) => ({
          id: item.staff_id,
          name: item.staff_name,
          role: item.specialization,
          status: item.status,
          email: item.email,
          phone: item.phone,
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
        status: <Badge tone={item.status === 'active' ? 'success' : 'warning'}>{item.status}</Badge>,
      }))
  }, [query, status, staff])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', role: '', status: 'active', email: '', phone: '', password: 'Staff@12345' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      name: item.name,
      role: item.role,
      status: item.status,
      email: item.email || '',
      phone: item.phone || '',
      password: 'Staff@12345',
    })
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      staff_name: form.name,
      specialization: form.role,
      status: form.status,
      email: form.email,
      phone: form.phone,
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
          <input className="zs-input" placeholder="Full name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          <input className="zs-input" placeholder="Specialization" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} required />
          <input className="zs-input" placeholder="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <input className="zs-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} required />
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
