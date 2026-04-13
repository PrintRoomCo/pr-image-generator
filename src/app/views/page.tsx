'use client'

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { ProductSelector } from '@/components/products/product-selector'
import { CostEstimator } from '@/components/shared/cost-estimator'
import { JobProgress } from '@/components/jobs/job-progress'
import { JobList } from '@/components/jobs/job-list'
import type { ProductWithViews } from '@/types/products'
import type { ViewType } from '@/types/views'
import type { GenerationJob } from '@/types/jobs'

const AVAILABLE_VIEWS: ViewType[] = ['left', 'right', 'back']

export default function ViewsPage() {
  const [products, setProducts] = useState<ProductWithViews[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedViews, setSelectedViews] = useState<Set<ViewType>>(new Set(AVAILABLE_VIEWS))
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null)
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/jobs?jobType=view&limit=10').then(r => r.json()),
    ]).then(([productsData, jobsData]) => {
      setProducts(Array.isArray(productsData) ? productsData : [])
      setRecentJobs(Array.isArray(jobsData) ? jobsData : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // Poll active job
  useEffect(() => {
    if (!activeJob || !['pending', 'processing'].includes(activeJob.status)) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${activeJob.id}`)
      const job = await res.json()
      setActiveJob(job)
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(interval)
        // Refresh recent jobs
        fetch('/api/jobs?jobType=view&limit=10').then(r => r.json()).then(setRecentJobs)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [activeJob])

  const handleGenerate = useCallback(async () => {
    if (selectedIds.size === 0 || selectedViews.size === 0) return
    setGenerating(true)

    try {
      // Create job
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType: 'view',
          productIds: Array.from(selectedIds),
          config: { views: Array.from(selectedViews) },
        }),
      })
      const { job } = await createRes.json()
      setActiveJob(job)

      // Trigger processing
      await fetch('/api/process?jobType=view', { method: 'POST' })
    } catch (error) {
      console.error('Failed to start generation:', error)
    } finally {
      setGenerating(false)
    }
  }, [selectedIds, selectedViews])

  const totalImages = selectedIds.size * selectedViews.size

  if (loading) return <div className="text-muted-foreground">Loading products...</div>

  return (
    <div>
      <Header
        title="Design Tool Views"
        description="Generate product view images (left, right, back) for the design tool"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <ProductSelector
            products={products}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium mb-3">Views to Generate</h3>
            <div className="space-y-2">
              {AVAILABLE_VIEWS.map(view => (
                <label key={view} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedViews.has(view)}
                    onChange={e => {
                      const next = new Set(selectedViews)
                      if (e.target.checked) next.add(view)
                      else next.delete(view)
                      setSelectedViews(next)
                    }}
                    className="rounded"
                  />
                  <span className="capitalize">{view}</span>
                </label>
              ))}
            </div>
          </div>

          <CostEstimator totalImages={totalImages} includeBackgroundRemoval />

          <button
            onClick={handleGenerate}
            disabled={selectedIds.size === 0 || selectedViews.size === 0 || generating}
            className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {generating ? 'Starting...' : `Generate ${totalImages} Images`}
          </button>

          {activeJob && <JobProgress job={activeJob} />}
        </div>
      </div>

      {recentJobs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Recent View Jobs</h2>
          <JobList jobs={recentJobs} basePath="/views" />
        </div>
      )}
    </div>
  )
}
