'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { JobList } from '@/components/jobs/job-list'
import type { GenerationJob } from '@/types/jobs'

export default function DashboardPage() {
  const [recentJobs, setRecentJobs] = useState<GenerationJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/jobs?limit=10')
      .then(res => res.json())
      .then(data => {
        setRecentJobs(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const stats = {
    total: recentJobs.length,
    processing: recentJobs.filter(j => j.status === 'processing').length,
    completed: recentJobs.filter(j => j.status === 'completed').length,
    failed: recentJobs.filter(j => j.status === 'failed').length,
  }

  return (
    <div>
      <Header title="Dashboard" description="AI-powered product image generation" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/views" className="border border-border rounded-lg p-6 hover:border-accent transition-colors">
          <h3 className="font-semibold text-lg">Design Tool Views</h3>
          <p className="text-sm text-muted-foreground mt-1">Generate left, right, back views for the design tool</p>
        </Link>
        <Link href="/ecommerce" className="border border-border rounded-lg p-6 hover:border-accent transition-colors">
          <h3 className="font-semibold text-lg">Ecommerce Images</h3>
          <p className="text-sm text-muted-foreground mt-1">Lifestyle, white-background, hero banners, size guides</p>
        </Link>
        <Link href="/techpacks" className="border border-border rounded-lg p-6 hover:border-accent transition-colors">
          <h3 className="font-semibold text-lg">Tech Pack Assets</h3>
          <p className="text-sm text-muted-foreground mt-1">Flat drawings, measurements, construction details</p>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Recent Jobs', value: stats.total, color: 'text-foreground' },
          { label: 'Processing', value: stats.processing, color: 'text-accent' },
          { label: 'Completed', value: stats.completed, color: 'text-success' },
          { label: 'Failed', value: stats.failed, color: 'text-destructive' },
        ].map(stat => (
          <div key={stat.label} className="border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <JobList jobs={recentJobs} />
      )}
    </div>
  )
}
