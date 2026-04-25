import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import DataTable from '../../components/tables/DataTable'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatUSD } from '../../utils/money'
import { fileToDataUrl, getEntityImage } from '../../utils/imageDataUrl'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField, SelectField, TextAreaField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

const initialForm = {
  product_name: '',
  product_category_id: '',
  description: '',
  image_url: '',
  image_data: '',
  stock_quantity: '1',
  reorder_level: '0',
  unit_price: '0',
  min_stock_level: '0',
}

function getStatusTone(status) {
  return String(status || '').toLowerCase() === 'active' ? 'success' : 'neutral'
}

function validateProduct(values) {
  const errors = {}
  if (!String(values.product_name || '').trim()) errors.product_name = 'Product name is required.'
  if (!String(values.product_category_id || '').trim()) errors.product_category_id = 'Category is required.'
  if (!String(values.stock_quantity || '').trim()) errors.stock_quantity = 'Stock quantity is required.'
  if (Number(values.stock_quantity) < 1) errors.stock_quantity = 'Stock quantity must be at least 1.'
  if (!String(values.unit_price || '').trim()) errors.unit_price = 'Unit price is required.'
  if (Number(values.unit_price) <= 0) errors.unit_price = 'Unit price must be greater than 0.'
  if (Number(values.reorder_level) < 0) errors.reorder_level = 'Reorder level cannot be negative.'
  if (Number(values.min_stock_level) < 0) errors.min_stock_level = 'Minimum stock level cannot be negative.'
  return errors
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [serverError, setServerError] = useState('')
  const form = useFormDraft(initialForm, validateProduct)

  const loadData = useCallback(async (search = query) => {
    setLoading(true)
    setError('')
    try {
      const res = await businessApi.adminProducts({
        per_page: 100,
        search: search || undefined,
      })
      setProducts(res?.data?.data?.data || [])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load products.')
    } finally {
      setLoading(false)
    }
  }, [query])

  const loadCategories = useCallback(async () => {
    try {
      const res = await businessApi.productCategories()
      setCategories(Array.isArray(res?.data?.data) ? res.data.data : [])
    } catch {
      setCategories([])
    }
  }, [])

  useEffect(() => {
    loadData()
    loadCategories()
  }, [loadCategories, loadData])

  const rows = useMemo(
    () =>
      products.map((item) => ({
        id: item.product_id,
        image: (
          <img
            src={getEntityImage(item, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=120&q=80')}
            alt={item.product_name}
            style={{ width: 48, height: 48, borderRadius: 14, objectFit: 'cover' }}
          />
        ),
        name: item.product_name,
        category: item.category_label || 'Uncategorized',
        price: formatUSD(Number(item.unit_price || 0), { from: 'USD' }),
        stock: String(item.stock_quantity ?? 0),
        status: <Badge tone={getStatusTone(item.status)}>{item.status_label || item.status || 'active'}</Badge>,
        raw: item,
      })),
    [products],
  )

  const openCreate = () => {
    setEditing(null)
    setServerError('')
    form.reset({
      ...initialForm,
      product_category_id: String(categories[0]?.id || ''),
    })
    setModalOpen(true)
  }

  const openEdit = (row) => {
    const item = row.raw
    setEditing(row)
    setServerError('')
    form.reset({
      product_name: item.product_name || '',
      product_category_id: String(item.product_category_id || categories[0]?.id || ''),
      description: item.description || '',
      image_url: item.image_url || '',
      image_data: item.image_data || '',
      stock_quantity: String(item.stock_quantity ?? 1),
      reorder_level: String(item.reorder_level ?? 0),
      unit_price: String(item.unit_price ?? 0),
      min_stock_level: String(item.min_stock_level ?? 0),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    const errors = form.validateAll()
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    try {
      const payload = {
        product_name: form.values.product_name.trim(),
        product_category_id: Number(form.values.product_category_id),
        description: form.values.description.trim() || null,
        image_url: form.values.image_data ? null : (form.values.image_url.trim() || null),
        image_data: form.values.image_data || null,
        stock_quantity: Number(form.values.stock_quantity),
        reorder_level: Number(form.values.reorder_level || 0),
        unit_price: Number(form.values.unit_price),
        min_stock_level: Number(form.values.min_stock_level || 0),
      }

      if (editing) {
        await businessApi.adminUpdateProduct(editing.id, payload)
      } else {
        await businessApi.adminCreateProduct(payload)
      }

      setModalOpen(false)
      await loadData()
      setEditing(null)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to save product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await businessApi.adminDeleteProduct(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to delete product.')
    }
  }

  const columns = [
    { key: 'image', header: 'Image' },
    { key: 'name', header: 'Product' },
    { key: 'category', header: 'Category' },
    { key: 'price', header: 'Price' },
    { key: 'stock', header: 'Stock' },
    { key: 'status', header: 'Status' },
  ]

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Product management"
        subtitle="Maintain the catalog used by the shop, orders, and inventory reports."
      />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}
      {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}

      <Section
        title="Catalog"
        description="Create, update, or retire products from the admin panel."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Create product
          </button>
        }
      >
        <div className="zs-toolbar">
          <input
            className="zs-input zs-toolbar__input"
            placeholder="Search products..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="zs-btn zs-btn--ghost zs-btn--sm" type="button" onClick={() => loadData(query)}>
            Search
          </button>
        </div>

        {loading ? (
          <p className="zs-card__description">Loading products...</p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            actionsLabel="Manage"
            emptyMessage="No products found."
            renderActions={(row) => (
              <div className="zs-table__actions">
                <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>
                  Edit
                </button>
                <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setDeleteTarget(row)}>
                  Delete
                </button>
              </div>
            )}
          />
        )}
      </Section>

      <Modal open={modalOpen} title={editing ? 'Edit product' : 'Create product'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <FormSection title="Basic information" description="Define the product identity and where it belongs in the catalog.">
            <InputField
              label="Product name"
              required
              placeholder="Argan Repair Shampoo"
              {...form.bindInput('product_name')}
              error={form.touched.product_name ? form.errors.product_name : ''}
            />
            <SelectField
              label="Category"
              required
              value={form.values.product_category_id}
              onChange={(event) => form.setFieldValue('product_category_id', event.target.value)}
              onBlur={() => form.markTouched('product_category_id')}
              error={form.touched.product_category_id ? form.errors.product_category_id : ''}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              label="Description"
              placeholder="Short product summary for staff and clients."
              rows={4}
              value={form.values.description}
              onChange={(event) => form.setFieldValue('description', event.target.value)}
              onBlur={() => form.markTouched('description')}
            />
          </FormSection>

          <FormSection title="Inventory & pricing" description="Keep stock thresholds and pricing consistent across the shop and reports.">
            <div className="zs-profile__grid">
              <InputField
                label="Stock quantity"
                required
                type="number"
                min="1"
                placeholder="1"
                {...form.bindInput('stock_quantity')}
                error={form.touched.stock_quantity ? form.errors.stock_quantity : ''}
              />
              <InputField
                label="Reorder level"
                type="number"
                min="0"
                placeholder="0"
                {...form.bindInput('reorder_level')}
                error={form.touched.reorder_level ? form.errors.reorder_level : ''}
              />
              <InputField
                label="Unit price"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...form.bindInput('unit_price')}
                error={form.touched.unit_price ? form.errors.unit_price : ''}
              />
              <InputField
                label="Min stock level"
                type="number"
                min="0"
                placeholder="0"
                {...form.bindInput('min_stock_level')}
                error={form.touched.min_stock_level ? form.errors.min_stock_level : ''}
              />
            </div>
          </FormSection>

          <FormSection title="Media" description="Optional product image for the storefront and admin lists.">
            <div className="zs-profile__grid">
              <InputField
                label="Image URL"
                type="url"
                placeholder="https://example.com/image.jpg"
                {...form.bindInput('image_url')}
                hint="Use this if you already have a hosted image link."
              />
              <label className="zs-field">
                <span className="zs-field__label">Upload image</span>
                <input
                  className="zs-input"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    try {
                      const image_data = await fileToDataUrl(file)
                      form.setFieldValue('image_data', image_data)
                      form.setFieldValue('image_url', '')
                    } catch (err) {
                      setServerError(err?.message || 'Unable to read image.')
                    } finally {
                      event.target.value = ''
                    }
                  }}
                />
                <span className="zs-field__hint">Recommended: square image, at least 800px.</span>
              </label>
            </div>
            {getEntityImage(form.values, '') ? (
              <div className="zs-field">
                <span className="zs-field__label">Preview</span>
                <div className="zs-profile__favorite-item" style={{ alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={getEntityImage(form.values, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=120&q=80')}
                      alt="Product preview"
                      style={{ width: 88, height: 88, borderRadius: 18, objectFit: 'cover' }}
                    />
                    <div>
                      <strong>{form.values.product_name || 'Product preview'}</strong>
                      <p style={{ margin: '0.25rem 0 0', color: '#6d746f' }}>
                        {form.values.image_data ? 'Image uploaded from device.' : 'Image loaded from URL.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="zs-btn zs-btn--ghost zs-btn--sm"
                    onClick={() => {
                      form.setFieldValue('image_data', '')
                      form.setFieldValue('image_url', '')
                    }}
                  >
                    Remove image
                  </button>
                </div>
              </div>
            ) : null}
          </FormSection>

          <p className="zs-card__description" style={{ margin: 0 }}>
            Status is derived from the persisted catalog row. Products referenced by orders or inventory records cannot be deleted.
          </p>

          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Product')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete product"
        message={`Are you sure you want to delete "${deleteTarget?.name || ''}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
