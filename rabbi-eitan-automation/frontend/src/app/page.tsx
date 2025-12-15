'use client'

import { useState, useEffect } from 'react'

type StationStatus = 'waiting' | 'active' | 'completed' | 'error'

interface Station {
  id: string
  hebrewName: string
  icon: string
  status: StationStatus
}

export default function HomePage() {
  const [stations, setStations] = useState<Station[]>([
    { id: 'scrape', hebrewName: 'תוכן', icon: '📖', status: 'completed' },
    { id: 'script', hebrewName: 'סקריפט', icon: '✍️', status: 'completed' },
    { id: 'approve', hebrewName: 'אישור', icon: '✅', status: 'active' },
    { id: 'audio', hebrewName: 'הקלטה', icon: '🎙️', status: 'waiting' },
    { id: 'video', hebrewName: 'וידאו', icon: '🎬', status: 'waiting' },
    { id: 'send', hebrewName: 'שליחה', icon: '📤', status: 'waiting' },
  ])

  const [scriptText] = useState(`שלום וברכה לכל בית ישראל!

היום נלמד יחד קטע מיוחד מספר התניא על הניצוץ האלוקי שבתוך כל יהודי.

התניא מלמד אותנו שבכל אחד מאיתנו יש נשמה - חלק אלוק ממעל ממש.

יום טוב ומבורך!`)

  const completedCount = stations.filter(s => s.status === 'completed').length
  const activeStation = stations.find(s => s.status === 'active')

  const handleApprove = () => {
    setStations(prev => prev.map(s => {
      if (s.id === 'approve') return { ...s, status: 'completed' as StationStatus }
      if (s.id === 'audio') return { ...s, status: 'active' as StationStatus }
      return s
    }))
  }

  const getStatusStyle = (status: StationStatus) => {
    if (status === 'completed') return { bg: '#10b981', border: '#10b981' }
    if (status === 'active') return { bg: '#ca8a04', border: '#ca8a04' }
    return { bg: 'transparent', border: '#3f3f46' }
  }

  const features = [
    { icon: '📖', title: 'תוכן אוטומטי', desc: 'שליפת התניא היומי מ-Chabad.org' },
    { icon: '🤖', title: 'בינה מלאכותית', desc: 'יצירת סקריפט עם Gemini AI' },
    { icon: '🎙️', title: 'קול מושלם', desc: 'הקלטה באמצעות ElevenLabs' },
    { icon: '📤', title: 'הפצה רחבה', desc: 'שליחה לטלגרם ו-WhatsApp' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      direction: 'rtl',
      overflow: 'hidden',
    }}>

      {/* Header */}
      <header style={{
        padding: '16px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 14,
          fontWeight: 500,
        }}>
          הרב איתן ▾
        </div>
        <div style={{
          padding: '8px 20px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 20,
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          ✨ מערכת דור הבא
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        textAlign: 'center',
        padding: '60px 40px 80px',
      }}>
        {/* Abstract Background Waves */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(120, 119, 198, 0.15), transparent),
            radial-gradient(ellipse 60% 30% at 70% 50%, rgba(255, 180, 100, 0.08), transparent)
          `,
          zIndex: 0,
        }} />

        {/* Wave Lines */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '300px',
          opacity: 0.15,
          background: `repeating-linear-gradient(
            90deg,
            transparent 0px,
            transparent 40px,
            rgba(255,255,255,0.3) 40px,
            rgba(255,255,255,0.3) 41px
          )`,
          maskImage: 'radial-gradient(ellipse 50% 100% at 50% 50%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 50% 100% at 50% 50%, black, transparent)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Main Title */}
          <h1 style={{
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 300,
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}>
            תניא יומי
            <br />
            <span style={{ fontWeight: 600 }}>באוטומציה מלאה</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 500,
            margin: '24px auto 40px',
            lineHeight: 1.6,
          }}>
            מערכת חכמה שיוצרת סרטוני תניא יומיים - מתוכן ועד הפצה.
            <br />
            הכל אוטומטי, הכל מושלם.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button style={{
              padding: '14px 32px',
              background: 'white',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
              התחל מסע
            </button>
            <button style={{
              padding: '14px 32px',
              background: 'transparent',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
            }}>
              למד עוד
            </button>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button style={{
          position: 'absolute',
          left: 40,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 40,
          height: 40,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 18,
        }}>‹</button>
        <button style={{
          position: 'absolute',
          right: 40,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 40,
          height: 40,
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.4)',
          cursor: 'pointer',
          fontSize: 18,
        }}>›</button>
      </section>

      {/* Journey Section */}
      {activeStation && (
        <section style={{
          padding: '0 40px 60px',
          maxWidth: 800,
          margin: '0 auto',
        }}>
          {/* Journey Progress */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginBottom: 32,
          }}>
            {stations.map((station, i) => (
              <div key={station.id} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: getStatusStyle(station.status).bg === 'transparent'
                    ? 'rgba(255,255,255,0.05)'
                    : `${getStatusStyle(station.status).bg}20`,
                  border: `2px solid ${getStatusStyle(station.status).border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  boxShadow: station.status === 'active' ? '0 0 15px rgba(202, 138, 4, 0.4)' : 'none',
                }}>
                  {station.status === 'completed' ? '✓' : station.icon}
                </div>
                {i < stations.length - 1 && (
                  <div style={{
                    width: 40,
                    height: 2,
                    background: stations[i + 1].status !== 'waiting'
                      ? 'linear-gradient(90deg, #10b981, #ca8a04)'
                      : 'rgba(255,255,255,0.1)',
                    marginRight: 4,
                    marginLeft: 4,
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Card */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16,
            padding: 28,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
            }}>
              <div style={{
                width: 8,
                height: 8,
                background: '#ca8a04',
                borderRadius: '50%',
                boxShadow: '0 0 8px #ca8a04',
              }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>תחנה נוכחית</span>
              <span style={{ fontWeight: 600, fontSize: 16 }}>{activeStation.hebrewName}</span>
            </div>

            {activeStation.id === 'approve' && (
              <>
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                  maxHeight: 200,
                  overflow: 'auto',
                }}>
                  <p style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: 'rgba(255,255,255,0.8)',
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {scriptText}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleApprove}
                    style={{
                      flex: 1,
                      padding: '12px 20px',
                      background: 'white',
                      color: '#0a0a0a',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    ✓ אישור
                  </button>
                  <button style={{
                    padding: '12px 20px',
                    background: 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}>
                    עריכה
                  </button>
                  <button style={{
                    padding: '12px 20px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}>
                    דחייה
                  </button>
                </div>
              </>
            )}

            {activeStation.id !== 'approve' && (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  border: '2px solid #ca8a04',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  margin: '0 auto 12px',
                  animation: 'spin 1s linear infinite',
                }} />
                <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: 14 }}>מעבד...</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Feature Cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'rgba(255,255,255,0.05)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        {features.map((feature, i) => (
          <div
            key={i}
            style={{
              padding: '32px 24px',
              background: '#0a0a0a',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 16 }}>{feature.icon}</div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              margin: '0 0 8px',
              color: '#ca8a04',
            }}>
              {feature.title}
            </h3>
            <p style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {feature.desc}
            </p>
          </div>
        ))}
      </section>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
        }
      `}</style>
    </div>
  )
}
