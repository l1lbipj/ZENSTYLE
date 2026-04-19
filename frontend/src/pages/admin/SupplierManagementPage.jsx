import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'

const columns = [
  { key: 'supplier', header: 'Supplier' },
  { key: 'contact', header: 'Contact' },
  { key: 'phone', header: 'Phone' },
]

export default function SupplierManagementPage() {
  const [suppliers, setSuppliers] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ supplier_name: '', email: '', phone: '' })

  const loadData = () => {
    businessApi.suppliers({ per_page: 100 }).then((res) => {
      setSuppliers(res?.data?.data?.data || [])
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return suppliers
      .filter((item) => item.supplier_name.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({
        id: item.supplier_id,
        supplier: item.supplier_name,
        contact: item.email,
        phone: item.phone,
        raw: item,
      }))
  }, [query, suppliers])

  const openCreate = () => {
    setEditing(null)
    setForm({ supplier_name: '', email: '', phone: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      supplier_name: item.raw.supplier_name,
      email: item.raw.email,
      phone: item.raw.phone || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const action = editing ? businessApi.updateSupplier(editing.id, form) : businessApi.createSupplier(form)
    action.then(() => {
      setModalOpen(false)
      loadData()
    })
  }

  const removeSupplier = (id) => {
    businessApi.deleteSupplier(id).then(() => loadData())
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Supplier management" subtitle="Keep partner contacts and purchase orders organized." />
      <Section
        title="Supplier directory"
        description="Manage vendor relationships and purchase history."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Add supplier
          </button>
        }
      >
        <div className="zs-toolbar">
          <input className="zs-input zs-toolbar__input" placeholder="Search suppliers..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <DataTable
          columns={columns}
          data={rows}
          actionsLabel="Manage"
          renderActions={(row) => (
            <div className="zs-table__actions">
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>Edit</button>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => removeSupplier(row.id)}>Delete</button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit supplier' : 'Add supplier'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <input className="zs-input" placeholder="Supplier name" value={form.supplier_name} onChange={(e) => setForm((p) => ({ ...p, supplier_name: e.target.value }))} required />
          <input className="zs-input" placeholder="Contact email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
          <input className="zs-input" placeholder="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
