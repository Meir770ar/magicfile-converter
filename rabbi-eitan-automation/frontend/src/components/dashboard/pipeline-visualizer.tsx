'use client'

import { motion } from 'framer-motion'
import {
  Globe,
  FileText,
  CheckCircle2,
  Mic,
  Video,
  Send,
  Loader2,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react'

export type StepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface PipelineStep {
  id: string
  name: string
  nameHe: string
  status: StepStatus
  duration?: string
  error?: string
}

const stepIcons: Record<string, React.ReactNode> = {
  scrape: <Globe style={{ width: 20, height: 20 }} />,
  script: <FileText style={{ width: 20, height: 20 }} />,
  approve: <CheckCircle2 style={{ width: 20, height: 20 }} />,
  audio: <Mic style={{ width: 20, height: 20 }} />,
  video: <Video style={{ width: 20, height: 20 }} />,
  distribute: <Send style={{ width: 20, height: 20 }} />,
}

interface PipelineVisualizerProps {
  steps: PipelineStep[]
  isRunning: boolean
  onStart: () => void
  onRetry?: (stepId: string) => void
}

const getStatusColor = (status: StepStatus) => {
  switch (status) {
    case 'pending': return { bg: '#27272a', text: '#71717a' }
    case 'active': return { bg: 'rgba(99, 102, 241, 0.2)', text: '#818cf8' }
    case 'completed': return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399' }
    case 'error': return { bg: 'rgba(244, 63, 94, 0.2)', text: '#f87171' }
    default: return { bg: '#27272a', text: '#71717a' }
  }
}

export function PipelineVisualizer({
  steps,
  isRunning,
  onStart,
  onRetry,
}: PipelineVisualizerProps) {
  const completedSteps = steps.filter((s) => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100
  const currentStep = steps.find((s) => s.status === 'active')

  return (
    <div style={{
      background: 'rgba(24, 24, 27, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      padding: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>🚀</span>
            Pipeline Status
          </h2>
          <p style={{ fontSize: 14, color: '#a1a1aa', marginTop: 4, marginBottom: 0 }}>
            {isRunning
              ? `שלב ${completedSteps + 1} מתוך ${steps.length} • ${currentStep?.nameHe || 'מעבד...'}`
              : 'מוכן ליצירת תוכן'}
          </p>
        </div>
        <button
          onClick={onStart}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 600,
            color: 'white',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            border: 'none',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {isRunning ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              מעבד...
            </>
          ) : (
            <>
              <span>🎬</span>
              הפעל Pipeline
            </>
          )}
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: '#a1a1aa' }}>התקדמות</span>
          <span style={{ fontSize: 14, color: 'white', fontWeight: 500 }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 8, background: '#27272a', borderRadius: 9999, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              height: '100%',
              borderRadius: 9999,
              background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            }}
          />
        </div>
      </div>

      {/* Pipeline Steps */}
      <div style={{ position: 'relative' }}>
        {/* Connection Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 27,
          width: 2,
          background: '#27272a',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {steps.map((step, index) => {
            const colors = getStatusColor(step.status)
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  borderRadius: 8,
                  background: step.status === 'active' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                }}
              >
                {/* Step Indicator */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 10,
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: colors.bg,
                    color: colors.text,
                    flexShrink: 0,
                  }}
                >
                  {step.status === 'active' ? (
                    <Loader2 style={{ width: 24, height: 24, animation: 'spin 1s linear infinite' }} />
                  ) : step.status === 'error' ? (
                    <AlertCircle style={{ width: 24, height: 24 }} />
                  ) : (
                    stepIcons[step.id] || <Clock style={{ width: 24, height: 24 }} />
                  )}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{
                      fontWeight: 500,
                      margin: 0,
                      color: step.status === 'pending' ? '#71717a'
                        : step.status === 'active' ? 'white'
                        : step.status === 'completed' ? '#34d399'
                        : '#f87171',
                    }}>
                      {step.nameHe}
                    </h3>
                    {step.status === 'completed' && (
                      <span style={{ color: '#34d399' }}>✓</span>
                    )}
                  </div>
                  <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>{step.name}</p>
                  {step.error && (
                    <p style={{ fontSize: 14, color: '#f87171', marginTop: 4, marginBottom: 0 }}>{step.error}</p>
                  )}
                </div>

                {/* Duration / Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {step.duration && (
                    <span style={{
                      fontSize: 14,
                      fontFamily: 'monospace',
                      color: step.status === 'completed' ? '#a1a1aa' : '#52525b',
                    }}>
                      {step.duration}
                    </span>
                  )}
                  {step.status === 'error' && onRetry && (
                    <button
                      onClick={() => onRetry(step.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        background: 'rgba(244, 63, 94, 0.1)',
                        color: '#f87171',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw style={{ width: 16, height: 16 }} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
