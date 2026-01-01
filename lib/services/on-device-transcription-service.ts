'use client'

import { AudioSegment } from '@/components/audio-splitter'
import type { ITranscriptionService, TranscriptionProgress, TranscriptionResult } from './transcription-service'

/**
 * On-device transcription service using Whisper model via @huggingface/transformers
 * Runs entirely in the browser, no API calls needed
 */
export class OnDeviceTranscriptionService implements ITranscriptionService {
  private modelPromise: Promise<any> | null = null
  private readonly modelName = 'Xenova/whisper-tiny' // Multilingual, browser-compatible (~39MB)

  private async getModel() {
    if (!this.modelPromise) {
      // Dynamically import to avoid issues if library isn't available
      const { pipeline, env } = await import('@huggingface/transformers')
      
      // Configure for browser usage
      env.allowLocalModels = false
      env.allowRemoteModels = true
      
      // @huggingface/transformers automatically uses quantized models when available
      this.modelPromise = pipeline(
        'automatic-speech-recognition',
        this.modelName
      )
    }
    return this.modelPromise
  }

  /**
   * Decode WAV file to Float32Array audio samples
   * Whisper expects mono, 16kHz sample rate
   */
  private async decodeAudio(audioBuffer: ArrayBuffer): Promise<Float32Array> {
    // Use Web Audio API to decode the audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const decodedData = await audioContext.decodeAudioData(audioBuffer.slice(0))
    
    // Get the audio channel data (mono - use first channel)
    let audioData: Float32Array = decodedData.getChannelData(0)
    
    // Resample to 16kHz if needed (Whisper expects 16kHz)
    const targetSampleRate = 16000
    if (decodedData.sampleRate !== targetSampleRate) {
      audioData = this.resampleAudio(audioData, decodedData.sampleRate, targetSampleRate)
    }
    
    // Create a new Float32Array to ensure proper type
    return new Float32Array(audioData)
  }

  /**
   * Simple linear resampling to target sample rate
   */
  private resampleAudio(audioData: Float32Array, fromRate: number, toRate: number): Float32Array {
    const ratio = fromRate / toRate
    const newLength = Math.round(audioData.length / ratio)
    const result = new Float32Array(newLength)
    
    for (let i = 0; i < newLength; i++) {
      const index = i * ratio
      const indexFloor = Math.floor(index)
      const indexCeil = Math.min(indexFloor + 1, audioData.length - 1)
      const fraction = index - indexFloor
      
      // Linear interpolation
      result[i] = audioData[indexFloor] * (1 - fraction) + audioData[indexCeil] * fraction
    }
    
    return result
  }

  async transcribeSegments(
    segments: AudioSegment[],
    onProgress?: (progress: TranscriptionProgress) => void
  ): Promise<TranscriptionResult[]> {
    // Load model (will be cached after first load)
    const transcriber = await this.getModel()
    
    const results: TranscriptionResult[] = []

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      
      try {
        // Decode WAV to Float32Array (mono, 16kHz)
        const audioData = await this.decodeAudio(segment.buffer)
        
        // Transcribe using Whisper model
        // Pass audio as object with raw data and sampling_rate
        const result = await transcriber({
          raw: audioData,
          sampling_rate: 16000
        }, {
          language: null, // Auto-detect language (null = auto-detect)
          task: 'transcribe',
          chunk_length_s: 30,
          return_timestamps: false,
        })

        // Handle different result formats
        let transcription = ''
        if (typeof result === 'string') {
          transcription = result
        } else if (result && typeof result === 'object') {
          // Result can be { text: string } or { chunks: [...] }
          transcription = result.text || (result.chunks && Array.isArray(result.chunks) 
            ? result.chunks.map((chunk: any) => chunk.text || '').join(' ')
            : '')
        }

        results.push({
          transcription: transcription.trim(),
          segmentIndex: segment.index
        })

        // Update progress
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total: segments.length,
            currentSegment: segment.index
          })
        }
      } catch (error) {
        console.error(`Failed to transcribe segment ${segment.index}:`, error)
        results.push({
          transcription: `[Error transcribing segment ${segment.index}]`,
          segmentIndex: segment.index
        })
        
        // Still update progress even on error
        if (onProgress) {
          onProgress({
            completed: i + 1,
            total: segments.length,
            currentSegment: segment.index
          })
        }
      }
    }

    // Sort results by segment index
    results.sort((a, b) => a.segmentIndex - b.segmentIndex)

    return results
  }
}

