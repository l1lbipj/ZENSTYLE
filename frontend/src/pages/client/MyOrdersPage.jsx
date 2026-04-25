import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Section from '../../components/ui/Section'
import businessApi from '../../Api/businessApi'
import { formatDateTime } from '../../utils/dateTime'
import { formatUSD } from '../../utils/money'

function toneForStatus(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed' || normalized === 'paid') return 'success'
  if (normalized === 'pending') return 'warning'
  if (normalized === 'confirmed') return 'accent'
  if (normalized === 'cancelled' || normalized === 'failed') return 'neutral'
  return 'neutral'
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [actionState, setActionState] = useState({ id: null, type: null })

  const loadOrders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await businessApi.myOrders({ per_page: 50 })
      setOrders(Array.isArray(res?.data?.data?.data) ? res.data.data.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load orders.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((order) => String(order.order_status || '').toLowerCase() === 'pending').length,
      completed: orders.filter((order) => String(order.order_status || '').toLowerCase() === 'completed').length,
    }),
    [orders],
  )

  const openDetails = (order) => {
    setSelectedOrder(order)
    setMessage('')
    setError('')
  }

  const closeDetails = () => {
    setSelectedOrder(null)
  }

  const handleCancel = async (order) => {
    setActionState({ id: order.id, type: 'cancel' })
    try {
      const res = await businessApi.cancelMyOrder(order.id)
      const updated = res?.data?.data
      setOrders((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      if (selectedOrder?.id === updated.id) {
        setSelectedOrder(updated)
      }
      setMessage('Order cancelled successfully.')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to cancel order.')
    } finally {
      setActionState({ id: null, type: null })
    }
  }

  return (
    <div className="zs-dashboard">
      <PageHeader
        title="My orders"
        subtitle="Track your COD product orders separately from appointments."
      />

      {message ? <div className="zs-feedback zs-feedback--success">{message}</div> : null}
      {error ? <div className="zs-feedback zs-feedback--error">{error}</div> : null}

      <div className="zs-dashboard__row">
        <Card title="Total orders" description="All product orders placed by you.">
          <h3 style={{ margin: 0 }}>{stats.total}</h3>
        </Card>
        <Card title="Pending orders" description="Orders waiting for fulfillment or COD settlement.">
          <h3 style={{ margin: 0 }}>{stats.pending}</h3>
        </Card>
        <Card title="Completed orders" description="Orders that have been fulfilled.">
          <h3 style={{ margin: 0 }}>{stats.completed}</h3>
        </Card>
      </div>

      <Section title="Order list" description="Your product orders are independent from appointments and do not use scheduling rules.">
        {loading ? <p className="zs-card__description">Loading orders...</p> : null}
        {!loading && orders.length === 0 ? (
          <Card title="No orders yet" description="Add products to your cart and place your first order.">
            <Link className="zs-btn zs-btn--primary zs-btn--sm" to="/products">
              Browse products
            </Link>
          </Card>
        ) : null}
        {!loading && orders.length > 0 ? (
          <div className="zs-feedback-list">
            {orders.map((order) => {
              const items = Array.isArray(order.items) ? order.items : []
              return (
                <article key={order.id} className="zs-feedback-item">
                  <header className="zs-feedback-item__header">
                    <div>
                      <h3>{order.order_number}</h3>
                      <p>{formatDateTime(order.order_date)}</p>
                      <p>{items.length} item{items.length === 1 ? '' : 's'}</p>
                    </div>
                    <div className="zs-feedback-item__status">
                      <Badge tone={toneForStatus(order.order_status)}>{order.order_status}</Badge>
                      <Badge tone={toneForStatus(order.payment_status)}>{order.payment_status}</Badge>
                    </div>
                  </header>
                  <p className="zs-feedback-item__comment">
                    {items.map((item) => `${item.product_name} x${item.quantity}`).join(', ')}
                  </p>
                  <div className="zs-feedback-reply-box">
                    {formatUSD(Number(order.final_amount || 0), { from: 'USD' })}
                  </div>
                  <div className="zs-action-row">
                    <Button type="button" variant="ghost" size="sm" onClick={() => openDetails(order)}>
                      View details
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={String(order.order_status || '').toLowerCase() !== 'pending' || actionState.id === order.id}
                      onClick={() => handleCancel(order)}
                    >
                      {actionState.id === order.id && actionState.type === 'cancel' ? 'Cancelling...' : 'Cancel'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : null}
      </Section>

      <Modal open={Boolean(selectedOrder)} title="Order details" onClose={closeDetails}>
        {selectedOrder ? (
          <div className="zs-feedback-detail">
            <div className="zs-feedback-detail__grid">
              <section>
                <h4>Order</h4>
                <p>{selectedOrder.order_number}</p>
                <p>{formatDateTime(selectedOrder.order_date)}</p>
              </section>
              <section>
                <h4>Status</h4>
                <p>{selectedOrder.order_status}</p>
                <p>{selectedOrder.payment_status}</p>
              </section>
              <section>
                <h4>Payment</h4>
                <p>{selectedOrder.payment_method}</p>
                <p>{formatUSD(Number(selectedOrder.final_amount || 0), { from: 'USD' })}</p>
              </section>
              <section>
                <h4>Items</h4>
                <ul className="zs-list">
                  {(selectedOrder.items || []).map((item) => (
                    <li key={item.id}>
                      {item.product_name} x{item.quantity}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
