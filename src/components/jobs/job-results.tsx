'use client'

import type { PipelineResult } from '@/lib/pipelines/base-pipeline'

interface JobResultsProps {
  results: PipelineResult[]
}

export function JobResults({ results }: JobResultsProps) {
  if (results.length === 0) {
    return <p className="text-muted-foreground text-sm">No results yet</p>
  }

  return (
    <div className="space-y-6">
      {results.map(result => (
        <div key={result.productId} className="border border-border rounded-lg p-4">
          <h3 className="font-medium mb-3">{result.productName}</h3>

          {result.errors.length > 0 && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {result.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {result.generatedItems.map(item => (
              <div key={item.recordId} className="border border-border rounded overflow-hidden">
                <div className="aspect-square bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.storageUrl}
                    alt={`${result.productName} - ${item.type}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-2 text-xs text-muted-foreground text-center capitalize">
                  {item.type.replace('-', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
