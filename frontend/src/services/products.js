import { request } from './api'
import { getEntityImage } from '../utils/imageDataUrl'

export const productService = {
  mapApiProduct(apiProduct) {
    if (!apiProduct) return null
    return {
      id: apiProduct.product_id,
      name: apiProduct.product_name,
      price: Number(apiProduct.unit_price),
      image: getEntityImage(apiProduct, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'),
      description: apiProduct.description || '',
      category: apiProduct.category || 'hair',
      stock_quantity: apiProduct.stock_quantity,
    }
  },

  async list(params = {}, signal) {
    const qs = new URLSearchParams()
    const {
      page = 1,
      per_page = 12,
      search,
      category,
      min_price,
      max_price,
      sort,
      low_stock,
    } = params || {}

    qs.set('page', String(page))
    qs.set('per_page', String(per_page))
    if (search) qs.set('search', String(search))
    if (category) qs.set('category', String(category))
    if (min_price != null && min_price !== '') qs.set('min_price', String(min_price))
    if (max_price != null && max_price !== '') qs.set('max_price', String(max_price))
    if (sort) qs.set('sort', String(sort))
    if (low_stock != null) qs.set('low_stock', String(low_stock))

    const res = await request(`/products?${qs.toString()}`, { signal })
    const pageData = res?.data || {}

    const items = Array.isArray(pageData?.data) ? pageData.data.map((p) => this.mapApiProduct(p)).filter(Boolean) : []

    return {
      items,
      pagination: {
        current_page: pageData.current_page ?? 1,
        last_page: pageData.last_page ?? 1,
        per_page: pageData.per_page ?? per_page,
        total: pageData.total ?? items.length,
      },
    }
  },

  async getById(id, signal) {
    if (id == null || id === '') return null
    const res = await request(`/products/${id}`, { signal })
    return this.mapApiProduct(res?.data)
  },
}
