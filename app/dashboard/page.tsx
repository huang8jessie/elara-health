'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { PipelineBuckets } from '@/components/pipeline-buckets'
import { PatientTable } from '@/components/patient-table'
import patientsData from '@/data/patients.json'

// Transform the raw patient data to match the table component's expected format
function transformPatients(rawPatients: typeof patientsData.patients) {
  return rawPatients.map(patient => {
    // Calculate "X days ago" from dateAdded
    const dateAdded = new Date(patient.dateAdded)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - dateAdded.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dateAddedText = diffDays === 0 ? 'Today' : diffDays === 1 ? '1 day ago' : `${diffDays} days ago`

    // Determine payer status type
    const eligibility = patient.payer.eligibility.toLowerCase()
    const payerStatusType = eligibility === 'eligible' ? 'eligible' 
      : eligibility === 'ineligible' ? 'ineligible' 
      : 'pending'
    const payerType = patient.payer.type.toLowerCase()
    const hasIneligiblePayerType = payerType.includes('advantage') || payerType.includes('medicare a') || payerType.includes('part a')
    const payerNote = hasIneligiblePayerType ? 'Primary payer is not eligible' : null

    // Combine primary and secondary diagnosis codes
    const allDiagnosis = [
      patient.diagnosis.primaryCode,
      ...patient.diagnosis.secondaryCodes
    ]

    // Get the last note body
    const lastNote = patient.notes?.[0]?.body || 'No notes available.'

    return {
      id: patient.id,
      name: patient.name,
      mrn: patient.mrn.replace('MRN-', ''),
      dob: patient.dateOfBirth,
      avatar: '', // No avatar in data
      photoUrl: patient.photoUrl,
      payerStatus: patient.payer.eligibility,
      payerStatusType: payerStatusType as 'eligible' | 'ineligible' | 'pending',
      payerNote,
      primaryPayer: patient.payer.name,
      diagnosis: allDiagnosis,
      activeOrders: patient.orders.activeCount,
      newSymptoms: patient.newSymptomCount,
      dateAdded: dateAddedText,
      buckets: patient.buckets,
      vitals: patient.vitals,
      lastNote: lastNote,
      vitalSeverity: patient.vitalSeverity,
      primaryDiagnosisCode: patient.diagnosis.primaryCode,
      primaryDiagnosisDesc: patient.diagnosis.primaryDesc,
      respiratoryOrders: patient.orders.respiratoryOrders,
      facility: (patient as typeof patient & { facility?: string }).facility,
      unit: (patient as typeof patient & { unit?: string }).unit
    }
  })
}

// Transform summary to match expected format
const summary = {
  active: patientsData.summary.active,
  activePercentage: Math.round((patientsData.summary.active / patientsData.summary.totalResidents) * 100),
  assessForOrders: patientsData.summary.assessForOrders,
  assessForOrdersPercentage: Math.round((patientsData.summary.assessForOrders / patientsData.summary.totalResidents) * 100),
  evaluateAndTreat: patientsData.summary.evaluateAndTreat,
  evaluateAndTreatPercentage: Math.round((patientsData.summary.evaluateAndTreat / patientsData.summary.totalResidents) * 100),
  discontinueOrders: patientsData.summary.discontinueOrders,
  discontinueOrdersPercentage: Math.round((patientsData.summary.discontinueOrders / patientsData.summary.totalResidents) * 100),
  allResidents: patientsData.summary.allResidents
}

export default function DashboardPage() {
  const [activeBucket, setActiveBucket] = useState('all_residents')
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedFacility, setSelectedFacility] = useState('all')
  const [selectedUnit, setSelectedUnit] = useState('all')
  const transformedPatients = transformPatients(patientsData.patients)
  const facilityAndUnitFilteredPatients = transformedPatients.filter((patient) => {
    const patientWithOptionalFields = patient as typeof patient & { facility?: string; unit?: string }
    const hasFacilityField = typeof patientWithOptionalFields.facility === 'string' && patientWithOptionalFields.facility.length > 0
    const hasUnitField = typeof patientWithOptionalFields.unit === 'string' && patientWithOptionalFields.unit.length > 0

    const matchesFacility = selectedFacility === 'all' || !hasFacilityField || patientWithOptionalFields.facility === selectedFacility
    const matchesUnit = selectedUnit === 'all' || !hasUnitField || patientWithOptionalFields.unit === selectedUnit

    return matchesFacility && matchesUnit
  })
  
  const saveDashboardState = () => {
    if (typeof window === 'undefined') return
    try {
      const state = {
        activeTab: activeBucket,
        scrollY: window.scrollY,
        pageIndex: currentPage,
      }
      sessionStorage.setItem('dashboardState', JSON.stringify(state))
    } catch {
      // Ignore sessionStorage access errors (private mode/restricted context).
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    let shouldClearSavedState = false
    try {
      const saved = sessionStorage.getItem('dashboardState')
      if (!saved) return

      const state = JSON.parse(saved) as { activeTab?: string; scrollY?: number; pageIndex?: number }
      const validBuckets = new Set(['active', 'assess_for_orders', 'evaluate_and_treat', 'discontinue_orders', 'all_residents'])

      if (typeof state.activeTab === 'string' && validBuckets.has(state.activeTab)) {
        setActiveBucket(state.activeTab)
      }

      if (typeof state.pageIndex === 'number') {
        setCurrentPage(state.pageIndex)
      }

      if (typeof state.scrollY === 'number') {
        window.setTimeout(() => {
          window.scrollTo(0, state.scrollY)
        }, 50)
      }

      shouldClearSavedState = true
    } catch {
      try {
        sessionStorage.removeItem('dashboardState')
      } catch {
        // Ignore cleanup failures.
      }
    } finally {
      if (shouldClearSavedState) {
        try {
          sessionStorage.removeItem('dashboardState')
        } catch {
          // Ignore cleanup failures.
        }
      }
    }
  }, [])

  return (
    <DashboardLayout
      title="Clinical Dashboard"
      selectedFacility={selectedFacility}
      selectedUnit={selectedUnit}
      onFacilityChange={setSelectedFacility}
      onUnitChange={setSelectedUnit}
      showFilters
    >
      <div className="flex flex-col">
        {/* Pipeline Bucket Cards */}
        <PipelineBuckets 
          activeBucket={activeBucket}
          onBucketChange={setActiveBucket}
          summary={summary}
        />
        
        {/* Patient Table */}
        <PatientTable 
          patients={facilityAndUnitFilteredPatients}
          activeBucket={activeBucket}
          onNavigateToPatient={saveDashboardState}
        />
      </div>
    </DashboardLayout>
  )
}
