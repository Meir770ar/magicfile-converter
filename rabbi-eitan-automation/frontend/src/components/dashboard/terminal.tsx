'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal as TerminalIcon, Circle } from 'lucide-react'

export type LogType = 'info' | 'success' | 'warning' | 'error' | 'system'

export interface LogEntry {
  id: string
  timestamp: string
  type: LogType
  message: string
}

const logTypeConfig: Record<LogType, { color: string; prefix: string }> = {
  info: { color: '#60a5fa', prefix: '[INFO]' },
  success: { color: '#34d399', prefix: '[OK]' },
  warning: { color: '#fbbf24', prefix: '[WARN]' },
  error: { color: '#fb7185', prefix: '[ERR]' },
  system: { color: '#a78bfa', prefix: '[SYS]' },
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
    <div style={{
      background: 'rgba(24, 24, 27, 0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Terminal Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        background: 'rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Circle style={{ width: 12, height: 12, fill: '#f43f5e', color: '#f43f5e' }} />
            <Circle style={{ width: 12, height: 12, fill: '#f59e0b', color: '#f59e0b' }} />
            <Circle style={{ width: 12, height: 12, fill: '#10b981', color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a1a1aa' }}>
            <TerminalIcon style={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 14, fontWeight: 500 }}>System Logs</span>
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#52525b', fontFamily: 'monospace' }}>rabbi-eitan-ai</span>
      </div>

      {/* Terminal Content */}
      <div
        ref={scrollRef}
        style={{
          maxHeight,
          overflowY: 'auto',
          padding: 16,
          fontFamily: "'JetBrains Mono', 'Menlo', 'Monaco', monospace",
          fontSize: 14,
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(9, 9, 11, 0.95) 100%)',
        }}
      >
        <AnimatePresence initial={false}>
          {logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '6px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                background: index === logs.length - 1 ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
              }}
            >
              {/* Timestamp */}
              <span style={{ color: '#52525b', fontFamily: 'monospace', fontSize: 12, flexShrink: 0 }}>
                {log.timestamp}
              </span>

              {/* Type Prefix */}
              <span style={{
                fontFamily: 'monospace',
                fontSize: 12,
                flexShrink: 0,
                color: logTypeConfig[log.type].color,
              }}>
                {logTypeConfig[log.type].prefix}
              </span>

              {/* Message */}
              <span style={{
                fontSize: 14,
                color: log.type === 'error' ? '#fda4af' : '#d4d4d8',
              }}>
                {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Cursor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: '#71717a' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{'>'}</span>
          <span style={{
            width: 8,
            height: 16,
            background: '#6366f1',
            animation: 'blink 1s step-end infinite',
          }} />
        </div>
      </div>

      <style jsx global>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
