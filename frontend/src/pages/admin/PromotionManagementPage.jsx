import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField, SelectField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

const columns = [
  { key: 'code', header: 'Code' },
  { key: 'percent', header: 'Discount' },
  { key: 'expires', header: 'Expires' },
  { key: 'status', header: 'Status' },
]

function extractPromotionRows(response) {
  const payload = response?.data?.data
  if (Array.isArray(payload)) return payload
  return payload?.data || []
}

export default function PromotionManagementPage() {
  const [promotions, setPromotions] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const form = useFormDraft(
    {
      promotion_code: '',
      percent: '10',
      expiration_date: '',
      usage_limit: '100',
      apply_type: 'service',
      service_id: '',
    },
    (values) => {
      const errors = {}
      if (!String(values.promotion_code || '').trim()) errors.promotion_code = 'Promotion code is required.'
      if (!String(values.percent || '').trim()) errors.percent = 'Discount percent is required.'
      if (Number(values.percent) < 1 || Number(values.percent) > 100) errors.percent = 'Discount must be between 1 and 100.'
      if (!String(values.expiration_date || '').trim()) errors.expiration_date = 'Expiration date is required.'
      if (!String(values.usage_limit || '').trim()) errors.usage_limit = 'Usage limit is required.'
      if (Number(values.usage_limit) < 1) errors.usage_limit = 'Usage limit must be at least 1.'
      if (values.apply_type === 'service' && !String(values.service_id || '').trim()) {
        errors.service_id = 'Service is required when apply type is service.'
      }
      return errors
    },
  )

  const loadData = () => {
    businessApi.promotions({ per_page: 'all' }).then((res) => {
      const rows = extractPromotionRows(res)
      setPromotions(rows)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(
    () =>
      promotions
        .filter((p) => p.promotion_code.toLowerCase().includes(query.toLowerCase()))
        .map((item) => {
          const expired = new Date(item.expiration_date) < new Date()
          return {
            id: item.promotion_id,
            code: item.promotion_code,
            percent: `${item.percent}%`,
            expires: item.expiration_date,
            status: <Badge tone={expired ? 'warning' : 'success'}>{expired ? 'Expired' : 'Active'}</Badge>,
            raw: item,
          }
        }),
    [promotions, query],
  )

  const openCreate = () => {
    setEditing(null)
    setServerError('')
    form.reset({
      promotion_code: '',
      percent: '10',
      expiration_date: '',
      usage_limit: '100',
      apply_type: 'service',
      service_id: '',
    })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setServerError('')
    form.reset({
      promotion_code: item.raw.promotion_code,
      percent: String(item.raw.percent),
      expiration_date: item.raw.expiration_date,
      usage_limit: String(item.raw.usage_limit),
      apply_type: item.raw.apply_type,
      service_id: item.raw.service_id ? String(item.raw.service_id) : '',
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
      promotion_code: form.values.promotion_code.trim(),
      percent: Number(form.values.percent),
      expiration_date: form.values.expiration_date,
      usage_limit: Number(form.values.usage_limit),
      apply_type: form.values.apply_type,
      service_id: form.values.service_id ? Number(form.values.service_id) : null,
    }

    try {
      const action = editing ? businessApi.updatePromotion(editing.id, payload) : businessApi.createPromotion(payload)
      await action
      setModalOpen(false)
      loadData()
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to save promotion.')
    } finally {
      setSaving(false)
    }
  }

  const removePromotion = async () => {
    if (!deleteTarget) return
    try {
      await businessApi.deletePromotion(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to delete promotion.')
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Promotion management" subtitle="Create campaigns and track performance." />
      <Section
        title="Campaigns"
        description="Plan promotions and monitor active offers."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            New campaign
          </button>
        }
      >
        <div className="zs-toolbar">
          <input className="zs-input zs-toolbar__input" placeholder="Search campaigns..." value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
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
      </Section>
      {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}
      <Modal open={modalOpen} title={editing ? 'Edit campaign' : 'New campaign'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <FormSection title="Promotion" description="Keep the code and discount easy to apply at checkout.">
            <InputField
              label="Promotion code"
              required
              placeholder="ZEN-SHOP-10"
              {...form.bindInput('promotion_code')}
              error={form.touched.promotion_code ? form.errors.promotion_code : ''}
            />
            <div className="zs-profile__grid">
              <InputField
                label="Discount (%)"
                required
                type="number"
                min="1"
                max="100"
                placeholder="10"
                {...form.bindInput('percent')}
                error={form.touched.percent ? form.errors.percent : ''}
              />
              <InputField
                label="Usage limit"
                required
                type="number"
                min="1"
                placeholder="100"
                {...form.bindInput('usage_limit')}
                error={form.touched.usage_limit ? form.errors.usage_limit : ''}
              />
            </div>
          </FormSection>

          <FormSection title="Timing" description="Make sure the offer has a clear end date.">
            <InputField
              label="Expiration date"
              required
              type="date"
              {...form.bindInput('expiration_date')}
              error={form.touched.expiration_date ? form.errors.expiration_date : ''}
            />
            <SelectField
              label="Apply type"
              value={form.values.apply_type}
              onChange={(event) => form.setFieldValue('apply_type', event.target.value)}
              onBlur={() => form.markTouched('apply_type')}
            >
              <option value="service">Service</option>
              <option value="order">Order</option>
              <option value="all">All</option>
            </SelectField>
            <InputField
              label="Service ID"
              type="number"
              min="1"
              placeholder="Optional"
              {...form.bindInput('service_id')}
              error={form.touched.service_id ? form.errors.service_id : ''}
              hint="Required only when apply type is Service."
            />
          </FormSection>

          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Campaign')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete campaign"
        message={`Are you sure you want to delete "${deleteTarget?.code || ''}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={removePromotion}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
