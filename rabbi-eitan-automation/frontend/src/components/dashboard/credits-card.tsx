'use client'

import { motion } from 'framer-motion'
import { Mic, Video, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    gradient: 'from-indigo-500 to-purple-600',
    glow: 'shadow-glow-sm',
  },
  heygen: {
    icon: Video,
    title: 'HeyGen',
    subtitle: 'קרדיטים לוידאו',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'shadow-glow-emerald',
  },
}

export function CreditsCard({ type, total, used, unit }: CreditsCardProps) {
  const remaining = total - used
  const percentage = Math.round((remaining / total) * 100)
  const isLow = percentage < 25
  const isMedium = percentage >= 25 && percentage < 50

  const { icon: Icon, title, subtitle, gradient, glow } = config[type]

  return (
    <div className="credit-card group">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br',
              gradient,
              glow
            )}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-zinc-500">{subtitle}</p>
          </div>
        </div>

        {/* Trend Indicator */}
        <div
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
            isLow && 'bg-rose-500/10 text-rose-400',
            isMedium && 'bg-amber-500/10 text-amber-400',
            !isLow && !isMedium && 'bg-emerald-500/10 text-emerald-400'
          )}
        >
          {isLow ? (
            <TrendingDown className="w-3 h-3" />
          ) : (
            <TrendingUp className="w-3 h-3" />
          )}
          {percentage}%
        </div>
      </div>

      {/* Main Value */}
      <div className="text-center mb-6">
        <motion.span
          key={remaining}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-4xl font-bold text-white"
        >
          {remaining.toLocaleString()}
        </motion.span>
        <p className="text-sm text-zinc-500 mt-1">{unit}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              isLow && 'bg-gradient-to-r from-rose-500 to-rose-400',
              isMedium && 'bg-gradient-to-r from-amber-500 to-amber-400',
              !isLow && !isMedium && `bg-gradient-to-r ${gradient}`
            )}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-zinc-500">נצלו: </span>
          <span className="text-zinc-300">{used.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-zinc-500">סה״כ: </span>
          <span className="text-zinc-300">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Warning Message */}
      {isLow && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20"
        >
          <p className="text-sm text-rose-400 text-center">
            ⚠️ הקרדיטים עומדים להיגמר
          </p>
        </motion.div>
      )}
    </div>
  )
}
