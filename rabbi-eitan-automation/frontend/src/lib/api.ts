const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      return { error: error || `HTTP ${response.status}` }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return { error: String(error) }
  }
}

// Pipeline API
export const pipelineApi = {
  getStatus: () => fetchApi<PipelineStatus>('/api/v1/pipeline/status'),
  trigger: () => fetchApi('/api/v1/content/scrape', { method: 'POST' }),
}

// Content API
export const contentApi = {
  scrape: () => fetchApi('/api/v1/content/scrape', { method: 'POST' }),
  getLatest: () => fetchApi('/api/v1/content/latest'),
  generateScript: (contentId: string, customPrompt?: string) =>
    fetchApi('/api/v1/content/script/generate', {
      method: 'POST',
      body: JSON.stringify({ content_id: contentId, custom_prompt: customPrompt }),
    }),
}

// Approval API
export const approvalApi = {
  approve: (scriptId: string) =>
    fetchApi(`/api/v1/approval/script/${scriptId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ script_id: scriptId, approved: true }),
    }),
  reject: (scriptId: string) =>
    fetchApi(`/api/v1/approval/script/${scriptId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ script_id: scriptId, approved: false }),
    }),
  getPending: () => fetchApi('/api/v1/approval/pending'),
}

// Media API
export const mediaApi = {
  generate: (scriptId: string) =>
    fetchApi('/api/v1/media/generate', {
      method: 'POST',
      body: JSON.stringify({ script_id: scriptId }),
    }),
  getStatus: (mediaId: string) =>
    fetchApi(`/api/v1/media/${mediaId}/status`),
}

// Distribution API
export const distributionApi = {
  distribute: (mediaId: string, platforms: string[]) =>
    fetchApi('/api/v1/distribution/distribute', {
      method: 'POST',
      body: JSON.stringify({ media_id: mediaId, platforms }),
    }),
  getStatus: (mediaId: string) =>
    fetchApi(`/api/v1/distribution/${mediaId}/status`),
}

// Credits API
export const creditsApi = {
  getStatus: () => fetchApi<CreditsStatus>('/api/v1/credits'),
}

// Types
export interface PipelineStatus {
  current_step: number
  total_steps: number
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
  steps: PipelineStep[]
}

export interface PipelineStep {
  step: number
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
}

export interface CreditsStatus {
  elevenlabs: {
    used: number
    remaining: number
    unit: string
  }
  heygen: {
    used: number
    remaining: number
    unit: string
  }
  gemini: {
    status: string
    requests_today: number
  }
}
