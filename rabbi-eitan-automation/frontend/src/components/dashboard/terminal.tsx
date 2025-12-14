'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as TerminalIcon, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type LogType = 'info' | 'success' | 'warning' | 'error' | 'system'

export interface LogEntry {
  id: string
  timestamp: string
  type: LogType
  message: string
}

const logTypeConfig: Record<LogType, { color: string; prefix: string }> = {
  info: { color: 'text-blue-400', prefix: '[INFO]' },
  success: { color: 'text-emerald-400', prefix: '[OK]' },
  warning: { color: 'text-amber-400', prefix: '[WARN]' },
  error: { color: 'text-rose-400', prefix: '[ERR]' },
  system: { color: 'text-purple-400', prefix: '[SYS]' },
}

interface TerminalProps {
  logs: LogEntry[]
  maxHeight?: number
}

export function Terminal({ logs, maxHeight = 300 }: TerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="glass-card overflow-hidden">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Circle className="w-3 h-3 fill-rose-500 text-rose-500" />
            <Circle className="w-3 h-3 fill-amber-500 text-amber-500" />
            <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500" />
          </div>
          <div className="flex items-center gap-2 text-zinc-400">
            <TerminalIcon className="w-4 h-4" />
            <span className="text-sm font-medium">System Logs</span>
          </div>
        </div>
        <span className="text-xs text-zinc-600 font-mono">rabbi-eitan-ai</span>
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        className="terminal custom-scrollbar overflow-y-auto p-4"
        style={{ maxHeight }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'terminal-line flex items-start gap-3 py-1.5',
                index === logs.length - 1 && 'bg-white/[0.02]'
              )}
            >
              {/* Timestamp */}
              <span className="text-zinc-600 font-mono text-xs shrink-0">
                {log.timestamp}
              </span>

              {/* Type Prefix */}
              <span
                className={cn(
                  'font-mono text-xs shrink-0',
                  logTypeConfig[log.type].color
                )}
              >
                {logTypeConfig[log.type].prefix}
              </span>

              {/* Message */}
              <span
                className={cn(
                  'text-sm',
                  log.type === 'error' ? 'text-rose-300' : 'text-zinc-300'
                )}
              >
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cursor */}
        <div className="flex items-center gap-2 mt-2 text-zinc-500">
          <span className="font-mono text-sm">{'>'}</span>
          <span className="w-2 h-4 bg-indigo-500 animate-blink" />
        </div>
      </div>
    </div>
  )
}
