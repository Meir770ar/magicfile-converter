'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PipelineStatus, PipelineProgress } from '@/components/ui/pipeline-status'
import { pipelineApi, creditsApi, type PipelineStatus as PipelineStatusType, type CreditsStatus } from '@/lib/api'
import { formatDate } from '@/lib/utils'

// Initial state
const initialPipelineStatus: PipelineStatusType = {
  current_step: 0,
  total_steps: 6,
  status: 'idle',
  steps: [
    { step: 1, name: 'גרידת תוכן', status: 'pending' },
    { step: 2, name: 'יצירת תסריט', status: 'pending' },
    { step: 3, name: 'ממתין לאישור', status: 'pending' },
    { step: 4, name: 'יצירת אודיו', status: 'pending' },
    { step: 5, name: 'יצירת וידאו', status: 'pending' },
    { step: 6, name: 'הפצה', status: 'pending' },
  ]
}

const initialCredits: CreditsStatus = {
  elevenlabs: { used: 0, remaining: 45000, unit: 'תווים' },
  heygen: { used: 0, remaining: 12, unit: 'סרטונים' },
  gemini: { status: 'פעיל', requests_today: 0 }
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
}

export default function Dashboard() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatusType>(initialPipelineStatus)
  const [credits, setCredits] = useState<CreditsStatus>(initialCredits)
  const [logs, setLogs] = useState<LogEntry[]>([
    { timestamp: new Date().toISOString(), level: 'info', message: 'המערכת אותחלה' },
    { timestamp: new Date().toISOString(), level: 'info', message: 'ממתין להפעלה...' }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const addLog = useCallback((level: LogEntry['level'], message: string) => {
    setLogs(prev => [...prev.slice(-50), { timestamp: new Date().toISOString(), level, message }])
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [pipelineRes, creditsRes] = await Promise.all([
        pipelineApi.getStatus(),
        creditsApi.getStatus()
      ])

      if (pipelineRes.data) {
        setPipelineStatus(pipelineRes.data)
      }
      if (creditsRes.data) {
        setCredits(creditsRes.data)
      }
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleTriggerPipeline = async () => {
    setIsLoading(true)
    addLog('info', 'מתחיל את הפייפליין...')

    try {
      const result = await pipelineApi.trigger()
      if (result.data) {
        addLog('success', 'הפייפליין הופעל בהצלחה')
        fetchData()
      } else {
        addLog('error', `שגיאה: ${result.error}`)
      }
    } catch (error) {
      addLog('error', `שגיאה: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string, text: string, label: string }> = {
      idle: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'ממתין' },
      running: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'פעיל' },
      paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'מושהה' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: 'הושלם' },
      failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'נכשל' }
    }
    const badge = badges[status] || badges.idle
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">הרב איתן - לוח בקרה</h1>
              <p className="text-gray-500 text-sm">מערכת אוטומציה לתניא יומי</p>
            </div>
            <div className="flex items-center gap-4">
              {getStatusBadge(pipelineStatus.status)}
              <span className="text-sm text-gray-500">
                עדכון: {lastUpdate.toLocaleTimeString('he-IL')}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Pipeline Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">סטטוס הפייפליין</CardTitle>
                <CardDescription>מעקב אחר תהליך יצירת התוכן</CardDescription>
              </div>
              <Button
                onClick={handleTriggerPipeline}
                disabled={isLoading || pipelineStatus.status === 'running'}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin ml-2">⟳</span>
                    מעבד...
                  </>
                ) : (
                  'הפעל ידנית'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <PipelineProgress steps={pipelineStatus.steps} />
            <PipelineStatus
              steps={pipelineStatus.steps}
              currentStep={pipelineStatus.current_step}
            />
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ElevenLabs Credits */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🎙️</span>
                ElevenLabs
              </CardTitle>
              <CardDescription>קרדיטים לאודיו</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold text-blue-600">
                    {credits.elevenlabs.remaining.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">{credits.elevenlabs.unit}</span>
                </div>
                <Progress
                  value={(credits.elevenlabs.remaining / (credits.elevenlabs.remaining + credits.elevenlabs.used)) * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  נוצלו: {credits.elevenlabs.used.toLocaleString()} {credits.elevenlabs.unit}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* HeyGen Credits */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">🎬</span>
                HeyGen
              </CardTitle>
              <CardDescription>קרדיטים לוידאו</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold text-purple-600">
                    {credits.heygen.remaining}
                  </span>
                  <span className="text-sm text-gray-500">{credits.heygen.unit}</span>
                </div>
                <Progress
                  value={(credits.heygen.remaining / (credits.heygen.remaining + credits.heygen.used)) * 100}
                  className="h-2"
                />
                <p className="text-xs text-gray-500">
                  נוצלו: {credits.heygen.used} {credits.heygen.unit}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Gemini Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Gemini AI
              </CardTitle>
              <CardDescription>סטטוס יצירת תסריטים</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-3xl font-bold text-green-600">
                    {credits.gemini.status}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-600">
                    בקשות היום: <span className="font-medium">{credits.gemini.requests_today}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">לוגים</CardTitle>
                <CardDescription>פעילות אחרונה במערכת</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLogs([])}>
                נקה לוגים
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <p className="text-gray-500">אין לוגים להצגה</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={getLogColor(log.level)}>
                    <span className="text-gray-600">
                      [{new Date(log.timestamp).toLocaleTimeString('he-IL')}]
                    </span>{' '}
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">פעולות מהירות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <span className="text-2xl">📝</span>
                <span>תסריט חדש</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <span className="text-2xl">🔄</span>
                <span>רענן תוכן</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <span className="text-2xl">📤</span>
                <span>הפץ ידנית</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col gap-2">
                <span className="text-2xl">⚙️</span>
                <span>הגדרות</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-8">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-500">
            Rabbi Eitan Automation System v1.0.0
          </p>
        </div>
      </footer>
    </div>
  )
}
