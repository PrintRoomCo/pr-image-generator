'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { ProductSelector } from '@/components/products/product-selector'
import { CostEstimator } from '@/components/shared/cost-estimator'
import { JobProgress } from '@/components/jobs/job-progress'
import { JobList } from '@/components/jobs/job-list'
import type { ProductWithViews } from '@/types/products'
import type { TechpackAssetType } from '@/types/techpacks'
import type { GenerationJob } from '@/types/jobs'

const AVAILABLE_TYPES: { value: TechpackAssetType; label: string; description: string }[] = [
  { value: 'flat-drawing', label: 'Flat Drawing', description: 'Technical line art front & back' },
  { value: 'construction-detail', label: 'Construction Detail', description: 'Seam, stitch & finish callouts' },
  { value: 'measurement-diagram', label: 'Measurement Diagram', description: 'Garment measurements with dimension lines' },
  { value: 'fabric-callout', label: 'Fabric Callout', description: 'Material spec sheet with swatch' },
  { value: 'color-spec', label: 'Color Spec', description: 'Pantone/hex/RGB color reference' },
]

export default function TechpacksPage() {
  const [products, setProducts] = useState<ProductWithViews[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<TechpackAssetType>>(new Set(['flat-drawing', 'measurement-diagram']))
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/jobs?jobType=techpack&limit=10').then(r => r.json()),
    ]).then(([productsData, jobsData]) => {
      setProducts(Array.isArray(productsData) ? productsData : [])
      setRecentJobs(Array.isArray(jobsData) ? jobsData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!activeJob || !['pending', 'processing'].includes(activeJob.status)) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${activeJob.id}`)
      const job = await res.json()
      setActiveJob(job)
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(interval)
        fetch('/api/jobs?jobType=techpack&limit=10').then(r => r.json()).then(setRecentJobs)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeJob])

  const handleGenerate = useCallback(async () => {
    if (selectedIds.size === 0 || selectedTypes.size === 0) return
    setGenerating(true)
    try {
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'techpack',
          productIds: Array.from(selectedIds),
          config: { assetTypes: Array.from(selectedTypes) },
        }),
      })
      const { job } = await createRes.json()
      setActiveJob(job)
      await fetch('/api/process?jobType=techpack', { method: 'POST' })
    } catch (error) {
      console.error('Failed to start generation:', error)
    } finally {
      setGenerating(false)
    }
  }, [selectedIds, selectedTypes])

  const totalImages = selectedIds.size * selectedTypes.size

  if (loading) return <div className="text-muted-foreground">Loading products...</div>

  return (
    <div>
      <Header
        title="Tech Pack Assets"
        description="Generate technical specification assets for manufacturing"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ProductSelector products={products} selectedIds={selectedIds} onSelectionChange={setSelectedIds} />
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Asset Types</h3>
            <div className="space-y-3">
              {AVAILABLE_TYPES.map(type => (
                <label key={type.value} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTypes.has(type.value)}
                    onChange={e => {
                      const next = new Set(selectedTypes)
                      if (e.target.checked) next.add(type.value)
                      else next.delete(type.value)
                      setSelectedTypes(next)
                    }}
                    className="rounded mt-0.5"
                  />
                  <div>
                    <span className="font-medium">{type.label}</span>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <CostEstimator totalImages={totalImages} includeBackgroundRemoval={false} />

          <button
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || selectedTypes.size === 0 || generating}
            className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {generating ? 'Starting...' : `Generate ${totalImages} Assets`}
          </button>

          {activeJob && <JobProgress job={activeJob} />}
        </div>
      </div>

      {recentJobs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Recent Tech Pack Jobs</h2>
          <JobList jobs={recentJobs} basePath="/techpacks" />
        </div>
      )}
    </div>
  )
}
