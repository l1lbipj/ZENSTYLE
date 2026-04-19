import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { productService } from '../../services/products'
import { useCart } from '../../context/useCart'
import { clampCartQty } from '../../lib/cartStorage'
import '../../styles/shop.css'

function formatPrice(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(2)
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const { addItem } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [qty, setQty] = useState(1)
  const [addFeedback, setAddFeedback] = useState(null)
  const addFeedbackTimerRef = useRef(null)

  const adjustQty = useCallback((delta) => {
    setQty((q) => clampCartQty(q + delta))
  }, [])

  const handleQtyInput = useCallback((raw) => {
    const parsed = Number.parseInt(String(raw), 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      setQty(1)
      return
    }
    setQty(clampCartQty(parsed))
  }, [])

  const handleAddToCart = useCallback(() => {
    if (!product) return
    addItem(product, qty)
    if (addFeedbackTimerRef.current) window.clearTimeout(addFeedbackTimerRef.current)
    setAddFeedback(`Added ${qty} × ${product.name} to your cart.`)
    setQty(1)
    addFeedbackTimerRef.current = window.setTimeout(() => setAddFeedback(null), 4000)
  }, [addItem, product, qty])

  useEffect(() => {
    queueMicrotask(() => {
      setQty(1)
      setAddFeedback(null)
    })
  }, [id])

  useEffect(
    () => () => {
      if (addFeedbackTimerRef.current) window.clearTimeout(addFeedbackTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      setLoading(true)
      setError(null)
      setNotFound(false)
    })
    productService
      .getById(id, controller.signal)
      .then((item) => {
        if (controller.signal.aborted) return
        if (!item) {
          setNotFound(true)
          setProduct(null)
        } else {
          setProduct(item)
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err?.message || 'Failed to load product.')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [id])

  if (loading) {
    return (
      <div className="zs-shop zs-page-state" role="status">
        Loading product…
      </div>
    )
  }

  if (error) {
    return (
      <div className="zs-shop zs-page-state zs-page-state--error" role="alert">
        <p>{error}</p>
        <Link to="/products">Back to products</Link>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="zs-shop zs-page-state" role="status">
        <h1>Product not found</h1>
        <p>We could not find a product for this link.</p>
        <Link to="/products">Browse all products</Link>
      </div>
    )
  }

  return (
    <section className="zs-product" aria-labelledby="zs-product-title">
      <div className="zs-product__breadcrumbs">
        <Link to="/products">Products</Link> / <span>{product.name}</span>
      </div>
      <div className="zs-product__compact">
        <div className="zs-product__image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="zs-product__info">
          <div className="zs-product__header">
            <h1 id="zs-product-title">{product.name}</h1>
            <span className="zs-product__price">${formatPrice(product.price)}</span>
          </div>
          <p className="zs-product__desc">{product.description}</p>
          <div className="zs-product__meta">
            <span className="zs-product__pill">{product.category}</span>
            <span className="zs-product__pill zs-product__pill--accent">In stock</span>
          </div>
          {addFeedback ? (
            <p className="zs-shop__toast" role="status" aria-live="polite">
              {addFeedback}
            </p>
          ) : null}
          <div className="zs-product__actions">
            <div className="zs-product__qty">
              <button type="button" aria-label="Decrease quantity" onClick={() => adjustQty(-1)}>
                −
              </button>
              <label className="zs-sr-only" htmlFor="zs-product-qty">
                Quantity
              </label>
              <input
                id="zs-product-qty"
                type="number"
                min={1}
                max={999}
                value={qty}
                onChange={(event) => handleQtyInput(event.target.value)}
              />
              <button type="button" aria-label="Increase quantity" onClick={() => adjustQty(1)}>
                +
              </button>
            </div>
            <button type="button" onClick={handleAddToCart}>
              Add to cart
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

