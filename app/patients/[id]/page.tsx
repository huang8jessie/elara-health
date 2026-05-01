'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, ChevronsLeft, Send, TrendingDown, TrendingUp } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'
import patientsData from '@/data/patients.json'
import { cn } from '@/lib/utils'
import { PatientAvatar } from '@/components/PatientAvatar'

type Patient = (typeof patientsData.patients)[number]

const POINT_CLICK_CARE_URL = 'https://login.pointclickcare.com/home/userLogin.xhtml'

const fallbackOrders = [
  'Bronchodilator nebulizer treatment every 6 hours while awake',
  'Chest physiotherapy BID and as needed for secretion mobilization',
  'Continuous pulse oximetry monitoring and document trend each shift',
]

const symptomTagStyles: Record<string, string> = {
  'spo2 dropped': 'bg-[#fac7ca]',
  'spo₂ dropped': 'bg-[#fac7ca]',
  'labored breathing': 'bg-[rgba(255,180,49,0.5)]',
  'rr increased': 'bg-[#d5d2f5]',
  'hr increased': 'bg-[#d5d2f5]',
  'productive cough': 'bg-[#d5d2f5]',
  coughing: 'bg-[#d5d2f5]',
  discharge: 'bg-[#c7c7c7]',
}

function getAge(dateOfBirth: string) {
  const [month, day, year] = dateOfBirth.split('/').map(Number)
  const birthDate = new Date(year, month - 1, day)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const beforeBirthday = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
  if (beforeBirthday) age -= 1
  return age
}

function formatTimestamp(timestamp: string) {
  const [datePart, timePart, amPm] = timestamp.split(' ')
  const date = new Date(datePart)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return {
    date: formattedDate,
    time: `${timePart} ${amPm}`,
  }
}

function severityColor(severity: string) {
  if (severity === 'critical') return 'text-[#ee454d]'
  if (severity === 'moderate') return 'text-[#f59e0b]'
  return 'text-[#059669]'
}

function severityLabel(severity: string) {
  if (severity === 'critical') return 'Critical'
  if (severity === 'moderate') return 'Moderate'
  return 'Stable'
}

function getPayerNote(patient: Patient) {
  const payerType = patient.payer.type.toLowerCase()
  return payerType.includes('advantage') || payerType.includes('medicare a')
    ? 'Primary payer is not eligible'
    : 'Primary payer verified'
}

function PointClickCareLink({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={POINT_CLICK_CARE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm text-[#4b5563] underline decoration-dotted underline-offset-2 transition-colors duration-150 ease-in hover:text-[#2563eb] hover:decoration-solid active:text-[#1d4ed8]"
    >
      {children}
      <ArrowUpRight className="h-[18px] w-[18px]" />
    </a>
  )
}

function PointClickCareButton({ children }: { children: React.ReactNode }) {
  return (
    <a
      href={POINT_CLICK_CARE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-normal text-[#4b5563] transition-colors duration-150 ease-in hover:border-[#e5e7eb] hover:bg-[#e5e7eb] active:bg-[#d1d5db]"
    >
      {children}
      <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

function highlightReadNoteText(body: string, patientSymptoms: string[]) {
  const normalizedSymptoms = new Set(patientSymptoms.map((symptom) => symptom.toLowerCase()))
  const matches = Object.keys(symptomTagStyles).filter((key) => {
    const normalizedBody = body.toLowerCase()
    if (!normalizedBody.includes(key)) return false
    if (key === 'spo₂ dropped') return normalizedSymptoms.has('spo2 dropped') || normalizedSymptoms.has('spo₂ dropped')
    return normalizedSymptoms.has(key)
  })

  if (matches.length === 0) return <>{body}</>

  const escaped = matches.map((match) => match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const parts = body.split(regex)

  return (
    <>
      {parts.map((part, idx) => {
        const matched = matches.find((match) => match.toLowerCase() === part.toLowerCase())
        if (!matched) return <span key={`${part}-${idx}`}>{part}</span>

        return (
          <span
            key={`${part}-${idx}`}
            className={cn(
              'inline-flex items-center rounded-2xl px-2 text-xs leading-5 text-[#1b1b1b]',
              symptomTagStyles[matched]
            )}
          >
            {part}
          </span>
        )
      })}
    </>
  )
}

export default function PatientPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [readNoteIndex, setReadNoteIndex] = useState(0)

  const patient = useMemo(
    () => patientsData.patients.find((candidate) => candidate.id === params.id),
    [params.id]
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    const target = sessionStorage.getItem('patientScrollTarget')
    if (target === 'notes') {
      document.getElementById('notes')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      sessionStorage.removeItem('patientScrollTarget')
    }
  }, [])

  if (!patient) {
    return (
      <div className="min-h-screen">
        <Sidebar />
        <main className="ml-[217px] min-h-screen bg-white px-8 pb-8 pt-10">
          <div className="rounded-2xl border border-border bg-white p-8">
            <h2 className="text-2xl text-text">Patient not found</h2>
          </div>
        </main>
      </div>
    )
  }

  const patientId = patient.id
  const age = getAge(patient.dateOfBirth)
  const respiratoryOrders = Array.isArray(patient.orders.respiratoryOrders)
    ? patient.orders.respiratoryOrders.filter((order): order is string => typeof order === 'string' && order.trim().length > 0)
    : []
  const orders = respiratoryOrders.length > 0 ? respiratoryOrders : fallbackOrders

  const readNotes = patient.notes.filter((note) => note.type === 'Nursing Note' || note.type === 'Physician Note')
  const safeReadNoteIndex = Math.min(readNoteIndex, Math.max(0, readNotes.length - 1))
  const activeReadNote = readNotes[safeReadNoteIndex]
  const activeReadNoteTimestamp = activeReadNote ? formatTimestamp(activeReadNote.timestamp) : null
  const canGoPrev = safeReadNoteIndex > 0
  const canGoNext = safeReadNoteIndex < readNotes.length - 1

  const now = new Date()
  const rtNoteDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const rtNoteTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  async function onAskQuestion(e: FormEvent) {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId, message: question.trim() }),
      })
      if (!res.ok || !res.body) throw new Error('Failed to stream response')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      while (!done) {
        const chunk = await reader.read()
        done = chunk.done
        if (chunk.value) setResponse((prev) => prev + decoder.decode(chunk.value, { stream: true }))
      }
    } catch {
      setResponse('Unable to retrieve AI response right now.')
    } finally {
      setIsLoading(false)
    }
  }

  const backToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-[217px] min-h-screen bg-white">
        <div className="w-full max-w-[1200px] overflow-x-hidden px-8 pr-10 pb-8 pt-10">
          <div className="flex flex-col gap-8 pb-8">
            <header className="relative flex items-center justify-between pt-[3px]">
              <div className="flex items-center gap-[10px]">
                <button
                  onClick={backToDashboard}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 ease-in hover:bg-[#f8fafc] active:bg-[#e5e7eb]"
                  aria-label="Back to dashboard"
                >
                  <ChevronsLeft className="h-4 w-4 text-[#111827]" />
                </button>
                <h1 className="text-[28px] font-normal text-text">Patient Profile</h1>
              </div>
            </header>

            <section className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-[67px]">
              <div className="flex flex-1 items-start gap-6">
                <PatientAvatar name={patient.name} photoUrl={patient.photoUrl} size={120} />
                <div className="flex flex-col gap-2">
                  <h2 className="text-2xl font-normal text-text">{patient.name}</h2>
                  <p className="text-sm text-text"><span className="font-medium">Room number:</span> {patient.roomNumber}</p>
                  <p className="text-sm text-text"><span className="font-medium">Age:</span> {age}</p>
                  <p className="text-sm text-text"><span className="font-medium">Gender:</span> {patient.gender}</p>
                  <div className="flex items-center gap-2 text-sm text-text">
                    <span className="font-medium">Payer status:</span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-2xl px-3 py-1 text-xs font-medium text-secondary-text',
                        patient.payer.eligibility.toLowerCase() === 'eligible' ? 'bg-[#f2f4f7]' : 'bg-[#fff1c2]'
                      )}
                    >
                      {patient.payer.eligibility}
                    </span>
                    <span className="text-[10px] text-secondary-text" style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}>
                      {getPayerNote(patient)}
                    </span>
                  </div>
                  <p className="text-sm text-text"><span className="font-medium">Primary payer:</span> {patient.payer.name}</p>
                  <p className="text-sm text-text"><span className="font-medium">Status:</span> {patient.orders.treatmentStatus}</p>
                  <PointClickCareButton>Open PointClickCare Profile</PointClickCareButton>
                </div>
              </div>

              <div className="flex h-full w-full flex-col justify-start rounded-2xl border border-border p-8 lg:w-[508px]">
                <h3 className="text-sm font-medium text-text">Ask about {patient.name}</h3>
                <p className="mt-1 text-sm text-muted-text">Quickly search through their chart by asking a question</p>
                <form onSubmit={onAskQuestion} className="mt-4">
                  <div className="flex h-9 items-center rounded-lg border border-[#d1d5db] px-3">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="h-full w-full bg-transparent text-xs text-secondary-text outline-none placeholder:text-[#d1d5db]"
                      placeholder="Ask a question..."
                      style={{ fontFamily: '"SF Pro Text", Inter, sans-serif' }}
                    />
                    <button type="submit" aria-label="Send question">
                      <Send className="h-6 w-6 text-secondary-text" />
                    </button>
                  </div>
                </form>
                <div className="mt-2 min-h-5 text-xs text-secondary-text">
                  {isLoading ? (
                    <span className="inline-flex gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-text" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-text [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary-text [animation-delay:240ms]" />
                    </span>
                  ) : (
                    response
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-text">AI can make mistakes, so please double check.</p>
              </div>
            </section>

            <div className="h-px w-full bg-border" />

            <section className="flex flex-col gap-6">
              <h3 className="text-2xl font-normal text-text">
                Vital Signs: <span className={severityColor(patient.vitalSeverity)}>{severityLabel(patient.vitalSeverity)}</span>
              </h3>
              <div className="flex w-full flex-wrap items-end justify-between gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-[52px] font-light leading-none text-[#1b1b1b]">{patient.vitals.spo2}</span>
                    <span className="mb-2 text-sm font-semibold text-[#1b1b1b]">%</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b1b1b]">
                    SpO2 Reading
                    {patient.vitalSeverity === 'stable'
                      ? <Check className="h-3 w-3 text-[#059669]" />
                      : <TrendingDown className={cn('h-3 w-3', severityColor(patient.vitalSeverity))} />}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-[52px] font-light leading-none text-[#1b1b1b]">{patient.vitals.respiratoryRate}</span>
                    <span className="mb-2 text-sm font-semibold text-[#1b1b1b]">BPM</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b1b1b]">
                    Respiratory Rate
                    {patient.vitalSeverity === 'stable'
                      ? <Check className="h-3 w-3 text-[#059669]" />
                      : <TrendingUp className={cn('h-3 w-3', severityColor(patient.vitalSeverity))} />}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-[52px] font-light leading-none text-[#1b1b1b]">{patient.vitals.heartRate}</span>
                    <span className="mb-2 text-sm font-semibold text-[#1b1b1b]">BPM</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b1b1b]">
                    Pulse Rate <Check className="h-3 w-3 text-[#059669]" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-[52px] font-light leading-none text-[#1b1b1b]">{patient.vitals.bloodPressure.split('/')[0]}</span>
                    <span className="mb-2 text-sm font-semibold text-[#1b1b1b]">/ {patient.vitals.bloodPressure.split('/')[1]} mmHg</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b1b1b]">
                    Blood Pressure <Check className="h-3 w-3 text-[#059669]" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="flex items-end gap-1">
                    <span className="text-[52px] font-light leading-none text-[#1b1b1b]">{patient.vitals.temperature}</span>
                    <span className="mb-2 text-sm font-semibold text-[#1b1b1b]">F</span>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b1b1b]">
                    Temperature <Check className="h-3 w-3 text-[#059669]" />
                  </div>
                </div>
              </div>
            </section>

            <div className="h-px w-full bg-border" />

            <section className="flex flex-col gap-6">
              <h3 className="text-2xl font-normal text-text">Respiratory Therapy Orders</h3>
              <div className="w-full overflow-visible rounded-2xl border border-border p-4">
                <div
                  className="grid w-full gap-x-3 gap-y-3 border-b border-border pb-3 text-sm text-[#4c5257]"
                  style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr)', fontFamily: '"SF Pro Text", Inter, sans-serif' }}
                >
                  <span className="text-left">Order</span>
                  <span className="text-left">Diagnosis</span>
                  <span className="text-left">MD Note</span>
                  <span className="text-left">Care Plan</span>
                  <span className="text-left">Assessment</span>
                </div>
                <div className="mt-1">
                  {orders.slice(0, 3).map((order, index) => (
                    <div
                      key={`${order}-${index}`}
                      className="grid w-full gap-x-3 gap-y-3 border-t border-border py-4 first:border-t-0"
                      style={{ gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.5fr)' }}
                    >
                      <p className="col-span-5 break-words text-sm leading-5 text-[#1b1b1b] [overflow-wrap:anywhere]">{order}</p>
                      <span />
                      <span className={cn('inline-flex w-fit self-start items-start rounded-2xl py-[4px] pl-[6px] pr-[8px] text-left text-xs font-medium leading-4 whitespace-normal', index === 1 ? 'bg-[#ffedcc] text-[#965e00]' : 'bg-[#ecfdf3] text-[#027a48]')}>
                        {index === 1 ? 'Diagnosis missing' : 'Diagnosis present'}
                      </span>
                      <span className={cn('inline-flex w-fit self-start items-start rounded-2xl py-[4px] pl-[6px] pr-[8px] text-left text-xs font-medium leading-4 whitespace-normal', index === 2 ? 'bg-[#ffedcc] text-[#965e00]' : 'bg-[#ecfdf3] text-[#027a48]')}>
                        {index === 2 ? 'MD note lack medical necessity' : 'MD note complete'}
                      </span>
                      <span className={cn('inline-flex w-fit self-start items-start rounded-2xl py-[4px] pl-[6px] pr-[8px] text-left text-xs font-medium leading-4 whitespace-normal', index === 0 ? 'bg-[#ecfdf3] text-[#027a48]' : 'bg-[#ffedcc] text-[#965e00]')}>
                        {index === 0 ? 'Care plan complete' : 'Care plan incomplete'}
                      </span>
                      <span className={cn('inline-flex w-fit self-start items-start rounded-2xl py-[4px] pl-[6px] pr-[8px] text-left text-xs font-medium leading-4 whitespace-normal', index === 0 ? 'bg-[#ecfdf3] text-[#027a48]' : 'bg-[#ffedcc] text-[#965e00]')}>
                        {index === 0 ? 'Assessment complete' : 'Assessment overdue'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="h-px w-full bg-border" />

            <section id="notes" className="flex flex-col gap-6">
              <h3 className="text-2xl font-normal text-text">Patient Notes</h3>

              <article className="w-full rounded-2xl border border-border bg-white p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-text">
                      {activeReadNote?.type ?? 'Nursing Note'} <span className="mx-1 text-secondary-text">|</span> {activeReadNoteTimestamp?.date ?? '--'} <span className="mx-1 text-secondary-text">|</span> {activeReadNoteTimestamp?.time ?? '--'}
                    </div>
                    <p className="mt-1 text-sm text-[#1b1b1b]">
                      <span className="font-medium text-text">Author:</span> {activeReadNote ? `${activeReadNote.author}, ${activeReadNote.role}` : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-secondary-text">
                    <button
                      className={cn(
                        'flex h-[22px] w-[22px] items-center justify-center rounded-lg transition-colors duration-150 ease-in',
                        canGoPrev ? 'text-muted-text hover:bg-[#f3f4f6] active:bg-[#e5e7eb]' : 'cursor-not-allowed text-[#d1d5db]'
                      )}
                      disabled={!canGoPrev}
                      onClick={() => setReadNoteIndex((prev) => Math.max(0, prev - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span>{readNotes.length === 0 ? '0 of 0' : `${safeReadNoteIndex + 1} of ${readNotes.length}`}</span>
                    <button
                      className={cn(
                        'flex h-[22px] w-[22px] items-center justify-center rounded-lg transition-colors duration-150 ease-in',
                        canGoNext ? 'text-muted-text hover:bg-[#f3f4f6] active:bg-[#e5e7eb]' : 'cursor-not-allowed text-[#d1d5db]'
                      )}
                      disabled={!canGoNext}
                      onClick={() => setReadNoteIndex((prev) => Math.min(readNotes.length - 1, prev + 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="my-4 h-px w-full bg-border" />
                <p className="text-sm leading-5 text-text">
                  {activeReadNote ? highlightReadNoteText(activeReadNote.body, patient.symptoms) : 'No nursing or physician notes available.'}
                </p>
                <div className="mt-5">
                  <PointClickCareLink>View in PointClickCare</PointClickCareLink>
                </div>
              </article>

              <article className="mt-6 w-full rounded-2xl border border-border bg-white p-8">
                <div>
                  <div className="text-sm font-medium text-text">
                    Respiratory Therapy Note <span className="mx-1 text-secondary-text">|</span> {rtNoteDate} <span className="mx-1 text-secondary-text">|</span> {rtNoteTime}
                  </div>
                  <p className="mt-1 text-sm text-[#1b1b1b]">
                    <span className="font-medium text-text">Author:</span> J. Huang, CRT
                  </p>
                </div>
                <div className="my-4 h-px w-full bg-border" />
                <textarea
                  className="min-h-[120px] w-full rounded-lg border border-border bg-white p-4 text-sm text-text placeholder:text-muted-text transition-colors duration-150 ease-in focus:border-tertiary focus:outline-none"
                  placeholder={'Reason for Visit:\nAssessment:\nIntervention:'}
                />
                <div className="mt-4 flex gap-4">
                  <button className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-normal text-[#4b5563] transition-colors duration-150 ease-in hover:bg-[#e5e7eb] hover:border-[#e5e7eb] active:bg-[#d1d5db]">
                    Save Note to PointClickCare
                  </button>
                  <PointClickCareLink>View in PointClickCare</PointClickCareLink>
                </div>
              </article>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
