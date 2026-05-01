import { Sidebar } from './sidebar'
import { DashboardHeader } from './dashboard-header'

interface DashboardLayoutProps {
  children: React.ReactNode
  title: string
  selectedFacility?: string
  selectedUnit?: string
  onFacilityChange?: (value: string) => void
  onUnitChange?: (value: string) => void
  showFilters?: boolean
}

export function DashboardLayout({
  children,
  title,
  selectedFacility,
  selectedUnit,
  onFacilityChange,
  onUnitChange,
  showFilters = false,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[217px] min-h-screen bg-white">
        <DashboardHeader
          title={title}
          selectedFacility={selectedFacility}
          selectedUnit={selectedUnit}
          onFacilityChange={onFacilityChange}
          onUnitChange={onUnitChange}
          showFilters={showFilters}
        />
        <div className="px-8 pb-8">
          {children}
        </div>
      </main>
    </div>
  )
}
