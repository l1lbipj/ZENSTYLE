import { useMemo, useState, useEffect } from 'react'
import DataTable from '../../components/tables/DataTable'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'

const columns = [
  { key: 'code', header: 'Code' },
  { key: 'percent', header: 'Discount' },
  { key: 'expires', header: 'Expires' },
  { key: 'status', header: 'Status' },
]

export default function PromotionManagementPage() {
  const [promotions, setPromotions] = useState([])
  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    promotion_code: '',
    percent: '10',
    expiration_date: '',
    usage_limit: '100',
    apply_type: 'service',
    service_id: '',
  })

  const loadData = () => {
    businessApi.promotions({ per_page: 100 }).then((res) => {
      const rows = res?.data?.data?.data || []
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
    setForm({
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
    setForm({
      promotion_code: item.raw.promotion_code,
      percent: String(item.raw.percent),
      expiration_date: item.raw.expiration_date,
      usage_limit: String(item.raw.usage_limit),
      apply_type: item.raw.apply_type,
      service_id: item.raw.service_id ? String(item.raw.service_id) : '',
    })
    setModalOpen(true)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const payload = {
      promotion_code: form.promotion_code,
      percent: Number(form.percent),
      expiration_date: form.expiration_date,
      usage_limit: Number(form.usage_limit),
      apply_type: form.apply_type,
      service_id: form.service_id ? Number(form.service_id) : null,
    }

    const action = editing ? businessApi.updatePromotion(editing.id, payload) : businessApi.createPromotion(payload)
    action.then(() => {
      setModalOpen(false)
      loadData()
    })
  }

  const removePromotion = (id) => {
    businessApi.deletePromotion(id).then(() => loadData())
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
              <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => removePromotion(row.id)}>Delete</button>
            </div>
          )}
        />
      </Section>
      <Modal open={modalOpen} title={editing ? 'Edit campaign' : 'New campaign'} onClose={() => setModalOpen(false)}>
        <form className="zs-form" onSubmit={handleSubmit}>
          <input className="zs-input" placeholder="Promotion code" value={form.promotion_code} onChange={(e) => setForm((p) => ({ ...p, promotion_code: e.target.value }))} required />
          <input className="zs-input" placeholder="Discount %" value={form.percent} onChange={(e) => setForm((p) => ({ ...p, percent: e.target.value }))} required />
          <input className="zs-input" type="date" value={form.expiration_date} onChange={(e) => setForm((p) => ({ ...p, expiration_date: e.target.value }))} required />
          <input className="zs-input" placeholder="Usage limit" value={form.usage_limit} onChange={(e) => setForm((p) => ({ ...p, usage_limit: e.target.value }))} required />
          <input className="zs-input" placeholder="Service ID (optional)" value={form.service_id} onChange={(e) => setForm((p) => ({ ...p, service_id: e.target.value }))} />
          <div className="zs-action-row">
            <button type="submit" className="zs-btn zs-btn--primary">Save</button>
            <button type="button" className="zs-btn zs-btn--ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
