'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface PipelineStep {
  step: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

interface PipelineStatusProps {
  steps: PipelineStep[]
  currentStep: number
}

const stepIcons: Record<string, string> = {
  pending: '○',
  in_progress: '◉',
  completed: '✓',
  failed: '✗'
}

const stepColors: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-500',
  in_progress: 'bg-blue-500 text-white animate-pulse',
  completed: 'bg-green-500 text-white',
  failed: 'bg-red-500 text-white'
}

const lineColors: Record<string, string> = {
  pending: 'bg-gray-200',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
}

export function PipelineStatus({ steps, currentStep }: PipelineStatusProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.step}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300',
                  stepColors[step.status]
                )}
              >
                {step.status === 'in_progress' ? (
                  <span className="animate-spin">⟳</span>
                ) : (
                  stepIcons[step.status]
                )}
              </div>
              <span className="mt-2 text-sm text-gray-600 text-center max-w-[100px]">
                {step.name}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2">
                <div
                  className={cn(
                    'h-1 rounded transition-all duration-300',
                    step.status === 'completed' ? lineColors.completed : lineColors.pending
                  )}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export function PipelineProgress({ steps }: { steps: PipelineStep[] }) {
  const completedSteps = steps.filter(s => s.status === 'completed').length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2 text-sm">
        <span className="text-gray-600">התקדמות</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>שלב {completedSteps} מתוך {steps.length}</span>
        <span>{steps.find(s => s.status === 'in_progress')?.name || 'ממתין'}</span>
      </div>
    </div>
  )
}
