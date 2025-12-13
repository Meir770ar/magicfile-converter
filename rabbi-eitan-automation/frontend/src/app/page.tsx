'use client'

import { useState, useEffect } from 'react'

interface PipelineStep {
  step: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

interface PipelineStatus {
  current_step: number
  total_steps: number
  status: string
  steps: PipelineStep[]
}

interface Credits {
  elevenlabs: { used: number; remaining: number; unit: string }
  heygen: { used: number; remaining: number; unit: string }
  gemini: { status: string; requests_today: number }
}

export default function Dashboard() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  const [credits, setCredits] = useState<Credits | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch pipeline status
    const fetchData = async () => {
      try {
        const [pipelineRes, creditsRes] = await Promise.all([
          fetch('/api/v1/pipeline/status'),
          fetch('/api/v1/credits')
        ])

        if (pipelineRes.ok) {
          setPipelineStatus(await pipelineRes.json())
        }
        if (creditsRes.ok) {
          setCredits(await creditsRes.json())
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓'
      case 'in_progress': return '⟳'
      case 'failed': return '✗'
      default: return '○'
    }
  }

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in_progress': return 'bg-blue-500 animate-pulse'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="container mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">הרב איתן - לוח בקרה</h1>
        <p className="text-gray-600 mt-2">מערכת אוטומציה לתניא יומי</p>
      </div>

      {/* Pipeline Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">סטטוס הפייפליין</h2>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : pipelineStatus ? (
          <div>
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-6">
              <div
                className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(pipelineStatus.current_step / pipelineStatus.total_steps) * 100}%` }}
              ></div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-6 gap-4">
              {pipelineStatus.steps.map((step) => (
                <div key={step.step} className="text-center">
                  <div className={`w-10 h-10 mx-auto rounded-full ${getStepColor(step.status)} flex items-center justify-center text-white font-bold`}>
                    {getStepIcon(step.status)}
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{step.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">לא ניתן לטעון סטטוס</p>
        )}

        {/* Manual Trigger Button */}
        <div className="mt-6 flex justify-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
            הפעל ידנית
          </button>
        </div>
      </div>

      {/* Credits Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">קרדיטים API</h2>

        {credits ? (
          <div className="grid grid-cols-3 gap-6">
            {/* ElevenLabs */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">ElevenLabs</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {credits.elevenlabs.remaining.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">{credits.elevenlabs.unit} נותרו</p>
            </div>

            {/* HeyGen */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">HeyGen</h3>
              <p className="text-2xl font-bold text-purple-600 mt-2">
                {credits.heygen.remaining}
              </p>
              <p className="text-sm text-gray-500">{credits.heygen.unit} נותרו</p>
            </div>

            {/* Gemini */}
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700">Gemini</h3>
              <p className="text-2xl font-bold text-green-600 mt-2">
                {credits.gemini.status}
              </p>
              <p className="text-sm text-gray-500">{credits.gemini.requests_today} בקשות היום</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">לא ניתן לטעון מידע קרדיטים</p>
        )}
      </div>

      {/* Logs Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">לוגים אחרונים</h2>
        <div className="bg-gray-900 rounded-lg p-4 h-48 overflow-y-auto font-mono text-sm">
          <p className="text-green-400">[2024-01-01 12:00:00] System initialized</p>
          <p className="text-gray-400">[2024-01-01 12:00:01] Waiting for trigger...</p>
        </div>
      </div>
    </div>
  )
}
