import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

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
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const form = useFormDraft({ supplier_name: '', email: '', phone: '' }, (values) => {
    const errors = {}
    if (!String(values.supplier_name || '').trim()) errors.supplier_name = 'Supplier name is required.'
    if (!String(values.email || '').trim()) errors.email = 'Email is required.'
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
    if (values.phone && String(values.phone).trim().length > 20) errors.phone = 'Phone number is too long.'
    return errors
  })

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
    setServerError('')
    form.reset({ supplier_name: '', email: '', phone: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setServerError('')
    form.reset({
      supplier_name: item.raw.supplier_name,
      email: item.raw.email,
      phone: item.raw.phone || '',
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
      supplier_name: form.values.supplier_name.trim(),
      email: form.values.email.trim(),
      phone: form.values.phone.trim() || null,
    }
    try {
      const action = editing ? businessApi.updateSupplier(editing.id, payload) : businessApi.createSupplier(payload)
      await action
      setModalOpen(false)
      loadData()
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to save supplier.')
    } finally {
      setSaving(false)
    }
  }

  const removeSupplier = async () => {
    if (!deleteTarget) return
    try {
      await businessApi.deleteSupplier(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || 'Unable to delete supplier.')
    }
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
        {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}
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
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => setDeleteTarget(row)}>Delete</button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit supplier' : 'Add supplier'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <FormSection title="Supplier information" description="Keep contact details complete so purchasing and follow-up stay reliable.">
            <InputField
              label="Supplier name"
              required
              placeholder="Silk & Shine Wholesale"
              {...form.bindInput('supplier_name')}
              error={form.touched.supplier_name ? form.errors.supplier_name : ''}
            />
            <InputField
              label="Contact email"
              required
              type="email"
              placeholder="supplier@company.com"
              {...form.bindInput('email')}
              error={form.touched.email ? form.errors.email : ''}
            />
            <InputField
              label="Phone"
              type="tel"
              placeholder="+1 555 000 0000"
              {...form.bindInput('phone')}
              error={form.touched.phone ? form.errors.phone : ''}
            />
          </FormSection>
          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Supplier')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete supplier"
        message={`Are you sure you want to delete "${deleteTarget?.supplier || ''}"?`}
        confirmLabel="Delete"
        danger
        onConfirm={removeSupplier}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
