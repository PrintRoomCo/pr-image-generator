'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { JobProgress } from '@/components/jobs/job-progress'
import { JobResults } from '@/components/jobs/job-results'
import type { GenerationJob } from '@/types/jobs'

export default function ViewJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchJob = async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      const data = await res.json()
      setJob(data)
      setLoading(false)
    }
    fetchJob()
  }, [jobId])

  // Poll if still processing
  useEffect(() => {
    if (!job || !['pending', 'processing'].includes(job.status)) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`)
      const data = await res.json()
      setJob(data)
      if (data.status === 'completed' || data.status === 'failed') clearInterval(interval)
    }, 2000)
    return () => clearInterval(interval)
  }, [job, jobId])

  if (loading) return <div className="text-muted-foreground">Loading...</div>
  if (!job) return <div className="text-destructive">Job not found</div>

  return (
    <div>
      <Header
        title="View Generation Job"
        description={`Job ${jobId.slice(0, 8)}...`}
        action={<Link href="/views" className="text-sm text-accent hover:underline">Back to Views</Link>}
      />

      <div className="mb-6">
        <JobProgress job={job} />
      </div>

      <h2 className="text-lg font-semibold mb-4">Results</h2>
      <JobResults results={(job.results || []) as any[]} />
    </div>
  )
}
