import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import { formatUSD } from '../../utils/money'

const columns = [
  { key: 'service', header: 'Service' },
  { key: 'duration', header: 'Duration' },
  { key: 'price', header: 'Price' },
  { key: 'category', header: 'Category' },
]

export default function ServiceManagementPage() {
  const [services, setServices] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ service: '', duration: '', price: '', category_id: '' })

  const loadData = () => {
    businessApi.services({ per_page: 100 }).then((res) => {
      const rows = res?.data?.data?.data || []
      setServices(
        rows.map((item) => ({
          id: item.service_id,
          service: item.service_name,
          duration: `${item.duration} min`,
          price: formatUSD(item.price || 0, { from: 'VND' }),
          category: item.category?.category_name || `#${item.category_id}`,
          raw: item,
        })),
      )
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return services.filter((item) => item.service.toLowerCase().includes(query.toLowerCase()))
  }, [query, services])

  const openCreate = () => {
    setEditing(null)
    setForm({ service: '', duration: '', price: '', category_id: '1' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      service: item.raw.service_name,
      duration: String(item.raw.duration),
      price: String(item.raw.price),
      category_id: String(item.raw.category_id),
    })
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      service_name: form.service,
      duration: Number(form.duration),
      price: Number(form.price),
      category_id: Number(form.category_id),
    }

    const action = editing
      ? businessApi.updateService(editing.id, payload)
      : businessApi.createService({ ...payload, description: '' })

    action.then(() => {
      setModalOpen(false)
      loadData()
    })
  }

  const removeService = (id) => {
    businessApi.deleteService(id).then(() => loadData())
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Service management" subtitle="Maintain pricing, duration, and service categories." />
      <Section
        title="Service catalog"
        description="Add, update, or retire services based on demand."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Create service
          </button>
        }
      >
        <div className="zs-toolbar">
          <input className="zs-input zs-toolbar__input" placeholder="Search services..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <DataTable
          columns={columns}
          data={rows}
          actionsLabel="Manage"
          renderActions={(row) => (
            <div className="zs-table__actions">
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>Edit</button>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => removeService(row.id)}>Delete</button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit service' : 'Create service'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <input className="zs-input" placeholder="Service name" value={form.service} onChange={(e) => setForm((p) => ({ ...p, service: e.target.value }))} required />
          <input className="zs-input" placeholder="Duration (minutes)" value={form.duration} onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))} required />
          <input className="zs-input" placeholder="Price" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))} required />
          <input className="zs-input" placeholder="Category ID" value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} required />
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
