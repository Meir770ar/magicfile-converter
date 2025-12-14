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
          <div className="space-y-6">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">סרטונים החודש</p>
                    <p className="text-2xl font-bold text-white">24</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">צפיות כוללות</p>
                    <p className="text-2xl font-bold text-white">12.4K</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">זמן עיבוד ממוצע</p>
                    <p className="text-2xl font-bold text-white">4:32</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Pipeline Visualizer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PipelineVisualizer
                steps={pipelineSteps}
                isRunning={isRunning}
                onStart={handleStartPipeline}
              />
            </motion.div>

            {/* Credits & Terminal Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <CreditsCard
                  type="elevenlabs"
                  total={credits.elevenlabs.total}
                  used={credits.elevenlabs.used}
                  unit={credits.elevenlabs.unit}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <CreditsCard
                  type="heygen"
                  total={credits.heygen.total}
                  used={credits.heygen.used}
                  unit={credits.heygen.unit}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:row-span-2"
              >
                <Terminal logs={logs} maxHeight={400} />
              </motion.div>
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
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">
                {activeTab === 'dashboard' && 'Mission Control'}
                {activeTab === 'approval' && 'Script Approval'}
                {activeTab === 'library' && 'Media Library'}
                {activeTab === 'settings' && 'Settings'}
              </h1>
              <p className="text-zinc-500 mt-1">
                {activeTab === 'dashboard' && 'Monitor and control your content pipeline'}
                {activeTab === 'approval' && 'Review and approve generated scripts'}
                {activeTab === 'library' && 'Browse your generated content'}
                {activeTab === 'settings' && 'Configure your automation settings'}
              </p>
            </div>

            {/* Credit Badge */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900/50 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-zinc-400">
                  {credits.elevenlabs.remaining.toLocaleString()} chars
                </span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-sm text-zinc-400">{credits.heygen.remaining} min</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Page Content */}
        <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
      </main>
    </div>
  )
}
