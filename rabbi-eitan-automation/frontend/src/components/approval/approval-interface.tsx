'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  MicOff,
  Send,
  Check,
  X,
  Edit3,
  RefreshCw,
  MessageSquare,
  Volume2,
} from 'lucide-react'

interface ApprovalInterfaceProps {
  script: string
  onApprove: () => void
  onReject: () => void
  onEdit: (newScript: string) => void
  onVoiceNote: (audioBlob: Blob) => void
  onTextFeedback: (feedback: string) => void
  isProcessing?: boolean
}

export function ApprovalInterface({
  script,
  onApprove,
  onReject,
  onEdit,
  onVoiceNote,
  onTextFeedback,
  isProcessing = false,
}: ApprovalInterfaceProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedScript, setEditedScript] = useState(script)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [textFeedback, setTextFeedback] = useState('')
  const [feedbackMode, setFeedbackMode] = useState<'text' | 'voice' | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setEditedScript(script)
  }, [script])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/ogg' })
        onVoiceNote(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSaveEdit = () => {
    onEdit(editedScript)
    setIsEditing(false)
  }

  const handleSendFeedback = () => {
    if (textFeedback.trim()) {
      onTextFeedback(textFeedback)
      setTextFeedback('')
      setFeedbackMode(null)
    }
  }

  const glassCardStyle = {
    background: 'rgba(24, 24, 27, 0.8)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 24,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, height: '100%' }}>
      {/* Left Side - Script */}
      <div style={{ ...glassCardStyle, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📝</span>
            סקריפט לאישור
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: 8,
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: isEditing ? 'rgba(99, 102, 241, 0.2)' : '#27272a',
              color: isEditing ? '#818cf8' : '#a1a1aa',
            }}
          >
            <Edit3 style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Script Content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          {isEditing ? (
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              dir="rtl"
              style={{
                width: '100%',
                height: '100%',
                padding: 16,
                background: 'rgba(24, 24, 27, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 8,
                color: 'white',
                fontSize: 18,
                lineHeight: 1.8,
                resize: 'none',
                outline: 'none',
              }}
            />
          ) : (
            <div style={{
              height: '100%',
              overflowY: 'auto',
              padding: 16,
              background: 'rgba(24, 24, 27, 0.3)',
              borderRadius: 8,
            }}>
              <p style={{ fontSize: 18, color: '#e4e4e7', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }} dir="rtl">
                {script}
              </p>
            </div>
          )}
        </div>

        {/* Edit Actions */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}
            >
              <button
                onClick={handleSaveEdit}
                style={{
                  flex: 1,
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  color: 'white',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check style={{ width: 16, height: 16 }} />
                שמור שינויים
              </button>
              <button
                onClick={() => {
                  setEditedScript(script)
                  setIsEditing(false)
                }}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: '#27272a',
                  color: '#a1a1aa',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word Count */}
        <div style={{ marginTop: 16, fontSize: 14, color: '#71717a', textAlign: 'center' }}>
          {script.split(/\s+/).length} מילים • ~{Math.ceil(script.length / 15)} שניות
        </div>
      </div>

      {/* Right Side - Feedback & Actions */}
      <div style={{ ...glassCardStyle, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'white', margin: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>💬</span>
          משוב והערות
        </h2>

        {/* Feedback Mode Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setFeedbackMode('text')}
            style={{
              padding: 16,
              borderRadius: 8,
              border: feedbackMode === 'text' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: feedbackMode === 'text' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(24, 24, 27, 0.5)',
              color: feedbackMode === 'text' ? 'white' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MessageSquare style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: 14 }}>הערה בטקסט</span>
          </button>
          <button
            onClick={() => setFeedbackMode('voice')}
            style={{
              padding: 16,
              borderRadius: 8,
              border: feedbackMode === 'voice' ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              background: feedbackMode === 'voice' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(24, 24, 27, 0.5)',
              color: feedbackMode === 'voice' ? 'white' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Volume2 style={{ width: 24, height: 24 }} />
            <span style={{ fontSize: 14 }}>הקלטה קולית</span>
          </button>
        </div>

        {/* Feedback Input */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {feedbackMode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <textarea
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                  placeholder="כתוב את ההערות שלך כאן..."
                  dir="rtl"
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: 16,
                    background: 'rgba(24, 24, 27, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: 'white',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSendFeedback}
                  disabled={!textFeedback.trim()}
                  style={{
                    marginTop: 12,
                    padding: '12px 24px',
                    borderRadius: 8,
                    fontWeight: 600,
                    color: 'white',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                    border: 'none',
                    cursor: textFeedback.trim() ? 'pointer' : 'not-allowed',
                    opacity: textFeedback.trim() ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Send style={{ width: 16, height: 16 }} />
                  שלח משוב
                </button>
              </motion.div>
            )}

            {feedbackMode === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              >
                {/* Waveform Animation */}
                {isRecording && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 32, marginBottom: 16 }}>
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 4,
                          background: '#6366f1',
                          borderRadius: 2,
                          animation: `wave 0.5s ease-in-out infinite ${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Recording Time */}
                <div style={{ fontSize: 32, fontFamily: 'monospace', color: 'white', marginBottom: 24 }}>
                  {formatTime(recordingTime)}
                </div>

                {/* Record Button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isRecording ? '#f43f5e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: isRecording ? '0 0 30px rgba(244, 63, 94, 0.5)' : '0 0 30px rgba(99, 102, 241, 0.5)',
                    transform: isRecording ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isRecording ? (
                    <MicOff style={{ width: 40, height: 40, color: 'white' }} />
                  ) : (
                    <Mic style={{ width: 40, height: 40, color: 'white' }} />
                  )}
                </button>

                <p style={{ fontSize: 14, color: '#71717a', marginTop: 16 }}>
                  {isRecording ? 'שחרר לסיום ההקלטה' : 'לחץ והחזק להקלטה'}
                </p>
              </motion.div>
            )}

            {!feedbackMode && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <p style={{ color: '#71717a', textAlign: 'center' }}>
                  בחר אופן משוב למעלה
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginTop: 24,
          paddingTop: 24,
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
          <button
            onClick={onApprove}
            disabled={isProcessing}
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isProcessing ? (
              <RefreshCw style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Check style={{ width: 20, height: 20 }} />
            )}
            אישור
          </button>
          <button
            onClick={onReject}
            disabled={isProcessing}
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#f87171',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <X style={{ width: 20, height: 20 }} />
            דחייה
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 24px; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
