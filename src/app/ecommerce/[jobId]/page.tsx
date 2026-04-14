'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { JobProgress } from '@/components/jobs/job-progress'
import { JobResults } from '@/components/jobs/job-results'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { getEcommerceJobSummary, isEcommerceGenerationConfig } from '@/types/ecommerce'
import { normalizePipelineResults } from '@/types/pipeline-results'
import type { GenerationJob } from '@/types/jobs'

export default function EcommerceJobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params)
  const [job, setJob] = useState<GenerationJob | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/jobs/${jobId}`).then(r => r.json()).then(data => { setJob(data); setLoading(false) })
  }, [jobId])

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

  const results = normalizePipelineResults(job.results)

  return (
    <div>
      <Header
        title="Ecommerce Upload Job"
        description={`Job ${jobId.slice(0, 8)}...`}
        action={
          <Link href="/ecommerce" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Ecommerce
          </Link>
        }
      />
      <div className="mb-6"><JobProgress job={job} /></div>

      {isEcommerceGenerationConfig(job.config) && (
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="info">
              {job.config.mode === 'multi-angle-product' ? 'Multi-angle product' : 'Separate products'}
            </Badge>
            <Badge variant="secondary">{getEcommerceJobSummary(job.config)}</Badge>
            {job.config.imageTypes.map(type => (
              <Badge key={type} variant="outline">
                {type.replace('-', ' ')}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm font-medium">Prompt</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{job.config.prompt}</p>
        </Card>
      )}

      <h2 className="text-lg font-semibold mb-4">Results</h2>
      <JobResults results={results} />
    </div>
  )
}
