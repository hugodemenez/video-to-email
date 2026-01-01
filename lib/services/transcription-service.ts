import { AudioSegment } from '@/components/audio-splitter'

export type TranscriptionMode = 'cloud' | 'on-device'

export interface TranscriptionProgress {
  completed: number
  total: number
  currentSegment?: number
}

export interface TranscriptionResult {
  transcription: string
  segmentIndex: number
}

export interface ITranscriptionService {
  transcribeSegments(
    segments: AudioSegment[],
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult[]>
}

