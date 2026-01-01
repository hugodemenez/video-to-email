'use client'

import { AudioSegment } from '@/components/audio-splitter'
import type { ITranscriptionService, TranscriptionProgress, TranscriptionResult } from './transcription-service'

/**
 * Cloud transcription service using OpenAI Whisper API
 * Processes segments in parallel for better performance
 */
export class CloudTranscriptionService implements ITranscriptionService {
  private readonly maxConcurrentRequests: number

  constructor(maxConcurrentRequests: number = 5) {
    this.maxConcurrentRequests = maxConcurrentRequests
  }

  async transcribeSegments(
    segments: AudioSegment[],
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult[]> {
    const results: TranscriptionResult[] = []
    const errors: Array<{ index: number; error: Error }> = []

    // Process segments in batches to avoid overwhelming the API
    for (let i = 0; i < segments.length; i += this.maxConcurrentRequests) {
      const batch = segments.slice(i, i + this.maxConcurrentRequests)
      
      // Process batch in parallel
      const batchPromises = batch.map(async (segment, batchIndex) => {
        const globalIndex = i + batchIndex
        
        try {
          const transcription = await this.transcribeSegment(segment)
          return {
            transcription,
            segmentIndex: segment.index,
            globalIndex
          }
        } catch (error) {
          errors.push({
            index: segment.index,
            error: error instanceof Error ? error : new Error('Unknown error')
          })
          return {
            transcription: `[Error transcribing segment ${segment.index}]`,
            segmentIndex: segment.index,
            globalIndex
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      
      // Sort results by segment index and add to results array
      batchResults.forEach(result => {
        results.push({
          transcription: result.transcription,
          segmentIndex: result.segmentIndex
        })
      })

      // Update progress after each batch completes
      if (onProgress) {
        const completed = Math.min(i + batch.length, segments.length)
        onProgress({
          completed,
          total: segments.length,
          currentSegment: batch[batch.length - 1]?.index
        })
      }
    }

    // Sort final results by segment index
    results.sort((a, b) => a.segmentIndex - b.segmentIndex)

    if (errors.length > 0) {
      console.warn(`Transcription completed with ${errors.length} errors:`, errors)
    }

    return results
  }

  private async transcribeSegment(segment: AudioSegment): Promise<string> {
    // Convert ArrayBuffer to Blob for API call
    const audioBlob = new Blob([segment.buffer], { type: 'audio/wav' })
    
    // Create FormData for the API call
    const formData = new FormData()
    formData.append('audio', audioBlob, `segment_${segment.index}.wav`)

    // Call the transcription API
    const response = await fetch('/api/ai/transcribe', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        `API error: ${response.status} - ${errorData.error || response.statusText}`
      )
    }

    const data = await response.json()
    return data.transcription || ''
  }
}

