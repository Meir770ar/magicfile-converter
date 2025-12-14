'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Send,
  MessageCircle,
  MoreVertical,
  Eye,
  Trash2,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function MediaLibrary({
  items,
  onPlay,
  onDownload,
  onRegenerate,
  onDelete,
}: MediaLibraryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all')

  const filteredItems = items.filter(
    (item) => filter === 'all' || item.status === filter
  )

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🎞️</span>
          Media Library
        </h2>

        <div className="flex items-center gap-2">
          {(['all', 'completed', 'processing', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                filter === f
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-zinc-500 hover:text-white'
              )}
            >
              {f === 'all' && 'הכל'}
              {f === 'completed' && 'הושלמו'}
              {f === 'processing' && 'בעיבוד'}
              {f === 'failed' && 'נכשלו'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
              className="glass-card overflow-hidden group"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-zinc-900">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl">🎬</span>
                  </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => onPlay(item.id)}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Play className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => onDownload(item.id)}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge */}
                <div
                  className={cn(
                    'absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium',
                    item.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                    item.status === 'processing' && 'bg-amber-500/20 text-amber-400',
                    item.status === 'failed' && 'bg-rose-500/20 text-rose-400'
                  )}
                >
                  {item.status === 'completed' && 'הושלם'}
                  {item.status === 'processing' && 'בעיבוד...'}
                  {item.status === 'failed' && 'נכשל'}
                </div>

                {/* Duration */}
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-mono">
                  {item.duration}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-medium text-white truncate">{item.title}</h3>

                <div className="flex items-center gap-3 mt-2 text-sm text-zinc-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {item.date}
                  </span>
                  {item.views !== undefined && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {item.views}
                    </span>
                  )}
                </div>

                {/* Distribution Badges */}
                <div className="flex items-center gap-2 mt-3">
                  {item.sentTo.includes('telegram') && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs">
                      <Send className="w-3 h-3" />
                      Telegram
                    </span>
                  )}
                  {item.sentTo.includes('whatsapp') && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-400 text-xs">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  {item.status === 'failed' ? (
                    <button
                      onClick={() => onRegenerate(item.id)}
                      className="flex items-center gap-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      נסה שוב
                    </button>
                  ) : (
                    <button
                      onClick={() => {}}
                      className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      שתף
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                    className="p-1.5 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {selectedId === item.id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute left-4 bottom-16 bg-zinc-800 border border-white/10 rounded-lg overflow-hidden shadow-xl z-10"
                    >
                      <button
                        onClick={() => {
                          onDelete(item.id)
                          setSelectedId(null)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 w-full"
                      >
                        <Trash2 className="w-4 h-4" />
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
          className="text-center py-16"
        >
          <span className="text-5xl mb-4 block">📭</span>
          <h3 className="text-lg font-medium text-white mb-2">אין תוכן להצגה</h3>
          <p className="text-zinc-500">
            {filter === 'all'
              ? 'התחל ליצור תוכן חדש'
              : 'אין פריטים בסטטוס זה'}
          </p>
        </motion.div>
      )}
    </div>
  )
}
