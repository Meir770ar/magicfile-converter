'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Download,
  RefreshCw,
  Calendar,
  Eye,
  Trash2,
  Share2,
  MoreVertical,
  Send,
  MessageCircle,
} from 'lucide-react'

export interface MediaItem {
  id: string
  title: string
  date: string
  duration: string
  thumbnail: string
  status: 'completed' | 'processing' | 'failed'
  sentTo: ('telegram' | 'whatsapp')[]
  views?: number
}

interface MediaLibraryProps {
  items: MediaItem[]
  onPlay: (id: string) => void
  onDownload: (id: string) => void
  onRegenerate: (id: string) => void
  onDelete: (id: string) => void
}

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'completed':
      return { background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }
    case 'processing':
      return { background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }
    case 'failed':
      return { background: 'rgba(244, 63, 94, 0.2)', color: '#f87171' }
    default:
      return { background: '#27272a', color: '#71717a' }
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'הושלם'
    case 'processing': return 'בעיבוד...'
    case 'failed': return 'נכשל'
    default: return ''
  }
}

export function MediaLibrary({
  items,
  onPlay,
  onDownload,
  onRegenerate,
  onDelete,
}: MediaLibraryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filteredItems = items.filter(
    (item) => filter === 'all' || item.status === filter
  )

  const filters = [
    { id: 'all', label: 'הכל' },
    { id: 'completed', label: 'הושלמו' },
    { id: 'processing', label: 'בעיבוד' },
    { id: 'failed', label: 'נכשלו' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🎞️</span>
          Media Library
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                background: filter === f.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: filter === f.id ? '#818cf8' : '#71717a',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                position: 'relative',
                background: 'rgba(24, 24, 27, 0.8)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Thumbnail */}
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#18181b' }}>
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 48 }}>🎬</span>
                  </div>
                )}

                {/* Overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0, 0, 0, 0.6)',
                  opacity: hoveredId === item.id ? 1 : 0,
                  transition: 'opacity 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                }}>
                  <button
                    onClick={() => onPlay(item.id)}
                    style={{
                      padding: 12,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <Play style={{ width: 24, height: 24 }} />
                  </button>
                  <button
                    onClick={() => onDownload(item.id)}
                    style={{
                      padding: 12,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'white',
                    }}
                  >
                    <Download style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                {/* Status Badge */}
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  padding: '4px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  ...getStatusStyle(item.status),
                }}>
                  {getStatusText(item.status)}
                </div>

                {/* Duration */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  fontSize: 12,
                  fontFamily: 'monospace',
                }}>
                  {item.duration}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 16 }}>
                <h3 style={{ fontWeight: 500, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, fontSize: 14, color: '#71717a' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar style={{ width: 14, height: 14 }} />
                    {item.date}
                  </span>
                  {item.views !== undefined && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye style={{ width: 14, height: 14 }} />
                      {item.views}
                    </span>
                  )}
                </div>

                {/* Distribution Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  {item.sentTo.includes('telegram') && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 9999,
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#60a5fa',
                      fontSize: 12,
                    }}>
                      <Send style={{ width: 12, height: 12 }} />
                      Telegram
                    </span>
                  )}
                  {item.sentTo.includes('whatsapp') && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 9999,
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#4ade80',
                      fontSize: 12,
                    }}>
                      <MessageCircle style={{ width: 12, height: 12 }} />
                      WhatsApp
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  {item.status === 'failed' ? (
                    <button
                      onClick={() => onRegenerate(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        color: '#fbbf24',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw style={{ width: 16, height: 16 }} />
                      נסה שוב
                    </button>
                  ) : (
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 14,
                        color: '#a1a1aa',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <Share2 style={{ width: 16, height: 16 }} />
                      שתף
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                    style={{
                      padding: 6,
                      borderRadius: 4,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#71717a',
                    }}
                  >
                    <MoreVertical style={{ width: 16, height: 16 }} />
                  </button>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {selectedId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        position: 'absolute',
                        left: 16,
                        bottom: 64,
                        background: '#27272a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                        overflow: 'hidden',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                        zIndex: 10,
                      }}
                    >
                      <button
                        onClick={() => {
                          onDelete(item.id)
                          setSelectedId(null)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 16px',
                          fontSize: 14,
                          color: '#f87171',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          width: '100%',
                        }}
                      >
                        <Trash2 style={{ width: 16, height: 16 }} />
                        מחק
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '64px 0' }}
        >
          <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>📭</span>
          <h3 style={{ fontSize: 18, fontWeight: 500, color: 'white', margin: 0, marginBottom: 8 }}>אין תוכן להצגה</h3>
          <p style={{ color: '#71717a', margin: 0 }}>
            {filter === 'all'
              ? 'התחל ליצור תוכן חדש'
              : 'אין פריטים בסטטוס זה'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
