'use client'

import { Mic, Video, TrendingDown, TrendingUp } from 'lucide-react'

interface CreditsCardProps {
  type: 'elevenlabs' | 'heygen'
  total: number
  used: number
  unit: string
}

const config = {
  elevenlabs: {
    icon: Mic,
    title: 'ElevenLabs',
    subtitle: 'קרדיטים לאודיו',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  },
  heygen: {
    icon: Video,
    title: 'HeyGen',
    subtitle: 'קרדיטים לוידאו',
    gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
  },
}

export function CreditsCard({ type, total, used, unit }: CreditsCardProps) {
  const remaining = total - used
  const percentage = Math.round((remaining / total) * 100)
  const isLow = percentage < 25
  const isMedium = percentage >= 25 && percentage < 50

  const { icon: Icon, title, subtitle, gradient } = config[type]

  const progressColor = isLow ? '#f87171' : isMedium ? '#fbbf24' : type === 'elevenlabs' ? '#818cf8' : '#34d399'

  return (
    <div style={{
      background: 'rgba(24, 24, 27, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: gradient,
            boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
          }}>
            <Icon style={{ width: 24, height: 24, color: 'white' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>{subtitle}</p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 8px',
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 500,
          background: isLow ? 'rgba(248, 113, 113, 0.1)' : isMedium ? 'rgba(251, 191, 36, 0.1)' : 'rgba(52, 211, 153, 0.1)',
          color: isLow ? '#f87171' : isMedium ? '#fbbf24' : '#34d399',
        }}>
          {isLow ? (
            <TrendingDown style={{ width: 12, height: 12 }} />
          ) : (
            <TrendingUp style={{ width: 12, height: 12 }} />
          )}
          {percentage}%
        </div>
      </div>

      {/* Main Value */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <span style={{ fontSize: 36, fontWeight: 700, color: 'white' }}>
          {remaining.toLocaleString()}
        </span>
        <p style={{ fontSize: 14, color: '#71717a', marginTop: 4, marginBottom: 0 }}>{unit}</p>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ height: 8, background: '#27272a', borderRadius: 9999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              borderRadius: 9999,
              background: progressColor,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14 }}>
        <div>
          <span style={{ color: '#71717a' }}>נצלו: </span>
          <span style={{ color: '#a1a1aa' }}>{used.toLocaleString()}</span>
        </div>
        <div>
          <span style={{ color: '#71717a' }}>סה״כ: </span>
          <span style={{ color: '#a1a1aa' }}>{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Warning Message */}
      {isLow && (
        <div style={{
          marginTop: 16,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.2)',
        }}>
          <p style={{ fontSize: 14, color: '#f87171', textAlign: 'center', margin: 0 }}>
            ⚠️ הקרדיטים עומדים להיגמר
          </p>
        </div>
      )}
    </div>
  )
}
