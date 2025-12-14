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

  const sidebarWidth = isCollapsed ? 80 : 280

  return (
    <aside
      style={{
        width: sidebarWidth,
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        background: 'rgba(24, 24, 27, 0.95)',
        backdropFilter: 'blur(12px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 50,
        transition: 'width 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '0 8px' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)',
              flexShrink: 0,
            }}
          >
            <Zap className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: 0 }}>Rabbi Eitan</h1>
              <p style={{ fontSize: 12, color: '#71717a', margin: 0 }}>AI Content Engine</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn('sidebar-item', activeTab === item.id && 'active')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: activeTab === item.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: activeTab === item.id ? '#818cf8' : '#a1a1aa',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'right',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ color: activeTab === item.id ? '#818cf8' : '#a1a1aa' }}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span style={{ flex: 1, textAlign: 'right' }}>
                    {item.label}
                  </span>
                )}
                {item.badge && !isCollapsed && (
                  <span
                    style={{
                      padding: '2px 8px',
                      fontSize: 12,
                      borderRadius: '9999px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* System Status */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px' }}>
            <div className={cn('status-dot', systemStatus)} />
            {!isCollapsed && (
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: '#a1a1aa', margin: 0 }}>System Status</p>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    margin: 0,
                    color:
                      systemStatus === 'online'
                        ? '#34d399'
                        : systemStatus === 'processing'
                        ? '#fbbf24'
                        : '#f87171',
                  }}
                >
                  {systemStatus === 'online' && 'Online'}
                  {systemStatus === 'processing' && 'Processing'}
                  {systemStatus === 'error' && 'Error'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 48,
            background: '#27272a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" style={{ color: '#a1a1aa' }} />
          ) : (
            <ChevronLeft className="w-4 h-4" style={{ color: '#a1a1aa' }} />
          )}
        </button>
      </div>
    </aside>
  )
}
