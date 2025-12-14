'use client'

import { motion, AnimatePresence } from 'framer-motion'
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
import { cn } from '@/lib/utils'

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
  scrape: <Globe className="w-5 h-5" />,
  script: <FileText className="w-5 h-5" />,
  approve: <CheckCircle2 className="w-5 h-5" />,
  audio: <Mic className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  distribute: <Send className="w-5 h-5" />,
}

interface PipelineVisualizerProps {
  steps: PipelineStep[]
  isRunning: boolean
  onStart: () => void
  onRetry?: (stepId: string) => void
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
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            Pipeline Status
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {isRunning
              ? `שלב ${completedSteps + 1} מתוך ${steps.length} • ${currentStep?.nameHe || 'מעבד...'}`
              : 'מוכן ליצירת תוכן'}
          </p>
        </div>
        <button
          onClick={onStart}
          disabled={isRunning}
          className={cn(
            'glow-button flex items-center gap-2',
            isRunning && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-zinc-400">התקדמות</span>
          <span className="text-white font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              isRunning
                ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-shimmer'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            )}
          />
        </div>
      </div>

      {/* Pipeline Steps - Subway Map Style */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute top-0 bottom-0 right-[27px] w-0.5 bg-zinc-800" />

        <div className="space-y-2">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'pipeline-step relative',
                step.status === 'active' && 'active',
                step.status === 'completed' && 'completed'
              )}
            >
              {/* Step Indicator */}
              <div
                className={cn(
                  'relative z-10 w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300',
                  step.status === 'pending' && 'bg-zinc-800 text-zinc-500',
                  step.status === 'active' && 'bg-indigo-500/20 text-indigo-400 shadow-glow-sm animate-pulse-glow',
                  step.status === 'completed' && 'bg-emerald-500/20 text-emerald-400 shadow-glow-emerald',
                  step.status === 'error' && 'bg-rose-500/20 text-rose-400 shadow-glow-rose'
                )}
              >
                {step.status === 'active' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  stepIcons[step.id] || <Clock className="w-6 h-6" />
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={cn(
                      'font-medium transition-colors',
                      step.status === 'pending' && 'text-zinc-500',
                      step.status === 'active' && 'text-white',
                      step.status === 'completed' && 'text-emerald-400',
                      step.status === 'error' && 'text-rose-400'
                    )}
                  >
                    {step.nameHe}
                  </h3>
                  {step.status === 'completed' && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-emerald-400"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{step.name}</p>
                {step.error && (
                  <p className="text-sm text-rose-400 mt-1">{step.error}</p>
                )}
              </div>

              {/* Duration / Actions */}
              <div className="flex items-center gap-2">
                {step.duration && (
                  <span
                    className={cn(
                      'text-sm font-mono',
                      step.status === 'completed' ? 'text-zinc-400' : 'text-zinc-600'
                    )}
                  >
                    {step.duration}
                  </span>
                )}
                {step.status === 'error' && onRetry && (
                  <button
                    onClick={() => onRetry(step.id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
