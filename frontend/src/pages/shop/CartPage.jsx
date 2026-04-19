import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../../context/useCart'
import { useAuth } from '../../context/useAuth'
import { CART_PROMO, getCartPromoDiscountRate, STORAGE_KEYS } from '../../constants'
import '../../styles/shop.css'
import Modal from '../../components/ui/Modal'
import businessApi from '../../Api/businessApi'

const SHIPPING_FLAT = 5

function readSessionPromo() {
  try {
    const v = sessionStorage.getItem(STORAGE_KEYS.CART_PROMO_SESSION)
    if (v === CART_PROMO.ZEN10 || v === CART_PROMO.ZEN20) return v
  } catch {
    /* private mode */
  }
  return CART_PROMO.NONE
}

function writeSessionPromo(code) {
  try {
    if (code === CART_PROMO.NONE) {
      sessionStorage.removeItem(STORAGE_KEYS.CART_PROMO_SESSION)
    } else {
      sessionStorage.setItem(STORAGE_KEYS.CART_PROMO_SESSION, code)
    }
  } catch {
    /* ignore */
  }
}

function promoLabel(code) {
  if (code === CART_PROMO.ZEN10) return 'ZENSTYLE10 — 10% off'
  if (code === CART_PROMO.ZEN20) return 'ZENSTYLE20 — 20% off'
  return ''
}

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [pendingPromo, setPendingPromo] = useState(readSessionPromo)
  const [appliedPromo, setAppliedPromo] = useState(readSessionPromo)
  const [promoMessage, setPromoMessage] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)
  const [checkoutDone, setCheckoutDone] = useState(null)
  const [shippingForm, setShippingForm] = useState({
    name: user?.name || '',
    phone: '',
    address: '',
    note: '',
  })

  useEffect(() => {
    if (items.length === 0) {
      queueMicrotask(() => {
        setAppliedPromo(CART_PROMO.NONE)
        setPendingPromo(CART_PROMO.NONE)
        writeSessionPromo(CART_PROMO.NONE)
        setPromoMessage(null)
      })
    }
  }, [items.length])

  useEffect(() => {
    setShippingForm((prev) => ({ ...prev, name: user?.name || prev.name }))
  }, [user?.name])

  const promoForTotals = items.length === 0 ? CART_PROMO.NONE : appliedPromo
  const discountRate = getCartPromoDiscountRate(promoForTotals)
  const shipping = subtotal > 0 ? SHIPPING_FLAT : 0
  const discount = subtotal * discountRate
  const total = Math.max(0, subtotal + shipping - discount)

  const applyPromo = () => {
    setPromoMessage(null)
    if (items.length === 0) {
      setPromoMessage({ type: 'error', text: 'Your cart is empty.' })
      return
    }
    if (pendingPromo === CART_PROMO.NONE) {
      setAppliedPromo(CART_PROMO.NONE)
      writeSessionPromo(CART_PROMO.NONE)
      setPromoMessage({ type: 'info', text: 'Promo code removed.' })
      return
    }
    setAppliedPromo(pendingPromo)
    writeSessionPromo(pendingPromo)
    setPromoMessage({ type: 'success', text: `Applied: ${promoLabel(pendingPromo)}.` })
  }

  const handleQtyInput = (id, raw) => {
    const parsed = Number.parseInt(String(raw), 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      updateQty(id, 1)
      return
    }
    updateQty(id, parsed)
  }

  const lineSummaries = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        lineTotal: item.price * item.qty,
      })),
    [items],
  )

  const openCheckout = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setCheckoutError(null)
    setCheckoutDone(null)
    setCheckoutOpen(true)
  }

  const submitCheckout = async (event) => {
    event.preventDefault()
    setCheckoutError(null)
    setCheckoutDone(null)

    if (!shippingForm.name.trim() || !shippingForm.phone.trim() || !shippingForm.address.trim()) {
      setCheckoutError('Please fill name, phone, and address.')
      return
    }

    const payload = {
      items: items.map((line) => ({
        product_id: Number(line.id),
        quantity: line.qty,
      })),
      promo_code: appliedPromo === CART_PROMO.NONE ? null : appliedPromo,
      payment_method: 'cod',
      shipping: {
        name: shippingForm.name.trim(),
        phone: shippingForm.phone.trim(),
        address: shippingForm.address.trim(),
        note: shippingForm.note?.trim() || null,
      },
    }

    try {
      setCheckoutSubmitting(true)
      const res = await businessApi.checkoutCart(payload)
      const order = res?.data?.data || null
      setCheckoutDone(order)
      clearCart()
      setAppliedPromo(CART_PROMO.NONE)
      setPendingPromo(CART_PROMO.NONE)
      writeSessionPromo(CART_PROMO.NONE)
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Checkout failed. Please try again.'
      setCheckoutError(msg)
    } finally {
      setCheckoutSubmitting(false)
    }
  }

  return (
    <section className="zs-cart">
      <header className="zs-cart__header">
        <h1>Your cart</h1>
        <p>Review your selected items and proceed to checkout when ready.</p>
      </header>

      <div className="zs-cart__layout">
        <div className="zs-cart__items">
          {items.length === 0 ? (
            <div className="zs-cart-empty">
              <h3>Your cart is empty</h3>
              <p>Add a few of our favorites to continue shopping.</p>
              <Link to="/products" className="zs-cart__checkout">
                Browse products
              </Link>
            </div>
          ) : (
            lineSummaries.map((item) => (
              <article key={item.id} className="zs-cart-item">
                {item.image ? (
                  <img src={item.image} alt="" className="zs-cart-item__image" width={120} height={120} />
                ) : (
                  <div className="zs-cart-item__image zs-cart-item__image--placeholder" aria-hidden />
                )}
                <div className="zs-cart-item__info">
                  <h3>
                    <Link to={`/products/${item.id}`}>{item.name}</Link>
                  </h3>
                  <p>${item.price.toFixed(2)} each</p>
                  <div className="zs-cart-item__actions">
                    <div className="zs-qty">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${item.name}`}
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        aria-label={`Quantity for ${item.name}`}
                        value={item.qty}
                        onChange={(event) => handleQtyInput(item.id, event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${item.name}`}
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button type="button" className="zs-cart-item__remove" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="zs-cart-item__total">${item.lineTotal.toFixed(2)}</div>
              </article>
            ))
          )}
        </div>

        {items.length > 0 && (
          <aside className="zs-cart__summary" aria-label="Order summary">
            <div className="zs-cart__card">
              <h2>Order summary</h2>
              <div className="zs-cart__row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="zs-cart__row">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="zs-cart__row">
                <span>
                  {appliedPromo !== CART_PROMO.NONE && items.length > 0
                    ? `Discount (${appliedPromo === CART_PROMO.ZEN10 ? '10%' : '20%'})`
                    : 'Discount'}
                </span>
                <span>-${discount.toFixed(2)}</span>
              </div>
              <div className="zs-cart__total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>
              <button type="button" className="zs-cart__checkout" onClick={openCheckout}>
                Proceed to checkout
              </button>
            </div>
            <div className="zs-cart__promo">
              <span className="zs-cart__promo-label" id="zs-cart-promo-heading">
                Promo code
              </span>
              <div className="zs-cart__promo-input" role="group" aria-labelledby="zs-cart-promo-heading">
                <label htmlFor="zs-cart-promo-select" className="zs-sr-only">
                  Select promo code
                </label>
                <select
                  id="zs-cart-promo-select"
                  value={pendingPromo}
                  onChange={(event) => setPendingPromo(event.target.value)}
                >
                  <option value={CART_PROMO.NONE}>No code</option>
                  <option value={CART_PROMO.ZEN10}>ZENSTYLE10 — 10% off</option>
                  <option value={CART_PROMO.ZEN20}>ZENSTYLE20 — 20% off</option>
                </select>
                <button type="button" onClick={applyPromo}>
                  Apply
                </button>
              </div>
              {items.length > 0 && appliedPromo !== CART_PROMO.NONE && (
                <p className="zs-cart__promo-active" role="status">
                  <span className="zs-cart__promo-applied-badge">Applied</span>
                  <span className="zs-cart__promo-applied-detail">{promoLabel(appliedPromo)}</span>
                </p>
              )}
              {promoMessage && (
                <p
                  className={
                    promoMessage.type === 'error'
                      ? 'zs-cart__promo-msg zs-cart__promo-msg--error'
                      : promoMessage.type === 'success'
                        ? 'zs-cart__promo-msg zs-cart__promo-msg--success'
                        : 'zs-cart__promo-msg'
                  }
                  role={promoMessage.type === 'error' ? 'alert' : 'status'}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>
          </aside>
        )}
      </div>

      <Modal
        open={checkoutOpen}
        title={checkoutDone ? 'Order placed' : 'Checkout'}
        onClose={() => {
          if (checkoutSubmitting) return
          setCheckoutOpen(false)
        }}
      >
        {checkoutDone ? (
          <div>
            <p>
              Thanks, <strong>{checkoutDone.customer_name}</strong>. Your order #{checkoutDone.shop_order_id} was created.
            </p>
            <p>
              Total: <strong>${Number(checkoutDone.total_amount || 0).toFixed(2)}</strong> ({checkoutDone.payment_method?.toUpperCase?.() || 'COD'})
            </p>
            <button
              type="button"
              className="zs-cart__checkout"
              onClick={() => setCheckoutOpen(false)}
            >
              Close
            </button>
          </div>
        ) : (
          <form className="zs-form" onSubmit={submitCheckout}>
            {checkoutError ? (
              <p className="zs-cart__promo-msg zs-cart__promo-msg--error" role="alert">
                {checkoutError}
              </p>
            ) : null}

            <input
              className="zs-input"
              placeholder="Full name"
              value={shippingForm.name}
              onChange={(e) => setShippingForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              className="zs-input"
              placeholder="Phone"
              value={shippingForm.phone}
              onChange={(e) => setShippingForm((p) => ({ ...p, phone: e.target.value }))}
              required
            />
            <input
              className="zs-input"
              placeholder="Shipping address"
              value={shippingForm.address}
              onChange={(e) => setShippingForm((p) => ({ ...p, address: e.target.value }))}
              required
            />
            <input
              className="zs-input"
              placeholder="Note (optional)"
              value={shippingForm.note}
              onChange={(e) => setShippingForm((p) => ({ ...p, note: e.target.value }))}
            />

            <div className="zs-cart__row" style={{ marginTop: '0.75rem' }}>
              <span>Total</span>
              <span>
                <strong>${total.toFixed(2)}</strong>
              </span>
            </div>

            <div className="zs-action-row">
              <button type="submit" className="zs-btn zs-btn--primary" disabled={checkoutSubmitting}>
                {checkoutSubmitting ? 'Placing order…' : 'Place order (COD)'}
              </button>
              <button
                type="button"
                className="zs-btn zs-btn--ghost"
                onClick={() => setCheckoutOpen(false)}
                disabled={checkoutSubmitting}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  )
}
