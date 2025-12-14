'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket,
  FileText,
  Film,
  Settings,
  ChevronRight,
  ChevronLeft,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Mission Control', icon: <Rocket className="w-5 h-5" /> },
  { id: 'approval', label: 'Script Approval', icon: <FileText className="w-5 h-5" />, badge: 2 },
  { id: 'library', label: 'Media Library', icon: <Film className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
]

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  systemStatus: 'online' | 'processing' | 'error'
}

export function Sidebar({ activeTab, onTabChange, systemStatus }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed right-0 top-0 h-screen glass-card rounded-none border-l-0 border-t-0 border-b-0 z-50"
    >
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold text-white">Rabbi Eitan</h1>
                <p className="text-xs text-zinc-500">AI Content Engine</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'sidebar-item w-full',
                activeTab === item.id && 'active'
              )}
            >
              <span className={cn(
                'transition-colors',
                activeTab === item.id ? 'text-indigo-400' : 'text-zinc-400'
              )}>
                {item.icon}
              </span>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 text-right"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && !isCollapsed && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="px-2 py-0.5 text-xs rounded-full bg-indigo-500/20 text-indigo-400"
                >
                  {item.badge}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        {/* System Status */}
        <div className="mt-auto pt-4 border-t border-white/5">
          <div className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg',
            isCollapsed ? 'justify-center' : ''
          )}>
            <div className={cn('status-dot', systemStatus)} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1"
                >
                  <p className="text-sm text-zinc-400">System Status</p>
                  <p className={cn(
                    'text-xs font-medium',
                    systemStatus === 'online' && 'text-emerald-400',
                    systemStatus === 'processing' && 'text-amber-400',
                    systemStatus === 'error' && 'text-rose-400'
                  )}>
                    {systemStatus === 'online' && 'Online'}
                    {systemStatus === 'processing' && 'Processing'}
                    {systemStatus === 'error' && 'Error'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-12 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-zinc-400" />
          )}
        </button>
      </div>
    </motion.aside>
  )
}
