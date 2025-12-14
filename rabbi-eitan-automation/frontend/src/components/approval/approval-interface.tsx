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
import { cn } from '@/lib/utils'

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Left Side - Script */}
      <div className="glass-card p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📝</span>
            סקריפט לאישור
          </h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              isEditing
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-zinc-800 text-zinc-400 hover:text-white'
            )}
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Script Content */}
        <div className="flex-1 min-h-0">
          {isEditing ? (
            <textarea
              value={editedScript}
              onChange={(e) => setEditedScript(e.target.value)}
              className="w-full h-full p-4 bg-zinc-900/50 border border-white/10 rounded-lg text-white text-lg leading-relaxed resize-none focus:outline-none focus:border-indigo-500/50"
              dir="rtl"
            />
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar p-4 bg-zinc-900/30 rounded-lg">
              <p className="text-lg text-zinc-200 leading-relaxed whitespace-pre-wrap" dir="rtl">
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
              className="flex items-center gap-2 mt-4"
            >
              <button
                onClick={handleSaveEdit}
                className="flex-1 glow-button flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                שמור שינויים
              </button>
              <button
                onClick={() => {
                  setEditedScript(script)
                  setIsEditing(false)
                }}
                className="px-4 py-3 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Word Count */}
        <div className="mt-4 text-sm text-zinc-500 text-center">
          {script.split(/\s+/).length} מילים • ~{Math.ceil(script.length / 15)} שניות
        </div>
      </div>

      {/* Right Side - Feedback & Actions */}
      <div className="glass-card p-6 flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>💬</span>
          משוב והערות
        </h2>

        {/* Feedback Mode Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={() => setFeedbackMode('text')}
            className={cn(
              'p-4 rounded-lg border transition-all flex flex-col items-center gap-2',
              feedbackMode === 'text'
                ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'
            )}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-sm">הערה בטקסט</span>
          </button>
          <button
            onClick={() => setFeedbackMode('voice')}
            className={cn(
              'p-4 rounded-lg border transition-all flex flex-col items-center gap-2',
              feedbackMode === 'voice'
                ? 'border-indigo-500/50 bg-indigo-500/10 text-white'
                : 'border-white/10 bg-zinc-900/50 text-zinc-400 hover:border-white/20'
            )}
          >
            <Volume2 className="w-6 h-6" />
            <span className="text-sm">הקלטה קולית</span>
          </button>
        </div>

        {/* Feedback Input */}
        <div className="flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {feedbackMode === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-full flex flex-col"
              >
                <textarea
                  value={textFeedback}
                  onChange={(e) => setTextFeedback(e.target.value)}
                  placeholder="כתוב את ההערות שלך כאן..."
                  className="flex-1 w-full p-4 bg-zinc-900/50 border border-white/10 rounded-lg text-white resize-none focus:outline-none focus:border-indigo-500/50"
                  dir="rtl"
                />
                <button
                  onClick={handleSendFeedback}
                  disabled={!textFeedback.trim()}
                  className="mt-3 glow-button flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
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
                className="h-full flex flex-col items-center justify-center"
              >
                {/* Waveform Animation */}
                {isRecording && (
                  <div className="waveform mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="waveform-bar" />
                    ))}
                  </div>
                )}

                {/* Recording Time */}
                <div className="text-3xl font-mono text-white mb-6">
                  {formatTime(recordingTime)}
                </div>

                {/* Record Button */}
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={cn(
                    'w-24 h-24 rounded-full flex items-center justify-center transition-all',
                    isRecording
                      ? 'bg-rose-500 shadow-glow-rose scale-110'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow-md hover:scale-105'
                  )}
                >
                  {isRecording ? (
                    <MicOff className="w-10 h-10 text-white" />
                  ) : (
                    <Mic className="w-10 h-10 text-white" />
                  )}
                </button>

                <p className="text-sm text-zinc-500 mt-4">
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
                className="h-full flex items-center justify-center"
              >
                <p className="text-zinc-500 text-center">
                  בחר אופן משוב למעלה
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-white/5">
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="p-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            אישור
          </button>
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="p-4 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 font-semibold hover:bg-rose-500/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            דחייה
          </button>
        </div>
      </div>
    </div>
  )
}
