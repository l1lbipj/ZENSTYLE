import { useEffect, useState } from 'react'
import businessApi from '../../Api/businessApi'
import Modal from '../../components/ui/Modal'

export default function AdminOrdersPage() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState(null)
  const [viewOrder, setViewOrder] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    businessApi
      .myShopOrders()
      .then((res) => {
        const data = res?.data?.data || []
        if (mounted) setOrders(data)
      })
      .catch((err) => {
        if (mounted) setError(err?.response?.data?.message || err?.message || 'Failed to load orders')
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [])

  const openOrder = async (id) => {
    try {
      const res = await businessApi.shopOrderDetail(id)
      setViewOrder(res?.data?.data || null)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load order')
    }
  }

  const completeOrder = async (id) => {
    try {
      await businessApi.completeShopOrder(id)
      // refresh list and detail
      const res = await businessApi.myShopOrders()
      setOrders(res?.data?.data || [])
      if (viewOrder?.shop_order_id === id) {
        const det = await businessApi.shopOrderDetail(id)
        setViewOrder(det?.data?.data || null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to complete order')
    }
  }

  return (
    <section>
      <header>
        <h1>Shop Orders</h1>
        <p>View and inspect orders placed through the shop.</p>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="zs-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Promo</th>
                <th>Subtotal</th>
                <th>Shipping</th>
                <th>Discount</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.shop_order_id}>
                  <td>{o.shop_order_id}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.promo_code || '—'}</td>
                  <td>${Number(o.subtotal || 0).toFixed(2)}</td>
                  <td>${Number(o.shipping_fee || 0).toFixed(2)}</td>
                  <td>${Number(o.discount_amount || 0).toFixed(2)}</td>
                  <td>${Number(o.total_amount || 0).toFixed(2)}</td>
                  <td>{o.status}</td>
                  <td>{new Date(o.created_at).toLocaleString()}</td>
                  <td>
                    <button type="button" onClick={() => openOrder(o.shop_order_id)}>
                      View
                    </button>
                    {o.status === 'pending' && (
                      <button type="button" style={{ marginLeft: '0.5rem' }} onClick={() => completeOrder(o.shop_order_id)}>
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewOrder} title={`Order #${viewOrder?.shop_order_id || ''}`} onClose={() => setViewOrder(null)}>
        {viewOrder ? (
          <div>
            <p>
              <strong>{viewOrder.customer_name}</strong>
              <br />
              {viewOrder.customer_phone}
              <br />
              {viewOrder.shipping_address}
            </p>
            <h4>Items</h4>
            <table className="zs-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Line</th>
                </tr>
              </thead>
              <tbody>
                {viewOrder.items?.map((it) => (
                  <tr key={it.shop_order_item_id}>
                    <td>{it.product?.product_name || '—'}</td>
                    <td>{it.quantity}</td>
                    <td>${Number(it.unit_price || 0).toFixed(2)}</td>
                    <td>${Number(it.line_total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem' }}>
              <div>Subtotal: ${Number(viewOrder.subtotal || 0).toFixed(2)}</div>
              <div>Shipping: ${Number(viewOrder.shipping_fee || 0).toFixed(2)}</div>
              <div>Discount: ${Number(viewOrder.discount_amount || 0).toFixed(2)}</div>
              <div>
                <strong>Total: ${Number(viewOrder.total_amount || 0).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        ) : (
          <p>Loading…</p>
        )}
      </Modal>
    </section>
  )
}
