import { useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/tables/DataTable'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

function normalizeProductCategory(item) {
  return {
    id: item.id,
    name: item.name,
    usageCount: Number(item.product_count || 0),
  }
}

function normalizeServiceCategory(item) {
  return {
    id: item.category_id,
    name: item.category_name,
    usageCount: Number(item.service_count || 0),
  }
}

function toSearchable(value) {
  return String(value ?? '').toLowerCase()
}

function CategoryBlock({
  title,
  description,
  loading,
  error,
  rows,
  query,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
  emptyMessage,
  loadingMessage,
  columns,
}) {
  return (
    <Section
      title={title}
      description={description}
      action={
        <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={onCreate} type="button">
          Add category
        </button>
      }
    >
      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-toolbar">
        <input
          className="zs-input zs-toolbar__input"
          placeholder="Search categories..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>

      {loading ? (
        <p className="zs-card__description">{loadingMessage}</p>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          actionsLabel="Actions"
          emptyMessage={emptyMessage}
          renderActions={(row) => (
            <div className="zs-table__actions">
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => onEdit(row)}>
                Edit
              </button>
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => onDelete(row)}>
                Delete
              </button>
            </div>
          )}
        />
      )}
    </Section>
  )
}

export default function CategoryManagementPage() {
  const [productCategories, setProductCategories] = useState([])
  const [serviceCategories, setServiceCategories] = useState([])
  const [productQuery, setProductQuery] = useState('')
  const [serviceQuery, setServiceQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState('product')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [serverError, setServerError] = useState('')
  const form = useFormDraft({ name: '' }, (values) => {
    const errors = {}
    const name = String(values.name || '').trim()
    if (!name) errors.name = 'Category name is required.'
    else if (name.length < 2) errors.name = 'Category name must be at least 2 characters.'
    return errors
  })

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [productRes, serviceRes] = await Promise.all([
        businessApi.adminProductCategories(),
        businessApi.adminServiceCategories(),
      ])

      setProductCategories(
        Array.isArray(productRes?.data?.data) ? productRes.data.data.map(normalizeProductCategory) : [],
      )
      setServiceCategories(
        Array.isArray(serviceRes?.data?.data) ? serviceRes.data.data.map(normalizeServiceCategory) : [],
      )
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load categories.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const productRows = useMemo(
    () =>
      productCategories
        .filter((item) => toSearchable(item.name).includes(toSearchable(productQuery))),
    [productCategories, productQuery],
  )

  const serviceRows = useMemo(
    () =>
      serviceCategories
        .filter((item) => toSearchable(item.name).includes(toSearchable(serviceQuery))),
    [serviceCategories, serviceQuery],
  )

  const openCreate = (type) => {
    setModalType(type)
    setEditing(null)
    setError('')
    setServerError('')
    form.reset({ name: '' })
    setModalOpen(true)
  }

  const openEdit = (type, row) => {
    setModalType(type)
    setEditing(row)
    setError('')
    setServerError('')
    form.reset({ name: row.name || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setServerError('')
    const errors = form.validateAll()
    if (Object.keys(errors).length > 0) {
      setSaving(false)
      return
    }

    try {
      const name = form.values.name.trim()
      const payload = {
        name,
        category_name: name,
      }

      if (modalType === 'product') {
        if (editing) {
          await businessApi.updateAdminProductCategory(editing.id, payload)
        } else {
          await businessApi.createAdminProductCategory(payload)
        }
      } else if (editing) {
        await businessApi.updateAdminServiceCategory(editing.id, payload)
      } else {
        await businessApi.createAdminServiceCategory(payload)
      }

      setModalOpen(false)
      await loadData()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to save category.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === 'product') {
        await businessApi.deleteAdminProductCategory(deleteTarget.row.id)
      } else {
        await businessApi.deleteAdminServiceCategory(deleteTarget.row.id)
      }
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to delete category.')
    }
  }

  const productColumns = [
    { key: 'name', header: 'Name' },
    { key: 'usageCount', header: 'Products' },
  ]

  const serviceColumns = [
    { key: 'name', header: 'Name' },
    { key: 'usageCount', header: 'Services' },
  ]

  return (
    <div className="zs-dashboard">
      <PageHeader title="Categories" subtitle="Manage product and service categories from one place." />

      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}
      {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}

      <CategoryBlock
        title="Product categories"
        description="Categories used by the product catalog and product forms."
        loading={loading}
        error=""
        rows={productRows}
        query={productQuery}
        onQueryChange={setProductQuery}
        onCreate={() => openCreate('product')}
        onEdit={(row) => openEdit('product', row)}
        onDelete={(row) => setDeleteTarget({ type: 'product', row })}
        emptyMessage="No product categories have been configured yet."
        loadingMessage="Loading product categories..."
        columns={productColumns}
      />

      <CategoryBlock
        title="Service categories"
        description="Categories used by service forms and service listings."
        loading={loading}
        error=""
        rows={serviceRows}
        query={serviceQuery}
        onQueryChange={setServiceQuery}
        onCreate={() => openCreate('service')}
        onEdit={(row) => openEdit('service', row)}
        onDelete={(row) => setDeleteTarget({ type: 'service', row })}
        emptyMessage="No service categories have been configured yet."
        loadingMessage="Loading service categories..."
        columns={serviceColumns}
      />

      <Modal open={modalOpen} title={editing ? 'Edit category' : 'Add category'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <FormSection
            title={modalType === 'product' ? 'Product category' : 'Service category'}
            description={modalType === 'product'
              ? 'Renaming a product category will update all products using it.'
              : 'Renaming a service category will update all services using it.'}
          >
            <InputField
              label="Category name"
              required
              placeholder={modalType === 'product' ? 'Hair Care' : 'Hair Styling'}
              {...form.bindInput('name')}
              error={form.touched.name ? form.errors.name : ''}
            />
          </FormSection>
          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Category')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete category"
        message={`Are you sure you want to delete "${deleteTarget?.row?.name || ''}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
