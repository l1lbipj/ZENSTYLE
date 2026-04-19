import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'

const columns = [
  { key: 'image', header: 'Image' },
  { key: 'product', header: 'Product' },
  { key: 'category', header: 'Category' },
  { key: 'qty', header: 'Quantity' },
  { key: 'status', header: 'Status' },
]

const emptyForm = {
  product_name: '',
  category: 'hair',
  description: '',
  image_data: '',
  stock_quantity: '1',
  reorder_level: '5',
  unit_price: '100000',
  min_stock_level: '3',
}

export default function InventoryManagementPage() {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

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
        image: (
          <img
            src={getEntityImage(item, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9')}
            alt={item.product_name}
            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 12 }}
          />
        ),
        product: item.product_name,
        category: item.category || 'hair',
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
    setError('')
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setError('')
    setForm({
      product_name: item.raw.product_name,
      category: item.raw.category || 'hair',
      description: item.raw.description || '',
      image_data: item.raw.image_data || '',
      stock_quantity: String(item.raw.stock_quantity),
      reorder_level: String(item.raw.reorder_level ?? 0),
      unit_price: String(item.raw.unit_price),
      min_stock_level: String(item.raw.min_stock_level ?? 0),
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
      product_name: form.product_name,
      category: form.category,
      description: form.description,
      image_data: form.image_data || null,
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
      .catch((err) => setError(err?.response?.data?.message || 'Unable to save product.'))
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
          {error ? <p className="zs-alert zs-alert--error">{error}</p> : null}
          <input className="zs-input" placeholder="Product name" value={form.product_name} onChange={(e) => setForm((p) => ({ ...p, product_name: e.target.value }))} required />
          <select className="zs-select" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
            <option value="hair">hair</option>
            <option value="skin">skin</option>
          </select>
          <textarea className="zs-input" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
          <label className="zs-field">
            <span className="zs-field__label">Product image</span>
            <input className="zs-input" type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/gif" onChange={handleImageChange} />
          </label>
          {form.image_data ? (
            <div>
              <img src={form.image_data} alt="Product preview" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 16, marginBottom: 8 }} />
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setForm((p) => ({ ...p, image_data: null }))}>Remove image</button>
            </div>
          ) : null}
          <input className="zs-input" placeholder="Quantity" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} required />
          <input className="zs-input" placeholder="Reorder level" value={form.reorder_level} onChange={(e) => setForm((p) => ({ ...p, reorder_level: e.target.value }))} required />
          <input className="zs-input" placeholder="Unit price" value={form.unit_price} onChange={(e) => setForm((p) => ({ ...p, unit_price: e.target.value }))} required />
          <input className="zs-input" placeholder="Minimum stock level" value={form.min_stock_level} onChange={(e) => setForm((p) => ({ ...p, min_stock_level: e.target.value }))} required />
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
