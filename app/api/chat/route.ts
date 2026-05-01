import { NextRequest } from 'next/server'
import patientsData from '@/data/patients.json'

export async function POST(req: NextRequest) {
  const { patientId, message } = await req.json()
  const patient = patientsData.patients.find((candidate) => candidate.id === patientId)

  if (!patient || !message) {
    return new Response('Invalid request', { status: 400 })
  }

  const answer = `Chart summary for ${patient.name}: SpO2 is ${patient.vitals.spo2}%, respiratory rate ${patient.vitals.respiratoryRate} BPM, pulse ${patient.vitals.heartRate} BPM, blood pressure ${patient.vitals.bloodPressure}, and temperature ${patient.vitals.temperature}F. Latest note indicates: ${patient.notes[0]?.body ?? 'No recent note available.'} You asked: "${message}".`

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      const words = answer.split(' ')
      let index = 0

      const interval = setInterval(() => {
        if (index >= words.length) {
          clearInterval(interval)
          controller.close()
          return
        }

        controller.enqueue(encoder.encode(`${words[index]} `))
        index += 1
      }, 40)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}
