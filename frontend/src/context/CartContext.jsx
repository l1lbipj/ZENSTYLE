import { useCallback, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants'
import { CartContext } from './CartContextValue'
import { readCart, writeCart, clampCartQty } from '../lib/cartStorage'

function productImageUrl(product) {
  if (product?.image == null) return ''
  return typeof product.image === 'string' ? product.image : ''
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => readCart())

  useEffect(() => {
    writeCart(items)
  }, [items])

  useEffect(() => {
    const syncCart = () => {
      setItems(readCart())
    }

    const onStorage = (event) => {
      if (event.key === STORAGE_KEYS.CART || event.key === null) {
        syncCart()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('zs-auth-changed', syncCart)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('zs-auth-changed', syncCart)
    }
  }, [])

  const addItem = useCallback((product, qty = 1) => {
    const amount = clampCartQty(qty)
    const lineId = product?.id != null ? String(product.id).trim() : ''
    const price = Number(product?.price)
    if (!lineId || !Number.isFinite(price) || price < 0) return

    setItems((prev) => {
      const idx = prev.findIndex((line) => line.id === lineId)
      let next
      if (idx === -1) {
        next = [
          ...prev,
          {
            id: lineId,
            name: String(product.name ?? lineId).trim().slice(0, 240) || lineId,
            price,
            qty: amount,
            image: productImageUrl(product),
          },
        ]
      } else {
        next = [...prev]
        const line = next[idx]
        next[idx] = { ...line, qty: clampCartQty(line.qty + amount) }
      }
      return next
    })
  }, [])

  const updateQty = useCallback((lineId, nextQty) => {
    const safe = clampCartQty(nextQty)
    setItems((prev) => prev.map((line) => (line.id === lineId ? { ...line, qty: safe } : line)))
  }, [])

  const removeItem = useCallback((lineId) => {
    setItems((prev) => prev.filter((line) => line.id !== lineId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalQuantity = useMemo(() => items.reduce((sum, line) => sum + line.qty, 0), [items])

  const subtotal = useMemo(() => items.reduce((sum, line) => sum + line.price * line.qty, 0), [items])

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQty,
      removeItem,
      clearCart,
      totalQuantity,
      subtotal,
    }),
    [items, addItem, updateQty, removeItem, clearCart, totalQuantity, subtotal],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
