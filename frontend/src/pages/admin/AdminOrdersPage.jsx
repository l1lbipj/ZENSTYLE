import { useCallback, useEffect, useMemo, useState } from 'react'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

function getTone(row) {
  const status = String(row.status || row.payment_status || '').toLowerCase()
  if (status === 'paid' || status === 'completed') return 'success'
  if (status === 'cancelled') return 'neutral'
  if (status === 'checked-in' || status === 'in progress') return 'accent'
  return 'warning'
}

function getStatusLabel(row) {
  return row.status || row.payment_status || 'Pending'
}

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { per_page: 100, status: statusFilter || undefined, search: search || undefined }

      if (typeFilter === 'product') {
        const res = await businessApi.adminProductOrders(params)
        setOrders(res?.data?.data?.data || [])
      } else if (typeFilter === 'appointment') {
        const res = await businessApi.adminOrders(params)
        setOrders(res?.data?.data?.data || [])
      } else {
        // all: fetch both and merge
        const [aRes, pRes] = await Promise.all([businessApi.adminOrders(params), businessApi.adminProductOrders(params)])
        const aList = aRes?.data?.data?.data || []
        const pList = pRes?.data?.data?.data || []
        const merged = [...aList, ...pList]
        // sort by newest payment_date/appointment_date
        merged.sort((x, y) => {
          const tx = new Date(x.payment_date || x.appointment_date || 0).getTime()
          const ty = new Date(y.payment_date || y.appointment_date || 0).getTime()
          return ty - tx
        })
        setOrders(merged)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, typeFilter])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const openOrder = async (row) => {
    try {
      let res = null
      if (row?.invoice_type === 'product_order') {
        const id = row.customer_order_id || row.id || row.order_id || row.invoice_id
        res = await businessApi.adminProductOrderDetail(id)
      } else {
        res = await businessApi.adminOrderDetail(row.appointment_id)
      }
      setViewOrder(res?.data?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load order')
    }
  }

  const refreshOrder = async (id, type = 'appointment') => {
    await loadOrders()
    if (viewOrder) {
      try {
        if (viewOrder?.appointment_id && type === 'appointment') {
          const det = await businessApi.adminOrderDetail(id)
          setViewOrder(det?.data?.data || null)
        } else if ((viewOrder?.id || viewOrder?.customer_order_id) && type === 'product') {
          const det = await businessApi.adminProductOrderDetail(id)
          setViewOrder(det?.data?.data || null)
        }
      } catch (err) {
        // ignore
      }
    }
  }

  const approveOrder = async (row) => {
    try {
      if (row?.invoice_type === 'product_order') {
        const id = row.customer_order_id || row.id || row.order_id || row.invoice_id
        await businessApi.approveProductOrder(id)
        await refreshOrder(id, 'product')
      } else {
        await businessApi.approveOrder(row.appointment_id)
        await refreshOrder(row.appointment_id, 'appointment')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to approve order')
    }
  }

  const cancelOrder = async (row) => {
    try {
      if (row?.invoice_type === 'product_order') {
        const id = row.customer_order_id || row.id || row.order_id || row.invoice_id
        await businessApi.cancelProductOrder(id)
        await refreshOrder(id, 'product')
      } else {
        await businessApi.cancelOrder(row.appointment_id)
        await refreshOrder(row.appointment_id, 'appointment')
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to cancel order')
    }
  }

  const rows = useMemo(() => orders || [], [orders])

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="Order management"
        subtitle="Review appointment-based orders and update their payment status."
      />

      <Section
        title="Orders"
        description="All appointments that act as invoices or product orders are listed here."
      >
          <div className="zs-toolbar">
          <input
            className="zs-input zs-toolbar__input"
            placeholder="Search customer or appointment ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="zs-input"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={{ maxWidth: '160px', marginLeft: '0.5rem' }}
          >
            <option value="all">All orders</option>
            <option value="appointment">Bookings</option>
            <option value="product">Product orders</option>
          </select>
          <select
            className="zs-input"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{ maxWidth: '180px' }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="checked-in">Checked-In</option>
          </select>
          <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={loadOrders}>
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="zs-card__description">Loading orders...</p>
        ) : error ? (
          <p style={{ color: 'var(--danger)' }}>{error}</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="zs-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const label = getStatusLabel(o)
                  return (
                    <tr key={o.invoice_id}>
                      <td>{o.invoice_id}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.item_name}</td>
                      <td>{formatUSD(Number(o.total_amount || o.final_amount || 0), { from: 'USD' })}</td>
                      <td>{o.payment_status || 'Pending'}</td>
                      <td>
                        <Badge tone={getTone(o)}>{label}</Badge>
                      </td>
                      <td>{formatDateTime(o.payment_date || o.appointment_date)}</td>
                      <td>
                        <div className="zs-table__actions">
                          <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => openOrder(o)}>
                            View
                          </button>
                          {(o.appointment_id || o.customer_order_id || o.id) && o.can_approve && (
                            <button type="button" className="zs-btn zs-btn--primary zs-btn--sm" onClick={() => approveOrder(o)}>
                              Approve
                            </button>
                          )}
                          {(o.appointment_id || o.customer_order_id || o.id) && o.can_cancel && (
                            <button type="button" className="zs-btn zs-btn--ghost zs-btn--sm" onClick={() => cancelOrder(o)}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Modal open={!!viewOrder} title={`Invoice #${viewOrder?.invoice_id || ''}`} onClose={() => setViewOrder(null)}>
        {viewOrder ? (
          <div>
            <p>
              <strong>{viewOrder.customer_name}</strong>
              <br />
              {viewOrder.customer_phone}
            </p>
            <p>
              Appointment:{' '}
              <strong>{viewOrder.appointment_date ? formatDateTime(viewOrder.appointment_date) : '--'}</strong>
            </p>
            <p>
              Status:{' '}
              <Badge tone={getTone(viewOrder)}>{viewOrder.status || viewOrder.payment_status || 'Pending'}</Badge>
            </p>
            <h4>Items</h4>
            <table className="zs-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line</th>
                  <th>Staff</th>
                </tr>
              </thead>
              <tbody>
                {(viewOrder.details || []).map((it) => (
                  <tr key={it.detail_id}>
                    <td>{it.item_name}</td>
                    <td>{it.item_type || 'Product'}</td>
                    <td>{it.quantity}</td>
                    <td>{formatUSD(Number(it.unit_price || 0), { from: 'USD' })}</td>
                    <td>{formatUSD(Number(it.line_total || 0), { from: 'USD' })}</td>
                    <td>{it.staff_name || '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem' }}>
              <div>Subtotal: {formatUSD(Number(viewOrder.subtotal || 0), { from: 'USD' })}</div>
              <div>
                <strong>Total: {formatUSD(Number(viewOrder.total_amount || 0), { from: 'USD' })}</strong>
              </div>
              <div>Payment: {viewOrder.payment_status || 'Pending'} / {viewOrder.payment_method || 'Cash'}</div>
              <div>Attendance: {viewOrder.attendance_status || 'Pending'}</div>
            </div>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </Modal>
    </div>
  )
}
