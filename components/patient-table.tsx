'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  AlertCircle,
  TrendingUp,
  Check,
  ArrowUpRight,
  ChevronsUpDown,
  ChevronUp,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PatientAvatar } from '@/components/PatientAvatar'

interface Patient {
  id: string
  name: string
  mrn: string
  dob: string
  avatar: string
  photoUrl?: string
  payerStatus: string
  payerStatusType: 'eligible' | 'ineligible' | 'pending'
  payerNote: string | null
  primaryPayer: string
  diagnosis: string[]
  activeOrders: number
  newSymptoms: number
  dateAdded: string
  buckets: string[]
  vitals?: {
    spo2: number
    respiratoryRate: number
    heartRate: number
    bloodPressure: string
    temperature: number
  }
  lastNote?: string
  vitalSeverity?: 'critical' | 'moderate' | 'stable'
  primaryDiagnosisCode?: string
  primaryDiagnosisDesc?: string
  respiratoryOrders?: string[]
}

interface PatientTableProps {
  patients: Patient[]
  activeBucket: string
  onNavigateToPatient?: () => void
}

export function PatientTable({ patients, activeBucket, onNavigateToPatient }: PatientTableProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)
  const [pinnedRowId, setPinnedRowId] = useState<string | null>(null)
  const [selectedAll, setSelectedAll] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(0)
  const [sortConfig, setSortConfig] = useState<{
    column: string | null
    direction: 'asc' | 'desc' | null
  }>({ column: null, direction: null })
  const itemsPerPage = 12

  function parseDaysAgo(d: string): number {
    if (d.toLowerCase() === 'today') return 0
    const m = d?.match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  }

  function handleSort(column: string) {
    setSortConfig((prev) => {
      if (prev.column !== column) return { column, direction: 'asc' }
      if (prev.direction === 'asc') return { column, direction: 'desc' }
      if (prev.direction === 'desc') return { column: null, direction: null }
      return { column, direction: 'asc' }
    })
  }

  const filteredPatients = patients.filter(patient => {
    const matchesBucket = patient.buckets.includes(activeBucket)
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          patient.mrn.includes(searchQuery)
    return matchesBucket && matchesSearch
  })

  const sortedPatients = useMemo(() => {
    const list = [...filteredPatients]
    const { column: col, direction: dir } = sortConfig
    if (!col || !dir) {
      return list.sort((a, b) => parseDaysAgo(a.dateAdded) - parseDaysAgo(b.dateAdded))
    }

    return list.sort((a, b) => {
      let vA: string | number = 0
      let vB: string | number = 0

      if (col === 'name') {
        vA = a.name.split(' ').slice(-1)[0].toLowerCase()
        vB = b.name.split(' ').slice(-1)[0].toLowerCase()
      }
      if (col === 'payerStatus') {
        vA = a.payerStatus === 'Eligible' ? 0 : 1
        vB = b.payerStatus === 'Eligible' ? 0 : 1
      }
      if (col === 'primaryPayer') {
        vA = a.primaryPayer.toLowerCase()
        vB = b.primaryPayer.toLowerCase()
      }
      if (col === 'diagnosis') {
        vA = a.diagnosis.length
        vB = b.diagnosis.length
      }
      if (col === 'activeOrders') {
        vA = a.activeOrders
        vB = b.activeOrders
      }
      if (col === 'symptoms') {
        vA = a.newSymptoms
        vB = b.newSymptoms
      }
      if (col === 'dateAdded') {
        vA = parseDaysAgo(a.dateAdded)
        vB = parseDaysAgo(b.dateAdded)
      }

      if (vA < vB) return dir === 'asc' ? -1 : 1
      if (vA > vB) return dir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredPatients, sortConfig])

  const pageCount = Math.max(1, Math.ceil(sortedPatients.length / itemsPerPage))

  const paginatedPatients = useMemo(() => {
    const start = currentPage * itemsPerPage
    return sortedPatients.slice(start, start + itemsPerPage)
  }, [currentPage, sortedPatients])

  const firstItem = sortedPatients.length === 0 ? 0 : currentPage * itemsPerPage + 1
  const lastItem = Math.min((currentPage + 1) * itemsPerPage, sortedPatients.length)
  const hasSelection = selectedIds.size > 0

  useEffect(() => {
    setCurrentPage(0)
  }, [activeBucket, searchQuery])

  useEffect(() => {
    if (currentPage > pageCount - 1) {
      setCurrentPage(Math.max(0, pageCount - 1))
    }
  }, [currentPage, pageCount])

  useEffect(() => {
    setSelectedIds(new Set())
    setSelectedAll(false)
  }, [sortConfig, activeBucket])

  const allVisibleIds = paginatedPatients.map((patient) => patient.id)
  const allVisibleSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id))
  const someVisibleSelected = allVisibleIds.some((id) => selectedIds.has(id))
  const isIndeterminate = someVisibleSelected && !allVisibleSelected

  useEffect(() => {
    setSelectedAll(allVisibleSelected)
  }, [allVisibleSelected])

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      const next = new Set(selectedIds)
      allVisibleIds.forEach((id) => next.delete(id))
      setSelectedIds(next)
      setSelectedAll(false)
      return
    }

    const next = new Set(selectedIds)
    allVisibleIds.forEach((id) => next.add(id))
    setSelectedIds(next)
    setSelectedAll(true)
  }

  const toggleRowSelection = (patientId: string) => {
    const next = new Set(selectedIds)
    if (next.has(patientId)) {
      next.delete(patientId)
    } else {
      next.add(patientId)
    }
    setSelectedIds(next)
    const allChecked = allVisibleIds.length > 0 && allVisibleIds.every((id) => next.has(id))
    setSelectedAll(allChecked)
  }

  function handleExport() {
    const selected = sortedPatients.filter((p) => selectedIds.has(p.id))
    const headers = [
      'Patient Name', 'MRN', 'Date of Birth', 'Room Number',
      'Payer Status', 'Primary Payer', 'Primary Diagnosis',
      'Active Orders', 'New Symptoms', 'Date Added',
    ]
    const rows = selected.map((p) => [
      p.name,
      p.mrn,
      p.dob,
      '--',
      p.payerStatus,
      p.primaryPayer,
      `${p.primaryDiagnosisCode ?? p.diagnosis[0] ?? ''} — ${p.primaryDiagnosisDesc ?? ''}`,
      p.activeOrders,
      p.newSymptoms,
      p.dateAdded,
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `patients_export_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const bucketLabels: Record<string, string> = {
    'active': 'Active patients',
    'assess_for_orders': 'Assess for orders',
    'evaluate_and_treat': 'Evaluate & treat',
    'discontinue_orders': 'Discontinue orders',
    'all_residents': 'All residents'
  }

  const navigateToPatient = (patientId: string) => {
    onNavigateToPatient?.()
    router.push(`/patients/${patientId}`)
  }

  const handleRowClick = (patientId: string, e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-expand-arrow]') || target.closest('[data-patient-name]')) {
      return
    }
    navigateToPatient(patientId)
  }

  const handleNameClick = (patientId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigateToPatient(patientId)
  }

  const severityColor = (severity?: string) => {
    if (severity === 'critical') return 'text-[#ee454d]'
    if (severity === 'moderate') return 'text-[#f59e0b]'
    return 'text-[#059669]'
  }

  const severityLabel = (severity?: string) => {
    if (severity === 'critical') return 'Critical'
    if (severity === 'moderate') return 'Moderate'
    return 'Stable'
  }

  const formatNoteSummary = (note: string) => {
    const regex = /(\bSpO₂\s*\d+%\b|\bRR\s*\d+\/min\b|\b\d+L\s*NC\b)/gi
    const parts = note.split(regex)

    return parts.map((part, index) => {
      if (part.match(regex)) {
        return <strong key={`${part}-${index}`}>{part}</strong>
      }
      return <span key={`${part}-${index}`}>{part}</span>
    })
  }

  const getOrders = (patient: Patient) => {
    const respiratoryOrders = Array.isArray(patient.respiratoryOrders)
      ? patient.respiratoryOrders.filter((order): order is string => typeof order === 'string' && order.trim().length > 0)
      : []

    if (respiratoryOrders.length > 0) {
      return respiratoryOrders
    }

    return Array.from({ length: Math.max(1, Math.min(patient.activeOrders || 1, 3)) }, () =>
      `Document ${patient.primaryDiagnosisDesc ?? 'respiratory condition'} — ${patient.primaryDiagnosisCode ?? 'R06.00'}. Four times a day.`
    )
  }

  const getBloodPressureParts = (bloodPressure: string | undefined) => {
    const [sys = '120', dia = '80'] = (bloodPressure || '120/80').split('/')
    return { sys, dia }
  }

  function SortIcon({ column }: { column: string }) {
    const active = sortConfig.column === column
    const dir = active ? sortConfig.direction : null
    return (
      <span className={active ? 'text-[#7268dd]' : 'text-[#9ca3af]'}>
        {dir === 'asc' ? <ChevronUp size={14} /> : dir === 'desc' ? <ChevronDown size={14} /> : <ChevronsUpDown size={14} />}
      </span>
    )
  }

  function SelectionCheckbox({
    checked,
    indeterminate = false,
    onClick,
    ariaLabel,
  }: {
    checked: boolean
    indeterminate?: boolean
    onClick: () => void
    ariaLabel: string
  }) {
    const isActive = checked || indeterminate
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        aria-label={ariaLabel}
        aria-checked={indeterminate ? 'mixed' : checked}
        role="checkbox"
        className={cn(
          'flex h-5 w-5 items-center justify-center rounded-[6px] border transition-colors duration-150',
          isActive ? 'border-[#7268dd]' : 'border-[#e5e7eb] bg-white',
          checked ? 'bg-[#7268dd] text-white' : 'bg-white text-[#7268dd]'
        )}
      >
        {checked ? <Check className="h-3.5 w-3.5" /> : indeterminate ? <Minus className="h-3.5 w-3.5" /> : null}
      </button>
    )
  }

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden" style={{ height: '640px' }}>
      {/* Table Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-[16px] font-medium text-text">
          {bucketLabels[activeBucket] || 'Patients'}
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={hasSelection ? handleExport : undefined}
            disabled={!hasSelection}
            className={`flex items-center gap-1.5 px-[14px] py-[6px] rounded-lg border text-[14px] transition-all duration-150 ${
              hasSelection
                ? 'bg-[#111827] border-[#111827] text-white cursor-pointer hover:bg-[#1f2937] hover:border-[#1f2937] active:bg-[#374151]'
                : 'bg-transparent border-[#e5e7eb] text-[#d1d5db] cursor-not-allowed'
            }`}
          >
            Export <ArrowUpRight size={14} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-[160px] h-9 pl-9 pr-3 text-[12px] border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-tertiary/20 focus:border-tertiary"
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-secondary-text">
            <span className="w-[120px] text-right tabular-nums">{firstItem} – {lastItem} of {sortedPatients.length}</span>
            <button
              className="p-1 hover:bg-background-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4 text-muted-text" />
            </button>
            <button
              className="p-1 hover:bg-background-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={currentPage >= pageCount - 1}
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
            >
              <ChevronRight className="w-4 h-4 text-muted-text" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="patient-table-scroll overflow-y-auto" style={{ maxHeight: 'calc(640px - 72px)' }}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="sticky top-0 z-10 h-[40px] border-b border-[#e5e7eb] bg-white">
              <th className="w-[40px] min-w-[40px] pl-4 py-2">
                <div className="flex items-center gap-3">
                  <SelectionCheckbox
                    checked={selectedAll}
                    indeterminate={isIndeterminate}
                    onClick={toggleAllVisible}
                    ariaLabel="Select all visible patients"
                  />
                </div>
              </th>
              <th className="w-[180px] min-w-[180px] px-3 py-2 text-left">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-left">
                  <span className={`text-[14px] font-normal ${sortConfig.column === 'name' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                    Patient Name
                  </span>
                  <SortIcon column="name" />
                </button>
              </th>
              <th className="w-[120px] min-w-[120px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('payerStatus')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'payerStatus' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      Payer status
                    </span>
                    <SortIcon column="payerStatus" />
                  </button>
                </div>
              </th>
              <th className="w-[130px] min-w-[130px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('primaryPayer')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'primaryPayer' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      Primary payer
                    </span>
                    <SortIcon column="primaryPayer" />
                  </button>
                </div>
              </th>
              <th className="w-[130px] min-w-[130px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('diagnosis')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'diagnosis' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      Diagnosis
                    </span>
                    <SortIcon column="diagnosis" />
                  </button>
                </div>
              </th>
              <th className="w-[100px] min-w-[100px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('activeOrders')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'activeOrders' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      Active orders
                    </span>
                    <SortIcon column="activeOrders" />
                  </button>
                </div>
              </th>
              <th className="w-[110px] min-w-[110px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('symptoms')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'symptoms' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      New symptoms
                    </span>
                    <SortIcon column="symptoms" />
                  </button>
                </div>
              </th>
              <th className="w-[85px] min-w-[85px] px-3 py-2 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-border text-[10px]">|</span>
                  <button onClick={() => handleSort('dateAdded')} className="flex items-center gap-1 text-left">
                    <span className={`text-[14px] font-normal ${sortConfig.column === 'dateAdded' ? 'text-[#7268dd]' : 'text-[#4b5563]'}`}>
                      Date added
                    </span>
                    <SortIcon column="dateAdded" />
                  </button>
                </div>
              </th>
              <th className="w-[36px] min-w-[36px] px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedPatients.map((patient) => (
              <Fragment key={patient.id}>
                <tr 
                  className={cn(
                    'border-t border-border cursor-pointer',
                    expandedRowId === patient.id ? 'bg-[rgba(114,104,221,0.04)]' : 'hover:bg-[#f8fafc]'
                  )}
                  style={{ height: '52px' }}
                  onClick={(e) => handleRowClick(patient.id, e)}
                >
                  <td className="w-[40px] min-w-[40px] pl-4 py-2">
                    <div className="flex items-center gap-3">
                      <SelectionCheckbox
                        checked={selectedIds.has(patient.id)}
                        onClick={() => toggleRowSelection(patient.id)}
                        ariaLabel={`Select ${patient.name}`}
                      />
                    </div>
                  </td>
                  <td className="w-[180px] min-w-[180px] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <PatientAvatar name={patient.name} photoUrl={patient.photoUrl} size={32} />
                      <div className="min-w-0">
                        <button
                          data-patient-name
                          onClick={(e) => handleNameClick(patient.id, e)}
                          className="text-[13px] font-normal text-text hover:underline cursor-pointer text-left truncate block max-w-full"
                        >
                          {patient.name}
                        </button>
                        <div className="text-[9px] text-muted-text tracking-[0.3px] uppercase truncate">
                          MRN: {patient.mrn} | DOB: {patient.dob}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="w-[120px] min-w-[120px] px-3 py-2">
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium w-fit',
                        patient.payerStatusType === 'eligible' && 'bg-background-2 text-secondary-text',
                        patient.payerStatusType === 'ineligible' && 'bg-[#fff1c2] text-secondary-text',
                        patient.payerStatusType === 'pending' && 'bg-background-2 text-secondary-text'
                      )}>
                        {patient.payerStatus}
                      </span>
                      {patient.payerNote && (
                        <span className="text-[9px] text-muted-text line-clamp-1">{patient.payerNote}</span>
                      )}
                    </div>
                  </td>
                  <td className="w-[130px] min-w-[130px] px-3 py-2 text-[12px] text-text">
                    <span className="line-clamp-2">{patient.primaryPayer}</span>
                  </td>
                  <td className="w-[130px] min-w-[130px] px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {patient.diagnosis.slice(0, 2).map((code, idx) => (
                        <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-background-2 rounded-full text-[10px] font-medium text-secondary-text">
                          {code}
                          <Info className="w-2.5 h-2.5 text-muted-text" />
                        </span>
                      ))}
                      {patient.diagnosis.length > 2 && (
                        <span className="text-[10px] text-muted-text">+{patient.diagnosis.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="w-[100px] min-w-[100px] px-3 py-2 text-[12px] text-muted-text text-center">
                    {patient.activeOrders}
                  </td>
                  <td className="w-[110px] min-w-[110px] px-3 py-2">
                    {patient.newSymptoms > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#fef3f2] text-[#b3261e]">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {patient.newSymptoms} symptom{patient.newSymptoms > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-text">None</span>
                    )}
                  </td>
                  <td className="w-[85px] min-w-[85px] px-3 py-2 text-[12px] text-text">
                    {patient.dateAdded}
                  </td>
                  <td className="w-[36px] min-w-[36px] px-2 py-2">
                    <button 
                      data-expand-arrow
                      className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background-2"
                      onMouseEnter={() => {
                        if (!pinnedRowId) {
                          setExpandedRowId(patient.id)
                        }
                      }}
                      onMouseLeave={() => {
                        if (!pinnedRowId) {
                          setExpandedRowId(null)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (pinnedRowId === patient.id) {
                          setPinnedRowId(null)
                          setExpandedRowId(null)
                          return
                        }
                        setPinnedRowId(patient.id)
                        setExpandedRowId(patient.id)
                      }}
                    >
                      {expandedRowId === patient.id ? (
                        <ChevronDown className="w-5 h-5 text-muted-text transition-transform duration-200 ease-in-out" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-text transition-transform duration-200 ease-in-out" />
                      )}
                    </button>
                  </td>
                </tr>
                {/* Expanded Row Content */}
                <tr
                  key={`${patient.id}-expanded`}
                  className={cn(
                    'bg-[rgba(114,104,221,0.04)]',
                    expandedRowId === patient.id ? 'border-t border-border' : 'border-t-0'
                  )}
                >
                  <td colSpan={9} className="p-0">
                    <div
                      className={cn(
                        'overflow-hidden transition-[max-height] duration-300 ease-in-out',
                        expandedRowId === patient.id ? 'max-h-[320px]' : 'max-h-0'
                      )}
                    >
                      <div className="mx-6 my-4 border border-border bg-[#f8fafc]">
                        <div className="grid grid-cols-3">
                          <div className="p-8">
                            <h4 className="text-[16px] font-normal text-text">
                              Vital Signs:{' '}
                              <span className={severityColor(patient.vitalSeverity)}>
                                {severityLabel(patient.vitalSeverity)}
                              </span>
                            </h4>
                            <div className="mt-6 grid grid-cols-2 gap-8">
                              <div className="flex flex-col justify-between">
                                <p className="text-[42px] font-light leading-none text-[#1b1b1b]">{patient.vitals?.spo2 ?? 95}<span className="text-sm font-semibold">%</span></p>
                                <p className="mt-2 flex items-center gap-1 text-[14px] font-semibold text-text">
                                  SpO₂ Reading
                                  {patient.vitalSeverity === 'critical' ? (
                                    <TrendingUp className="h-4 w-4 text-[#ee454d]" />
                                  ) : patient.vitalSeverity === 'moderate' ? (
                                    <TrendingUp className="h-4 w-4 text-[#f59e0b]" />
                                  ) : (
                                    <Check className="h-4 w-4 text-[#059669]" />
                                  )}
                                </p>
                              </div>
                              <div className="flex flex-col justify-between">
                                <p className="text-[42px] font-light leading-none text-[#1b1b1b]">
                                  {patient.vitals?.respiratoryRate ?? 18}
                                  <span className="text-sm font-semibold"> BPM</span>
                                </p>
                                <p className="mt-2 flex items-center gap-1 text-[14px] font-semibold text-text">
                                  Respiratory Rate
                                  <TrendingUp className="h-4 w-4 text-[#ee454d]" />
                                </p>
                              </div>
                              <div className="flex flex-col justify-between">
                                <p className="text-[42px] font-light leading-none text-[#1b1b1b]">
                                  {patient.vitals?.heartRate ?? 72}
                                  <span className="text-sm font-semibold"> BPM</span>
                                </p>
                                <p className="mt-2 flex items-center gap-1 text-[14px] font-semibold text-text">
                                  Pulse Rate
                                  <Check className="h-4 w-4 text-[#059669]" />
                                </p>
                              </div>
                              <div className="flex flex-col justify-between">
                                {(() => {
                                  const bp = getBloodPressureParts(patient.vitals?.bloodPressure)
                                  return (
                                    <>
                                      <div className="flex items-start gap-1.5">
                                        <p className="text-[42px] font-light leading-none text-[#1b1b1b]">
                                          {bp.sys}
                                          <span className="align-top text-sm font-semibold">/</span>
                                        </p>
                                        <div className="pt-1 leading-none">
                                          <p className="text-sm font-semibold text-[#1b1b1b]">{bp.dia}</p>
                                          <p className="mt-0.5 text-sm font-semibold text-[#1b1b1b]">mmHg</p>
                                        </div>
                                      </div>
                                      <p className="mt-2 flex items-center gap-1 text-[14px] font-semibold text-text">
                                        Blood Pressure
                                        <Check className="h-4 w-4 text-[#059669]" />
                                      </p>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                          <div className="flex h-full flex-col border-l border-border p-8">
                            <h4 className="text-[16px] font-normal text-text">Note Summary</h4>
                            <p className="mt-6 line-clamp-4 text-[14px] leading-5 text-text">
                              {formatNoteSummary(patient.lastNote || 'No notes available.')}
                            </p>
                            <div className="mt-auto flex justify-end pt-6">
                              <button
                                className="rounded-lg px-4 py-2 text-[14px] font-normal text-muted-text hover:bg-background-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigateToPatient(patient.id)
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('patientScrollTarget', 'notes')
                                  }
                                }}
                              >
                                Show more
                              </button>
                            </div>
                          </div>
                          <div className="flex h-full flex-col border-l border-border p-8">
                            <h4 className="text-[16px] font-normal text-text">
                              Respiratory Therapy Orders ({patient.activeOrders})
                            </h4>
                            <div className="mt-6 space-y-4">
                              {getOrders(patient).slice(0, 3).map((order, idx) => (
                                <p key={`${order}-${idx}`} className="line-clamp-3 text-[13px] leading-[1.5] text-[#1b1b1b]">
                                  {order}
                                </p>
                              ))}
                            </div>
                            <div className="mt-auto flex justify-end pt-6">
                              <button
                                className="rounded-lg px-4 py-2 text-[14px] font-normal text-muted-text hover:bg-background-2"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigateToPatient(patient.id)
                                  if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('patientScrollTarget', 'notes')
                                  }
                                }}
                              >
                                Show more
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
