'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, ChevronDown } from 'lucide-react'

const FACILITIES = [
  { value: 'all', label: 'All Facilities' },
  { value: 'greenfield', label: 'Greenfield Skilled Nursing Center' },
  { value: 'maple_grove', label: 'Maple Grove Care Facility' },
  { value: 'sunrise', label: 'Sunrise Post-Acute Rehab' },
  { value: 'riverside', label: 'Riverside Nursing & Rehabilitation' },
  { value: 'oakwood', label: 'Oakwood Health & Recovery Center' },
  { value: 'lakeside', label: 'Lakeside Long-Term Care' },
  { value: 'willow_springs', label: 'Willow Springs Nursing Home' },
  { value: 'cedar_valley', label: 'Cedar Valley Care Center' },
  { value: 'brookside', label: 'Brookside Rehab & Nursing' },
  { value: 'silvercrest', label: 'Silvercrest Senior Living Center' },
]

const UNITS = [
  { value: 'all', label: 'All Units' },
  { value: '1A', label: '1A' },
  { value: '1B', label: '1B' },
  { value: '2A', label: '2A' },
  { value: '2B', label: '2B' },
  { value: '3A', label: '3A' },
  { value: '3B', label: '3B' },
  { value: '4A', label: '4A' },
  { value: '4B', label: '4B' },
]

interface DashboardHeaderProps {
  title: string
  selectedFacility?: string
  selectedUnit?: string
  onFacilityChange?: (value: string) => void
  onUnitChange?: (value: string) => void
  showFilters?: boolean
}

export function DashboardHeader({
  title,
  selectedFacility = 'all',
  selectedUnit = 'all',
  onFacilityChange,
  onUnitChange,
  showFilters = false,
}: DashboardHeaderProps) {
  const [isFacilityOpen, setIsFacilityOpen] = useState(false)
  const [isUnitOpen, setIsUnitOpen] = useState(false)
  const facilityRef = useRef<HTMLDivElement>(null)
  const unitRef = useRef<HTMLDivElement>(null)

  const selectedFacilityLabel = useMemo(
    () => FACILITIES.find((option) => option.value === selectedFacility)?.label ?? 'All Facilities',
    [selectedFacility]
  )
  const selectedUnitLabel = useMemo(
    () => UNITS.find((option) => option.value === selectedUnit)?.label ?? 'All Units',
    [selectedUnit]
  )

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (facilityRef.current && !facilityRef.current.contains(target)) {
        setIsFacilityOpen(false)
      }
      if (unitRef.current && !unitRef.current.contains(target)) {
        setIsUnitOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <header className="flex items-center justify-between px-8 py-6">
      <h1 className="text-[28px] font-normal text-text">{title}</h1>

      <div className="flex items-center gap-4">
        {showFilters && (
          <>
            <div ref={facilityRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsFacilityOpen((prev) => !prev)
                  setIsUnitOpen(false)
                }}
                className="flex h-9 min-w-[280px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-[10px] text-[12px] text-[#15141f]"
                style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}
              >
                <span>{selectedFacilityLabel}</span>
                <ChevronDown className="h-6 w-6 text-muted-text" />
              </button>
              {isFacilityOpen && (
                <div className="absolute right-0 z-50 mt-2 min-w-[280px] rounded-lg border border-border bg-white py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {FACILITIES.map((option) => {
                    const isSelected = option.value === selectedFacility
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-[#f9fafb]"
                        style={{ fontWeight: isSelected ? 500 : 400, color: isSelected ? '#7268dd' : '#111827' }}
                        onClick={() => {
                          onFacilityChange?.(option.value)
                          setIsFacilityOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div ref={unitRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsUnitOpen((prev) => !prev)
                  setIsFacilityOpen(false)
                }}
                className="flex h-9 min-w-[120px] items-center justify-between gap-2 rounded-lg border border-border bg-white px-[10px] text-[12px] text-[#15141f]"
                style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}
              >
                <span>{selectedUnitLabel}</span>
                <ChevronDown className="h-6 w-6 text-muted-text" />
              </button>
              {isUnitOpen && (
                <div className="absolute right-0 z-50 mt-2 min-w-[120px] rounded-lg border border-border bg-white py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {UNITS.map((option) => {
                    const isSelected = option.value === selectedUnit
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm text-text hover:bg-[#f9fafb]"
                        style={{ fontWeight: isSelected ? 500 : 400, color: isSelected ? '#7268dd' : '#111827' }}
                        onClick={() => {
                          onUnitChange?.(option.value)
                          setIsUnitOpen(false)
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Bell Icon */}
        <button className="p-2 hover:bg-background-2 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-text" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  )
}
