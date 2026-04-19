import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../../services/products'
import { useCart } from '../../context/useCart'
import '../../styles/shop.css'

function formatPrice(value) {
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return n.toFixed(2)
}

export default function ProductListPage() {
  const { addItem } = useCart()
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 12, total: 0 })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cartHint, setCartHint] = useState(null)
  const hintTimerRef = useRef(null)

  const flashCartHint = useCallback((message) => {
    if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    setCartHint(message)
    hintTimerRef.current = window.setTimeout(() => setCartHint(null), 2400)
  }, [])

  const handleAddToCart = useCallback(
    (product) => {
      addItem(product, 1)
      flashCartHint(`${product.name} added to cart`)
    },
    [addItem, flashCartHint],
  )

  useEffect(
    () => () => {
      if (hintTimerRef.current) window.clearTimeout(hintTimerRef.current)
    },
    [],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      setLoading(true)
      setError(null)
    })

    productService
      .list(
        {
          page: pagination.current_page,
          per_page: pagination.per_page,
          search: search || undefined,
          category: category || undefined,
          sort,
        },
        controller.signal,
      )
      .then((res) => {
        if (controller.signal.aborted) return
        setProducts(Array.isArray(res?.items) ? res.items : [])
        setPagination((prev) => ({ ...prev, ...(res?.pagination || {}) }))
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError(err?.message || 'Failed to load products.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [category, pagination.current_page, pagination.per_page, search, sort])

  const empty = !loading && !error && products.length === 0

  const toolbar = useMemo(() => {
    const pageCount = Math.max(1, Number(pagination.last_page || 1))
    return (
      <div className="zs-shop__toolbar">
        <div className="zs-shop__filters">
          <label className="zs-sr-only" htmlFor="zs-shop-search">
            Search products
          </label>
          <input
            id="zs-shop-search"
            className="zs-shop__select"
            placeholder="Search by name"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPagination((prev) => ({ ...prev, current_page: 1 }))
            }}
          />

          <label className="zs-sr-only" htmlFor="zs-shop-category">
            Filter by category
          </label>
          <select
            id="zs-shop-category"
            className="zs-shop__select"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value)
              setPagination((prev) => ({ ...prev, current_page: 1 }))
            }}
          >
            <option value="">All categories</option>
            <option value="hair">Hair</option>
            <option value="skin">Skin</option>
          </select>

          <label className="zs-sr-only" htmlFor="zs-shop-per-page">
            Items per page
          </label>
          <select
            id="zs-shop-per-page"
            className="zs-shop__select"
            value={String(pagination.per_page || 12)}
            onChange={(event) => {
              setPagination((prev) => ({ ...prev, per_page: Number(event.target.value) || 12, current_page: 1 }))
            }}
          >
            <option value="8">8</option>
            <option value="12">12</option>
            <option value="24">24</option>
          </select>
        </div>

        <div className="zs-shop__sort">
          <label htmlFor="zs-shop-sort">Sort by:</label>
          <select
            id="zs-shop-sort"
            className="zs-shop__select"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value)
              setPagination((prev) => ({ ...prev, current_page: 1 }))
            }}
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="name_asc">Name: A to Z</option>
            <option value="name_desc">Name: Z to A</option>
          </select>
        </div>

        <div className="zs-shop__sort">
          <span>
            Page {pagination.current_page || 1} / {pageCount}
          </span>
        </div>
      </div>
    )
  }, [category, pagination.current_page, pagination.last_page, pagination.per_page, search, sort])

  return (
    <section className="zs-shop" aria-busy={loading} aria-live="polite">
      {cartHint ? (
        <p className="zs-shop__toast" role="status" aria-live="polite">
          {cartHint}
        </p>
      ) : null}
      <div className="zs-shop__header">
        <h1>Welcome to our online shop</h1>
        <p>
          Your ultimate destination for all things glamorous and self-care! Explore a world of beauty, where elegance
          meets innovation, and where you can discover a wide array of products to enhance your natural beauty and
          express your unique style.
        </p>
      </div>

      {toolbar}

      {loading && (
        <div className="zs-page-state" role="status">
          Loading products…
        </div>
      )}

      {error && (
        <div className="zs-page-state zs-page-state--error" role="alert">
          {error}
        </div>
      )}

      {empty && (
        <div className="zs-page-state" role="status">
          No products available right now. Please check back soon.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="zs-shop__grid">
          {products.map((product) => (
            <article key={product.id} className="zs-shop-card">
              <img src={product.image} alt={product.name} className="zs-shop-card__image" loading="lazy" />
              <div className="zs-shop-card__body">
                <h3>{product.name}</h3>
                <p>${formatPrice(product.price)}</p>
                <div className="zs-shop-card__actions">
                  <button type="button" onClick={() => handleAddToCart(product)}>
                    Add to cart
                  </button>
                  <Link to={`/products/${product.id}`}>Details</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <nav className="zs-shop__pagination" aria-label="Product list pagination">
          <button
            type="button"
            className="zs-shop__page"
            onClick={() => setPagination((prev) => ({ ...prev, current_page: Math.max(1, prev.current_page - 1) }))}
            disabled={(pagination.current_page || 1) <= 1}
          >
            Prev
          </button>
          {Array.from({ length: Math.min(5, pagination.last_page || 1) }, (_, idx) => {
            const base = Math.max(1, (pagination.current_page || 1) - 2)
            const page = Math.min(base + idx, pagination.last_page || 1)
            return (
              <button
                key={page}
                type="button"
                className={`zs-shop__page ${page === (pagination.current_page || 1) ? 'is-active' : ''}`}
                aria-current={page === (pagination.current_page || 1) ? 'page' : undefined}
                onClick={() => setPagination((prev) => ({ ...prev, current_page: page }))}
              >
                {page}
              </button>
            )
          })}
          <button
            type="button"
            className="zs-shop__page"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                current_page: Math.min(prev.last_page || 1, (prev.current_page || 1) + 1),
              }))
            }
            disabled={(pagination.current_page || 1) >= (pagination.last_page || 1)}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  )
}

