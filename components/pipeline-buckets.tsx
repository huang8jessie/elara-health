'use client'

import { cn } from '@/lib/utils'

interface BucketData {
  id: string
  label: string
  count: number
  percentage?: number
  description: string
}

interface PipelineBucketsProps {
  activeBucket: string
  onBucketChange: (bucketId: string) => void
  summary: {
    active: number
    activePercentage: number
    assessForOrders: number
    assessForOrdersPercentage: number
    evaluateAndTreat: number
    evaluateAndTreatPercentage: number
    discontinueOrders: number
    discontinueOrdersPercentage: number
    allResidents: number
  }
}

export function PipelineBuckets({ activeBucket, onBucketChange, summary }: PipelineBucketsProps) {
  const buckets: BucketData[] = [
    {
      id: 'active',
      label: 'Active patients',
      count: summary.active,
      percentage: summary.activePercentage,
      description: 'Patients with active respiratory therapy orders'
    },
    {
      id: 'assess_for_orders',
      label: 'Assess for orders',
      count: summary.assessForOrders,
      percentage: summary.assessForOrdersPercentage,
      description: 'Patients with eligible payer and diagnosis'
    },
    {
      id: 'evaluate_and_treat',
      label: 'Evaluate & treat',
      count: summary.evaluateAndTreat,
      percentage: summary.evaluateAndTreatPercentage,
      description: 'Patients with incomplete evaluate & treat orders'
    },
    {
      id: 'discontinue_orders',
      label: 'Discontinue orders',
      count: summary.discontinueOrders,
      percentage: summary.discontinueOrdersPercentage,
      description: 'Patients with ineligible payer and active orders'
    },
    {
      id: 'all_residents',
      label: 'All residents',
      count: summary.allResidents,
      percentage: undefined,
      description: 'Patients with Active Census'
    }
  ]

  return (
    <div className="flex gap-0">
      {buckets.map((bucket) => {
        const isActive = activeBucket === bucket.id
        return (
          <button
            key={bucket.id}
            onClick={() => onBucketChange(bucket.id)}
            className={cn(
              'w-[223px] h-[160px] rounded-tl-[16px] rounded-tr-[16px] p-8 flex flex-col items-center justify-center text-center transition-all',
              isActive 
                ? 'bg-[#f2f4f7] border-b-4 border-b-tertiary' 
                : 'bg-transparent hover:bg-background-2/50'
            )}
          >
            <span className="text-[16px] font-normal text-text">
              {bucket.label}
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-[42px] font-light text-text leading-none">
                {bucket.count}
              </span>
              {bucket.percentage !== undefined && (
                <span className="text-[12px] font-medium text-secondary-text bg-[#e5e7eb] px-2 py-0.5 rounded-[16px]">
                  {bucket.percentage}%
                </span>
              )}
            </div>
            <span className="mt-2 max-w-[180px] text-[12px] font-normal text-[#4b5563]">
              {bucket.description}
            </span>
          </button>
        )
      })}
    </div>
  )
}
