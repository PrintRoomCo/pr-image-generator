'use client'

import Link from 'next/link'
import type { GenerationJob } from '@/types/jobs'

interface JobListProps {
  jobs: GenerationJob[]
  basePath?: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

const TYPE_LABELS: Record<string, string> = {
  view: 'Design Tool Views',
  ecommerce: 'Ecommerce',
  techpack: 'Tech Pack',
}

export function JobList({ jobs, basePath }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No jobs found
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Products</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progress</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map(job => {
            const href = basePath
              ? `${basePath}/${job.id}`
              : `/${job.job_type === 'view' ? 'views' : job.job_type === 'ecommerce' ? 'ecommerce' : 'techpacks'}/${job.id}`

            return (
              <tr key={job.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={href} className="font-medium text-accent hover:underline">
                    {TYPE_LABELS[job.job_type] || job.job_type}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {job.product_ids.length} product{job.product_ids.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[job.status] || ''}`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {job.progress.completed}/{job.progress.total}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(job.created_at).toLocaleDateString()} {new Date(job.created_at).toLocaleTimeString()}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
