'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/sidebar'
import { PipelineVisualizer, PipelineStep, StepStatus } from '@/components/dashboard/pipeline-visualizer'
import { Terminal, LogEntry, LogType } from '@/components/dashboard/terminal'
import { CreditsCard } from '@/components/dashboard/credits-card'
import { ApprovalInterface } from '@/components/approval/approval-interface'
import { MediaLibrary, MediaItem } from '@/components/library/media-library'
import { pipelineApi, creditsApi, type CreditsStatus } from '@/lib/api'
import { CreditCard, Clock, Zap } from 'lucide-react'

// Mock data for demo
const mockPipelineSteps: PipelineStep[] = [
  { id: 'scrape', name: 'Scraping Content', nameHe: 'שליפת תוכן', status: 'completed', duration: '00:03' },
  { id: 'script', name: 'Generating Script', nameHe: 'יצירת סקריפט', status: 'completed', duration: '00:12' },
  { id: 'approve', name: 'Awaiting Approval', nameHe: 'ממתין לאישור', status: 'active' },
  { id: 'audio', name: 'Generating Audio', nameHe: 'יצירת אודיו', status: 'pending' },
  { id: 'video', name: 'Generating Video', nameHe: 'יצירת וידאו', status: 'pending' },
  { id: 'distribute', name: 'Distribution', nameHe: 'הפצה', status: 'pending' },
]

const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '12:40:52', type: 'system', message: 'System initialized' },
  { id: '2', timestamp: '12:40:53', type: 'info', message: 'Starting daily content pipeline...' },
  { id: '3', timestamp: '12:40:55', type: 'success', message: 'Successfully scraped Tanya content for today' },
  { id: '4', timestamp: '12:41:02', type: 'info', message: 'Sending content to Gemini AI...' },
  { id: '5', timestamp: '12:41:14', type: 'success', message: 'Script generated (127 words, ~60 seconds)' },
  { id: '6', timestamp: '12:41:15', type: 'info', message: 'Sending script for approval via Telegram...' },
  { id: '7', timestamp: '12:41:16', type: 'warning', message: 'Awaiting user approval' },
]

const mockScript = `היום נלמד על הניצוץ האלוקי שבתוך כל יהודי.

התניא מלמד אותנו שבכל אחד מאיתנו יש נשמה - חלק אלוק ממעל ממש.

זה לא משנה איפה אתה נמצא בחיים, הניצוץ הזה תמיד דולק.

כמו נר קטן שאף רוח לא יכולה לכבות.

השאלה היא - האם אתה מאפשר לו להאיר?`

const mockMediaItems: MediaItem[] = [
  {
    id: '1',
    title: 'תניא יומי - י״ד כסלו',
    date: '14/12/2024',
    duration: '01:02',
    thumbnail: '',
    status: 'completed',
    sentTo: ['telegram', 'whatsapp'],
    views: 1240,
  },
  {
    id: '2',
    title: 'תניא יומי - י״ג כסלו',
    date: '13/12/2024',
    duration: '00:58',
    thumbnail: '',
    status: 'completed',
    sentTo: ['telegram'],
    views: 980,
  },
  {
    id: '3',
    title: 'תניא יומי - י״ב כסלו',
    date: '12/12/2024',
    duration: '01:05',
    thumbnail: '',
    status: 'failed',
    sentTo: [],
  },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [systemStatus, setSystemStatus] = useState<'online' | 'processing' | 'error'>('online')
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(mockPipelineSteps)
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [isRunning, setIsRunning] = useState(true)
  const [credits, setCredits] = useState({
    elevenlabs: { total: 60000, used: 15000, remaining: 45000, unit: 'characters' },
    heygen: { total: 100, used: 23, remaining: 77, unit: 'minutes' },
  })

  // Add log entry
  const addLog = useCallback((type: LogType, message: string) => {
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
    }
    setLogs((prev) => [...prev, newLog])
  }, [])

  // Start pipeline
  const handleStartPipeline = async () => {
    if (isRunning) return
    setIsRunning(true)
    setSystemStatus('processing')
    addLog('info', 'Starting pipeline...')

    // Reset steps
    setPipelineSteps((steps) =>
      steps.map((step, index) => ({
        ...step,
        status: index === 0 ? 'active' : 'pending',
        duration: undefined,
      }))
    )
  }

  // Handle approval
  const handleApprove = () => {
    addLog('success', 'Script approved!')
    setPipelineSteps((steps) =>
      steps.map((step) =>
        step.id === 'approve'
          ? { ...step, status: 'completed' as StepStatus, duration: '02:15' }
          : step.id === 'audio'
          ? { ...step, status: 'active' as StepStatus }
          : step
      )
    )
  }

  const handleReject = () => {
    addLog('warning', 'Script rejected, regenerating...')
  }

  const handleEdit = (newScript: string) => {
    addLog('info', 'Script edited')
  }

  const handleVoiceNote = (blob: Blob) => {
    addLog('info', 'Voice note received, processing with Whisper...')
  }

  const handleTextFeedback = (feedback: string) => {
    addLog('info', `Feedback received: ${feedback}`)
  }

  // Render active view
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Hero Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div
                style={{
                  background: 'rgba(24, 24, 27, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap style={{ width: 24, height: 24, color: '#34d399' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>סרטונים החודש</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>24</p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(24, 24, 27, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard style={{ width: 24, height: 24, color: '#818cf8' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>צפיות כוללות</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>12.4K</p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(24, 24, 27, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 12,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock style={{ width: 24, height: 24, color: '#a78bfa' }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>זמן עיבוד ממוצע</p>
                    <p style={{ fontSize: 28, fontWeight: 700, color: 'white', margin: 0 }}>4:32</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline Visualizer */}
            <PipelineVisualizer
              steps={pipelineSteps}
              isRunning={isRunning}
              onStart={handleStartPipeline}
            />

            {/* Credits & Terminal Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
              <CreditsCard
                type="elevenlabs"
                total={credits.elevenlabs.total}
                used={credits.elevenlabs.used}
                unit={credits.elevenlabs.unit}
              />

              <CreditsCard
                type="heygen"
                total={credits.heygen.total}
                used={credits.heygen.used}
                unit={credits.heygen.unit}
              />

              <Terminal logs={logs} maxHeight={350} />
            </div>
          </div>
        )

      case 'approval':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-120px)]"
          >
            <ApprovalInterface
              script={mockScript}
              onApprove={handleApprove}
              onReject={handleReject}
              onEdit={handleEdit}
              onVoiceNote={handleVoiceNote}
              onTextFeedback={handleTextFeedback}
            />
          </motion.div>
        )

      case 'library':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <MediaLibrary
              items={mockMediaItems}
              onPlay={(id) => addLog('info', `Playing video ${id}`)}
              onDownload={(id) => addLog('info', `Downloading video ${id}`)}
              onRegenerate={(id) => addLog('info', `Regenerating video ${id}`)}
              onDelete={(id) => addLog('warning', `Deleted video ${id}`)}
            />
          </motion.div>
        )

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">Settings</h2>
            <p className="text-zinc-500">Settings page coming soon...</p>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        systemStatus={systemStatus}
      />

      {/* Main Content */}
      <main style={{ marginRight: 280, padding: 32, transition: 'margin 0.3s ease' }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white', margin: 0 }}>
                {activeTab === 'dashboard' && 'Mission Control'}
                {activeTab === 'approval' && 'Script Approval'}
                {activeTab === 'library' && 'Media Library'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p style={{ fontSize: 14, color: '#71717a', marginTop: 4, marginBottom: 0 }}>
                {activeTab === 'dashboard' && 'Monitor and control your content pipeline'}
                {activeTab === 'approval' && 'Review and approve generated scripts'}
                {activeTab === 'library' && 'Browse your generated content'}
                {activeTab === 'settings' && 'Configure your automation settings'}
              </p>
            </div>

            {/* Credit Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              borderRadius: 12,
              background: 'rgba(24, 24, 27, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 14, color: '#a1a1aa' }}>
                  {credits.elevenlabs.remaining.toLocaleString()} chars
                </span>
              </div>
              <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ fontSize: 14, color: '#a1a1aa' }}>{credits.heygen.remaining} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  )
}
