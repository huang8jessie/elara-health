import { Bell, ChevronDown, ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import patientsData from '@/data/patients.json'
import { cn } from '@/lib/utils'
import { PatientAvatar } from '@/components/PatientAvatar'

const complianceTabs = [
  {
    label: 'Order compliance',
    count: 56,
    badge: '100%',
    description: 'Patients with compliant orders',
    badgeClass: 'bg-[rgba(172,238,110,0.5)] text-[#4b5563]',
    active: false,
  },
  {
    label: 'MD note compliance',
    count: 22,
    badge: '39%',
    description: 'Patients with MD notes that confirm medical necessity',
    badgeClass: 'bg-[rgba(238,69,77,0.3)] text-[#4b5563]',
    active: true,
  },
  {
    label: 'Care plan compliance',
    count: 40,
    badge: '71%',
    description: 'Patients with complete care plans within 90 days',
    badgeClass: 'bg-[#fff1c2] text-[#4b5563]',
    active: false,
  },
  {
    label: 'Assessment compliance',
    count: 55,
    badge: '98%',
    description: 'Patients with daily assessments completed',
    badgeClass: 'bg-[rgba(172,238,110,0.5)] text-[#4b5563]',
    active: false,
  },
]

function mapDateAdded(dateValue: string) {
  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  const now = new Date()
  const diffMs = Math.abs(now.getTime() - parsed.getTime())
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return '1 day ago'
  return `${diffDays} days ago`
}

export default function AdminPage() {
  const rows = patientsData.patients.slice(0, 10)

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="relative ml-[217px] min-h-screen overflow-hidden bg-white">
        <div className="pointer-events-none px-8 pb-8">
          <header className="flex items-center justify-between py-6">
            <h1 className="text-[28px] font-normal text-text">Admin Dashboard</h1>

            <div className="flex items-center gap-4">
              <div className="flex h-9 min-w-[140px] items-center justify-between rounded-lg border border-border bg-white px-[10px] text-[12px] text-[#15141f]" style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}>
                <span>All Facilities</span>
                <ChevronDown className="h-6 w-6 text-muted-text" />
              </div>
              <div className="flex h-9 min-w-[120px] items-center justify-between rounded-lg border border-border bg-white px-[10px] text-[12px] text-[#15141f]" style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}>
                <span>All Units</span>
                <ChevronDown className="h-6 w-6 text-muted-text" />
              </div>
              <div className="rounded-lg p-2">
                <Bell className="h-5 w-5 text-text" strokeWidth={1.5} />
              </div>
            </div>
          </header>

          <section className="flex gap-0">
            {complianceTabs.map((tab) => (
              <div
                key={tab.label}
                className={cn(
                  'flex h-[160px] w-[223px] flex-col items-center justify-center rounded-tl-2xl rounded-tr-2xl p-8 text-center',
                  tab.active ? 'border-b-4 border-b-tertiary bg-[#f2f4f7]' : 'bg-transparent'
                )}
              >
                <span className="text-[16px] font-normal text-text">{tab.label}</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-[42px] font-light leading-none text-text">{tab.count}</span>
                  <span className={cn('rounded-2xl px-2 py-0.5 text-[12px] font-medium', tab.badgeClass)}>{tab.badge}</span>
                </div>
                <span className="mt-2 max-w-[180px] text-[12px] font-normal text-muted-text">{tab.description}</span>
              </div>
            ))}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-[16px] font-medium text-text">MD note compliance</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    disabled
                    className="h-9 w-[160px] rounded-full border border-border bg-white pl-9 pr-3 text-[12px] text-muted-text outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 text-[12px] text-secondary-text">
                  <span className="w-[92px] text-right tabular-nums">1 - 10 of 22</span>
                  <button type="button" disabled className="rounded p-1">
                    <ChevronLeft className="h-4 w-4 text-muted-text" />
                  </button>
                  <button type="button" disabled className="rounded p-1">
                    <ChevronRight className="h-4 w-4 text-muted-text" />
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-y-auto">
              <table className="w-full table-fixed">
                <thead className="bg-background-2">
                  <tr className="h-[40px] border-t border-border">
                    <th className="w-[40px] min-w-[40px] px-3 py-2">
                      <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
                    </th>
                    <th className="w-[180px] min-w-[180px] px-3 py-2 text-left text-[13px] font-normal text-text">Patient Name</th>
                    <th className="w-[120px] min-w-[120px] px-3 py-2 text-left text-[13px] font-normal text-text">Payer status</th>
                    <th className="w-[130px] min-w-[130px] px-3 py-2 text-left text-[13px] font-normal text-text">Primary payer</th>
                    <th className="w-[130px] min-w-[130px] px-3 py-2 text-left text-[13px] font-normal text-text">Diagnosis</th>
                    <th className="w-[100px] min-w-[100px] px-3 py-2 text-left text-[13px] font-normal text-text">Active orders</th>
                    <th className="w-[110px] min-w-[110px] px-3 py-2 text-left text-[13px] font-normal text-text">New symptoms</th>
                    <th className="w-[85px] min-w-[85px] px-3 py-2 text-left text-[13px] font-normal text-text">Date added</th>
                    <th className="w-[36px] min-w-[36px] px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((patient) => (
                    <tr key={patient.id} className="h-[52px] border-t border-border">
                      <td className="w-[40px] min-w-[40px] px-3 py-2">
                        <input type="checkbox" disabled className="h-4 w-4 rounded border-border" />
                      </td>
                      <td className="w-[180px] min-w-[180px] px-3 py-2">
                        <div className="flex items-center gap-2">
                          <PatientAvatar name={patient.name} photoUrl={patient.photoUrl} size={32} />
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-normal text-text">{patient.name}</div>
                            <div className="truncate text-[9px] uppercase tracking-[0.3px] text-muted-text">
                              MRN: {patient.mrn.replace('MRN-', '')} | DOB: {patient.dateOfBirth}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="w-[120px] min-w-[120px] px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className={cn(
                            'inline-flex w-fit items-center rounded-xl px-2 py-0.5 text-[11px] font-medium',
                            patient.payer.eligibility.toLowerCase() === 'eligible' ? 'bg-background-2 text-secondary-text' : 'bg-[#fff1c2] text-secondary-text'
                          )}>
                            {patient.payer.eligibility}
                          </span>
                        </div>
                      </td>
                      <td className="w-[130px] min-w-[130px] px-3 py-2 text-[12px] text-text">
                        <span className="line-clamp-2">{patient.payer.name}</span>
                      </td>
                      <td className="w-[130px] min-w-[130px] px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {[patient.diagnosis.primaryCode, ...patient.diagnosis.secondaryCodes].slice(0, 2).map((code, idx) => (
                            <span key={`${patient.id}-${code}-${idx}`} className="inline-flex items-center rounded-full bg-background-2 px-1.5 py-0.5 text-[10px] font-medium text-secondary-text">
                              {code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="w-[100px] min-w-[100px] px-3 py-2 text-center text-[12px] text-muted-text">{patient.orders.activeCount}</td>
                      <td className="w-[110px] min-w-[110px] px-3 py-2">
                        {patient.newSymptomCount > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-[#fef3f2] px-1.5 py-0.5 text-[10px] font-medium text-[#b3261e]">
                            {patient.newSymptomCount} symptom{patient.newSymptomCount > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-text">None</span>
                        )}
                      </td>
                      <td className="w-[85px] min-w-[85px] px-3 py-2 text-[12px] text-text">{mapDateAdded(patient.dateAdded)}</td>
                      <td className="w-[36px] min-w-[36px] px-2 py-2" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 25%, rgba(255,255,255,1) 60%)',
          }}
        >
          <div className="mt-[12vh] flex flex-col items-center gap-4 text-center">
            <h2 className="max-w-[520px] text-[52px] font-normal leading-[1.15] text-text">
              Admin Dashboard
              <br />
              coming soon
            </h2>
            <p className="max-w-[440px] text-[18px] leading-7 text-muted-text">Compliance reports and analytics</p>
          </div>
        </div>
      </main>
    </div>
  )
}
