import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import { formatUSD } from '../../utils/money'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField, SelectField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

const columns = [
  { key: 'service', header: 'Service' },
  { key: 'duration', header: 'Duration' },
  { key: 'price', header: 'Price' },
  { key: 'category', header: 'Category' },
]

export default function ServiceManagementPage() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const form = useFormDraft({ service: '', duration: '', price: '', category_id: '' }, (values) => {
    const errors = {}
    if (!String(values.service || '').trim()) errors.service = 'Service name is required.'
    if (!String(values.duration || '').trim()) errors.duration = 'Duration is required.'
    if (Number(values.duration) < 5) errors.duration = 'Duration must be at least 5 minutes.'
    if (!String(values.price || '').trim()) errors.price = 'Price is required.'
    if (Number(values.price) <= 0) errors.price = 'Price must be greater than 0.'
    if (!String(values.category_id || '').trim()) errors.category_id = 'Category is required.'
    return errors
  })
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    setServerError('')
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        businessApi.services({ per_page: 100 }),
        businessApi.adminServiceCategories(),
      ])
      const rows = servicesRes?.data?.data?.data || []
      setServices(
        rows.map((item) => ({
          id: item.service_id,
          service: item.service_name,
          duration: `${item.duration} min`,
          price: formatUSD(item.price || 0, { from: 'USD' }),
          category: item.category?.category_name || `#${item.category_id}`,
          raw: item,
        })),
      )
      setCategories(Array.isArray(categoriesRes?.data?.data) ? categoriesRes.data.data : [])
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Failed to load services.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return services.filter((item) => item.service.toLowerCase().includes(query.toLowerCase()))
  }, [query, services])

  const openCreate = () => {
    setEditing(null)
    setServerError('')
    form.reset({ service: '', duration: '', price: '', category_id: String(categories?.[0]?.category_id || '') })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setServerError('')
    form.reset({
      service: item.raw.service_name,
      duration: String(item.raw.duration),
      price: String(item.raw.price),
      category_id: String(item.raw.category_id),
    })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setServerError('')
    const errors = form.validateAll()
    if (Object.keys(errors).length > 0) return
    setSaving(true)
    const payload = {
      service_name: form.values.service.trim(),
      duration: Number(form.values.duration),
      price: Number(form.values.price),
      category_id: Number(form.values.category_id),
    }

    try {
      const action = editing
        ? businessApi.updateService(editing.id, payload)
        : businessApi.createService({ ...payload, description: '' })
      await action
      setModalOpen(false)
      loadData()
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to save service.')
    } finally {
      setSaving(false)
    }
  }

  const removeService = async () => {
    if (!deleteTarget) return
    try {
      await businessApi.deleteService(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to delete service.')
    }
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
        {loading ? (
          <p className="zs-card__description">Loading services...</p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            actionsLabel="Manage"
            renderActions={(row) => (
              <div className="zs-table__actions">
                <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openEdit(row)}>Edit</button>
                <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setDeleteTarget(row)}>Delete</button>
              </div>
            )}
          />
        )}
      </Section>
      {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}
      <Modal open={modalOpen} title={editing ? 'Edit service' : 'Create service'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <FormSection title="Basic information" description="Keep the service name, category, and description easy to understand.">
            <InputField
              label="Service name"
              required
              placeholder="Women's Haircut & Blowout"
              {...form.bindInput('service')}
              error={form.touched.service ? form.errors.service : ''}
            />
            <SelectField
              label="Category"
              required
              value={form.values.category_id}
              onChange={(event) => form.setFieldValue('category_id', event.target.value)}
              onBlur={() => form.markTouched('category_id')}
              error={form.touched.category_id ? form.errors.category_id : ''}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </SelectField>
            <div className="zs-card__description" style={{ margin: 0 }}>
              Description is managed by the backend for now. Update the service name, category, duration, and price here.
            </div>
          </FormSection>

          <FormSection title="Pricing" description="Check duration and price carefully before saving.">
            <div className="zs-profile__grid">
              <InputField
                label="Duration (minutes)"
                required
                type="number"
                min="5"
                placeholder="60"
                {...form.bindInput('duration')}
                error={form.touched.duration ? form.errors.duration : ''}
              />
              <InputField
                label="Price"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                {...form.bindInput('price')}
                error={form.touched.price ? form.errors.price : ''}
              />
            </div>
          </FormSection>

          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Service')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete service"
        message={`Are you sure you want to delete "${deleteTarget?.service || ''}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={removeService}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
