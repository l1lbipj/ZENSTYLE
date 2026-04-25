import { useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/tables/DataTable'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'
import useFormDraft from '../../hooks/useFormDraft'
import { FormActions, FormSection, InputField } from '../../components/forms/FormField'
import ConfirmModal from '../../components/forms/ConfirmModal'

const columns = [
  { key: 'name', header: 'Allergy option' },
  { key: 'updatedAt', header: 'Updated' },
]

function formatTimestamp(value) {
  if (!value) return '--'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function getApiErrorMessage(err, fallback) {
  const fieldErrors = err?.response?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldErrors = Object.values(fieldErrors).find((messages) => Array.isArray(messages) && messages.length)
    if (firstFieldErrors) return firstFieldErrors[0]
  }

  return err?.response?.data?.message || fallback
}

export default function AllergyManagementPage() {
  const [allergies, setAllergies] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const form = useFormDraft({ allergy_name: '' }, (values) => {
    const errors = {}
    const name = String(values.allergy_name || '').trim()
    if (!name) errors.allergy_name = 'Allergy name is required.'
    else if (name.length < 2) errors.allergy_name = 'Allergy name must be at least 2 characters.'
    return errors
  })
  const [error, setError] = useState('')

  const loadData = () => {
    businessApi.adminAllergies({ per_page: 'all' }).then((res) => {
      const rows = Array.isArray(res?.data?.data) ? res.data.data : res?.data?.data?.data || []
      setAllergies(rows)
    })
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    return allergies
      .filter((item) => item.allergy_name.toLowerCase().includes(query.toLowerCase()))
      .map((item) => ({
        id: item.allergy_id,
        name: item.allergy_name,
        updatedAt: formatTimestamp(item.updated_at),
        raw: item,
      }))
  }, [allergies, query])

  const openCreate = () => {
    setEditing(null)
    setError('')
    setServerError('')
    form.reset({ allergy_name: '' })
    setModalOpen(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setError('')
    setServerError('')
    form.reset({ allergy_name: item.raw.allergy_name || '' })
    setModalOpen(true)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setServerError('')
    const errors = form.validateAll()
    if (Object.keys(errors).length > 0) return
    setSaving(true)

    const payload = { allergy_name: form.values.allergy_name.trim() }
    try {
      const action = editing
        ? businessApi.updateAdminAllergy(editing.id, payload)
        : businessApi.createAdminAllergy(payload)
      await action
      setModalOpen(false)
      loadData()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to save allergy option.'))
    } finally {
      setSaving(false)
    }
  }

  const removeAllergy = async () => {
    if (!deleteTarget) return
    try {
      await businessApi.deleteAdminAllergy(deleteTarget.id)
      await loadData()
      setDeleteTarget(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to delete allergy option.'))
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader title="Allergy management" subtitle="Manage the allergy options clients can select in their profile." />

      <Section
        title="Allergy catalog"
        description="Add, rename, or remove options without touching the database structure."
        action={
          <button className="zs-btn zs-btn--primary zs-btn--sm" onClick={openCreate} type="button">
            Add allergy
          </button>
        }
      >
        {error ? <div className="zs-alert zs-alert--error">{error}</div> : null}
        {serverError ? <div className="zs-feedback zs-feedback--error">{serverError}</div> : null}
        <div className="zs-toolbar">
          <input
            className="zs-input zs-toolbar__input"
            placeholder="Search allergies..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <DataTable
          columns={columns}
          data={rows}
          emptyMessage="No allergy options have been configured yet."
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
      </Section>

      <Modal open={modalOpen} title={editing ? 'Edit allergy option' : 'Add allergy option'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          {error ? <p className="zs-alert zs-alert--error">{error}</p> : null}
          <FormSection title="Allergy information" description="Use clear names so clients can select the right profile option.">
            <InputField
              label="Allergy name"
              required
              placeholder="Fragrance sensitivity"
              {...form.bindInput('allergy_name')}
              error={form.touched.allergy_name ? form.errors.allergy_name : ''}
            />
          </FormSection>
          <FormActions
            primaryLabel={editing ? (saving ? 'Saving...' : 'Save Changes') : (saving ? 'Creating...' : 'Create Allergy')}
            onSecondary={() => setModalOpen(false)}
            primaryProps={{ disabled: saving || (!!editing && !form.dirty) || form.hasErrors }}
            secondaryProps={{ disabled: saving }}
          />
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete allergy option"
        message={`Are you sure you want to delete "${deleteTarget?.name || ''}"? This will remove it from client profiles too.`}
        confirmLabel="Delete"
        danger
        onConfirm={removeAllergy}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}
