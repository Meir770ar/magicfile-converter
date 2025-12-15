'use client'

import { useState, useEffect } from 'react'

// Types
type StationStatus = 'waiting' | 'active' | 'completed' | 'error'

interface Station {
  id: string
  hebrewName: string
  icon: string
  status: StationStatus
  description?: string
  time?: string
}

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([
    { id: 'scrape', hebrewName: 'תוכן', icon: '📖', status: 'completed', description: 'תניא יומי - י״ז כסלו', time: '06:00' },
    { id: 'script', hebrewName: 'סקריפט', icon: '✍️', status: 'completed', description: '85 מילים', time: '06:05' },
    { id: 'approve', hebrewName: 'אישור', icon: '✅', status: 'active', description: 'ממתין לאישור', time: '' },
    { id: 'audio', hebrewName: 'הקלטה', icon: '🎙️', status: 'waiting', description: '', time: '' },
    { id: 'video', hebrewName: 'וידאו', icon: '🎬', status: 'waiting', description: '', time: '' },
    { id: 'send', hebrewName: 'שליחה', icon: '📤', status: 'waiting', description: '', time: '' },
  ])

  const [todayDate, setTodayDate] = useState('')
  const [scriptText, setScriptText] = useState(`שלום וברכה לכל בית ישראל!

היום נלמד יחד קטע מיוחד מספר התניא על הניצוץ האלוקי שבתוך כל יהודי.

התניא מלמד אותנו שבכל אחד מאיתנו יש נשמה - חלק אלוק ממעל ממש. זה לא משנה איפה אתה נמצא בחיים, הניצוץ הזה תמיד דולק.

כמו נר קטן שאף רוח לא יכולה לכבות. השאלה היא - האם אתה מאפשר לו להאיר?

יום טוב ומבורך!`)

  useEffect(() => {
    const today = new Date()
    setTodayDate(today.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
  }, [])

  const getStatusColor = (status: StationStatus) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'active': return '#6366f1'
      case 'error': return '#f43f5e'
      default: return '#3f3f46'
    }
  }

  const completedCount = stations.filter(s => s.status === 'completed').length
  const activeStation = stations.find(s => s.status === 'active')

  // Handle approval actions
  const handleApprove = () => {
    setStations(prev => prev.map(s => {
      if (s.id === 'approve') return { ...s, status: 'completed' as StationStatus, time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }
      if (s.id === 'audio') return { ...s, status: 'active' as StationStatus }
      return s
    }))
  }

  const handleReject = () => {
    setStations(prev => prev.map(s => {
      if (s.id === 'script') return { ...s, status: 'active' as StationStatus }
      if (s.id === 'approve') return { ...s, status: 'waiting' as StationStatus }
      return s
    }))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #09090b 0%, #18181b 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      direction: 'rtl',
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            🕎 הרב איתן - תניא יומי
          </h1>
          <p style={{ color: '#71717a', margin: '4px 0 0', fontSize: 13 }}>{todayDate}</p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          border: 'none',
          padding: '10px 20px',
          borderRadius: 8,
          color: 'white',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: 14,
        }}>
          ▶️ התחל מסע חדש
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '40px 32px', maxWidth: 900, margin: '0 auto' }}>

        {/* Journey Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#a1a1aa', margin: 0 }}>
            מסע יצירת הסרטון
          </h2>
          <p style={{ color: '#52525b', fontSize: 14, marginTop: 4 }}>
            {completedCount} מתוך {stations.length} תחנות הושלמו
          </p>
        </div>

        {/* Journey Track */}
        <div style={{ position: 'relative', padding: '0 20px' }}>

          {/* Background Track Line */}
          <div style={{
            position: 'absolute',
            top: 35,
            right: 60,
            left: 60,
            height: 4,
            background: '#27272a',
            borderRadius: 2,
          }} />

          {/* Progress Track Line */}
          <div style={{
            position: 'absolute',
            top: 35,
            right: 60,
            width: `calc(${(completedCount / (stations.length - 1)) * 100}% - 40px)`,
            maxWidth: 'calc(100% - 120px)',
            height: 4,
            background: 'linear-gradient(90deg, #10b981, #6366f1)',
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />

          {/* Stations */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}>
            {stations.map((station) => (
              <div
                key={station.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 80,
                }}
              >
                {/* Station Circle */}
                <div style={{
                  width: 70,
                  height: 70,
                  borderRadius: '50%',
                  background: station.status === 'waiting' ? '#1f1f23' : `${getStatusColor(station.status)}20`,
                  border: `3px solid ${getStatusColor(station.status)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  marginBottom: 10,
                  boxShadow: station.status === 'active' ? `0 0 20px ${getStatusColor(station.status)}50` : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {station.status === 'completed' ? '✓' : station.icon}
                </div>

                {/* Station Name */}
                <div style={{ fontWeight: 600, fontSize: 14, color: station.status === 'waiting' ? '#52525b' : 'white' }}>
                  {station.hebrewName}
                </div>

                {/* Station Description */}
                {station.description && (
                  <div style={{ fontSize: 11, color: '#71717a', marginTop: 2, textAlign: 'center' }}>
                    {station.description}
                  </div>
                )}

                {/* Time */}
                {station.time && (
                  <div style={{ fontSize: 10, color: '#52525b', marginTop: 2 }}>{station.time}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active Station Panel */}
        {activeStation && (
          <div style={{
            marginTop: 50,
            padding: 28,
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 16,
          }}>
            {/* Panel Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}>
              <span style={{
                width: 10,
                height: 10,
                background: '#6366f1',
                borderRadius: '50%',
                boxShadow: '0 0 10px #6366f1',
              }} />
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                תחנה נוכחית: {activeStation.hebrewName}
              </h3>
            </div>

            {/* Script Content (for approval station) */}
            {activeStation.id === 'approve' && (
              <>
                <div style={{
                  background: 'rgba(0,0,0,0.4)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                }}>
                  <p style={{
                    fontSize: 16,
                    lineHeight: 1.9,
                    color: '#e4e4e7',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {scriptText}
                  </p>
                </div>

                {/* Word/Time info */}
                <div style={{
                  display: 'flex',
                  gap: 16,
                  marginBottom: 20,
                  fontSize: 13,
                  color: '#71717a',
                }}>
                  <span>📝 {scriptText.split(/\s+/).length} מילים</span>
                  <span>⏱️ ~{Math.ceil(scriptText.length / 15)} שניות</span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={handleApprove}
                    style={{
                      flex: 1,
                      padding: '14px 20px',
                      borderRadius: 10,
                      border: 'none',
                      background: '#10b981',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ אשר והמשך
                  </button>
                  <button style={{
                    padding: '14px 20px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'transparent',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}>
                    ✏️ ערוך
                  </button>
                  <button
                    onClick={handleReject}
                    style={{
                      padding: '14px 20px',
                      borderRadius: 10,
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: '#f87171',
                      fontWeight: 500,
                      fontSize: 15,
                      cursor: 'pointer',
                    }}
                  >
                    ✗ דחה
                  </button>
                </div>
              </>
            )}

            {/* Processing indicator for other stations */}
            {activeStation.id !== 'approve' && (
              <div style={{ textAlign: 'center', padding: 20 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  border: '3px solid #6366f1',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  animation: 'spin 1s linear infinite',
                }} />
                <p style={{ color: '#a1a1aa', margin: 0 }}>מעבד...</p>
              </div>
            )}
          </div>
        )}

        {/* Completed Message */}
        {completedCount === stations.length && (
          <div style={{
            marginTop: 50,
            padding: 32,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 16,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 8px' }}>המסע הושלם!</h3>
            <p style={{ color: '#71717a', margin: 0 }}>הסרטון נוצר ונשלח בהצלחה</p>
          </div>
        )}

        {/* Recent Videos */}
        <div style={{ marginTop: 50 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#a1a1aa' }}>
            📚 סרטונים אחרונים
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div style={{
                  aspectRatio: '16/9',
                  background: '#18181b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                }}>
                  🎬
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>תניא - י״{i + 3} כסלו</div>
                  <div style={{ fontSize: 11, color: '#52525b', marginTop: 4 }}>
                    1:23 • Telegram + WhatsApp
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Animations */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
