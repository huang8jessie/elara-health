'use client'

import { useState } from 'react'
import facesMeta from '@/data/faces-meta.json'

type Props = {
  name: string
  photoUrl?: string
  size?: number
}

export function PatientAvatar({ name, photoUrl, size = 32 }: Props) {
  const [error, setError] = useState(false)
  const fileName = photoUrl?.split('/').pop() ?? ''
  const focal = (facesMeta as Record<string, { cx: number; cy: number; zoom: number }>)[fileName]
  const objectPosition = `${(focal?.cx ?? 0.5) * 100}% ${(focal?.cy ?? 0.36) * 100}%`
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  if (photoUrl && !error) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <img
          src={photoUrl}
          alt={name}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.35,
        fontWeight: 500,
        color: '#4b5563',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
