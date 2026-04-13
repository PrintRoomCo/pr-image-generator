'use client'

import { useState, useMemo } from 'react'
import type { ProductWithViews } from '@/types/products'

interface ProductSelectorProps {
  products: ProductWithViews[]
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
}

export function ProductSelector({ products, selectedIds, onSelectionChange }: ProductSelectorProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [missingOnly, setMissingOnly] = useState(false)

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category))
    return ['all', ...Array.from(cats).sort()]
  }, [products])

  const filtered = useMemo(() => {
    return products.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (missingOnly && p.missingViews.length === 0) return false
      return true
    })
  }, [products, search, categoryFilter, missingOnly])

  const toggleProduct = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const selectAll = () => {
    onSelectionChange(new Set(filtered.map(p => p.id)))
  }

  const selectNone = () => {
    onSelectionChange(new Set())
  }

  return (
    <div className="border border-border rounded-lg">
      <div className="p-4 border-b border-border space-y-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 border border-border rounded text-sm bg-background"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={missingOnly}
              onChange={e => setMissingOnly(e.target.checked)}
              className="rounded"
            />
            Missing views only
          </label>
          <div className="ml-auto flex gap-2">
            <button onClick={selectAll} className="text-xs text-accent hover:underline">Select all ({filtered.length})</button>
            <button onClick={selectNone} className="text-xs text-muted-foreground hover:underline">Clear</button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-border">
        {filtered.map(product => (
          <label key={product.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedIds.has(product.id)}
              onChange={() => toggleProduct(product.id)}
              className="rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{product.name}</p>
              <p className="text-xs text-muted-foreground">
                {product.category}
                {product.brand && ` - ${product.brand.name}`}
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {product.existingViews.length} views
              {product.missingViews.length > 0 && (
                <span className="text-warning ml-1">({product.missingViews.length} missing)</span>
              )}
            </div>
          </label>
        ))}
        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-sm">
            No products match your filters
          </div>
        )}
      </div>

      <div className="p-3 border-t border-border bg-muted text-sm text-muted-foreground">
        {selectedIds.size} of {filtered.length} products selected
      </div>
    </div>
  )
}
