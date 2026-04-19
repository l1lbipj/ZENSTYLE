import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'

const columns = [
  { key: 'product', header: 'Product' },
  { key: 'qty', header: 'Quantity' },
  { key: 'status', header: 'Status' },
]

export default function InventoryManagementPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ product_name: '', stock_quantity: '1', reorder_level: '5', unit_price: '100000', min_stock_level: '3' })

  const loadData = () => {
    businessApi.products({ per_page: 100 }).then((res) => {
      setItems(res?.data?.data?.data || [])
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return items
      .filter((item) => (filter === 'all' ? true : filter === 'Low' ? Number(item.stock_quantity) <= Number(item.reorder_level) : Number(item.stock_quantity) > Number(item.reorder_level)))
      .filter((item) => item.product_name.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({
        id: item.product_id,
        product: item.product_name,
        qty: String(item.stock_quantity),
        status: (
          <Badge tone={Number(item.stock_quantity) <= Number(item.reorder_level) ? 'warning' : 'success'}>
            {Number(item.stock_quantity) <= Number(item.reorder_level) ? 'Low' : 'Healthy'}
          </Badge>
        ),
        raw: item,
      }))
  }, [query, filter, items])

  const openCreate = () => {
    setEditing(null)
    setForm({ product_name: '', stock_quantity: '1', reorder_level: '5', unit_price: '100000', min_stock_level: '3' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setForm({
      product_name: item.raw.product_name,
      stock_quantity: String(item.raw.stock_quantity),
      reorder_level: String(item.raw.reorder_level),
      unit_price: String(item.raw.unit_price),
      min_stock_level: String(item.raw.min_stock_level),
    })
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      product_name: form.product_name,
      stock_quantity: Number(form.stock_quantity),
      reorder_level: Number(form.reorder_level),
      unit_price: Number(form.unit_price),
      min_stock_level: Number(form.min_stock_level),
    }
    const action = editing ? businessApi.updateProduct(editing.id, payload) : businessApi.createProduct(payload)
    action.then(() => {
      setModalOpen(false)
      loadData()
    })
  }

  const removeItem = (id) => {
    businessApi.deleteProduct(id).then(() => loadData())
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Inventory management" subtitle="Monitor stock levels and restock alerts." />
      <Section
        title="Inventory overview"
        description="Track product consumption and alert thresholds."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Add stock
          </button>
        }
      >
        <div className="zs-toolbar">
          <input className="zs-input zs-toolbar__input" placeholder="Search inventory..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="zs-toolbar__filters">
            {['all', 'Low', 'Healthy'].map((item) => (
              <button key={item} type="button" className={`zs-chip ${filter === item ? 'is-active' : ''}`} onClick={() => setFilter(item)}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <DataTable
          columns={columns}
          data={rows}
          actionsLabel="Stock"
          renderActions={(row) => (
            <div className="zs-table__actions">
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>Edit</button>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => removeItem(row.id)}>Delete</button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit inventory' : 'Add stock'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <input className="zs-input" placeholder="Product name" value={form.product_name} onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} required />
          <input className="zs-input" placeholder="Quantity" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} required />
          <input className="zs-input" placeholder="Reorder level" value={form.reorder_level} onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))} required />
          <input className="zs-input" placeholder="Unit price" value={form.unit_price} onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))} required />
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
