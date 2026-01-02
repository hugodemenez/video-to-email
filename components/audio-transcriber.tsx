"use client"

import { useState, useEffect, useMemo } from 'react'
import { Mic, Cloud, Cpu } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Label } from './ui/label'
import { AudioSegment } from './audio-splitter'
import { 
  CloudTranscriptionService, 
  OnDeviceTranscriptionService,
  type TranscriptionMode 
} from '@/lib/services'

interface AudioTranscriberProps {
  segments?: AudioSegment[]
  onTranscriptionChange?: (transcription: string) => void
}

const STORAGE_KEY_TRANSCRIPTION = 'video-to-email-transcription'
const STORAGE_KEY_TRANSCRIPTION_MODE = 'video-to-email-transcription-mode'

// Load transcription from localStorage
function loadTranscriptionFromStorage(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRANSCRIPTION)
    return stored || ''
  } catch (error) {
    console.error('Error loading transcription from localStorage:', error)
    return ''
  }
}

// Save transcription to localStorage
function saveTranscriptionToStorage(text: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSCRIPTION, text)
  } catch (error) {
    console.error('Error saving transcription to localStorage:', error)
  }
}

// Load transcription mode from localStorage
function loadTranscriptionModeFromStorage(): TranscriptionMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TRANSCRIPTION_MODE)
    if (stored === 'cloud' || stored === 'on-device') {
      return stored as TranscriptionMode
    }
    return 'on-device'
  } catch (error) {
    console.error('Error loading transcription mode from localStorage:', error)
    return 'on-device'
  }
}

// Save transcription mode to localStorage
function saveTranscriptionModeToStorage(mode: TranscriptionMode): void {
  try {
    localStorage.setItem(STORAGE_KEY_TRANSCRIPTION_MODE, mode)
  } catch (error) {
    console.error('Error saving transcription mode to localStorage:', error)
  }
}

export function AudioTranscriber({ segments: externalSegments, onTranscriptionChange }: AudioTranscriberProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [transcriptionText, setTranscriptionText] = useState('')
  const [transcriptionMode, setTranscriptionMode] = useState<TranscriptionMode>(() => 
    loadTranscriptionModeFromStorage()
  )

  // Initialize transcription services
  const transcriptionService = useMemo(() => {
    return transcriptionMode === 'cloud'
      ? new CloudTranscriptionService(5) // Process 5 segments concurrently
      : new OnDeviceTranscriptionService()
  }, [transcriptionMode])

  // Load saved transcription from localStorage on mount
  useEffect(() => {
    const savedTranscription = loadTranscriptionFromStorage()
    if (savedTranscription) {
      setTranscriptionText(savedTranscription)
    }
  }, [])

  // Save transcription to localStorage whenever it changes
  useEffect(() => {
    saveTranscriptionToStorage(transcriptionText)
    onTranscriptionChange?.(transcriptionText)
  }, [transcriptionText, onTranscriptionChange])

  // Save transcription mode to localStorage whenever it changes
  useEffect(() => {
    saveTranscriptionModeToStorage(transcriptionMode)
  }, [transcriptionMode])

  // Load existing transcriptions from segments when they change
  // This happens when new transcription results come in
  useEffect(() => {
    if (externalSegments && externalSegments.length > 0) {
      const existingTranscriptions = externalSegments
        .filter(s => s.transcription)
        .sort((a, b) => a.index - b.index)
        .map(s => s.transcription)
        .join('\n\n')
      
      // Update if segments have transcriptions (this will trigger save via the other effect)
      if (existingTranscriptions) {
        setTranscriptionText(existingTranscriptions)
      }
    }
  }, [externalSegments])

  // Transcribe all segments using the selected service
  const transcribeSegments = async () => {
    if (!externalSegments || externalSegments.length === 0) {
      alert('No audio segments available. Please upload a video first.')
      return
    }

    setIsTranscribing(true)
    setTranscriptionProgress(0)
    setTranscriptionText('')

    try {
      console.log(`Starting transcription using ${transcriptionMode} mode...`)
      
      const results = await transcriptionService.transcribeSegments(
        externalSegments,
        (progress) => {
          const progressPercent = (progress.completed / progress.total) * 100
          setTranscriptionProgress(progressPercent)
        }
      )

      // Combine all transcriptions (already sorted by segment index)
      const finalText = results
        .map(r => r.transcription)
        .join('\n\n')

      setTranscriptionText(finalText)
      console.log('Transcription completed successfully')
      
    } catch (error) {
      console.error('Error transcribing segments:', error)
      alert(`Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(0)
    }
  }

  const hasSegments = externalSegments && externalSegments.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="transcription-mode" className="text-sm">
            Mode:
          </Label>
          <Select
            value={transcriptionMode}
            onValueChange={(value) => setTranscriptionMode(value as TranscriptionMode)}
            disabled={isTranscribing || !hasSegments}
          >
            <SelectTrigger id="transcription-mode" className="w-[180px]">
              <SelectValue>
                {transcriptionMode === 'cloud' ? (
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4" />
                    <span>Cloud (OpenAI)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    <span>On-Device (Whisper)</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cloud">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  <span>Cloud (OpenAI)</span>
                </div>
              </SelectItem>
              <SelectItem value="on-device">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>On-Device (Whisper)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={transcribeSegments}
          disabled={isTranscribing || !hasSegments}
          variant="outline"
        >
          {isTranscribing ? (
            <span>Transcribing... {Math.round(transcriptionProgress)}%</span>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              <span>Transcribe Audio</span>
            </>
          )}
        </Button>
      </div>

      {!hasSegments && (
        <p className="text-xs text-muted-foreground">
          Upload a video above to extract audio segments for transcription.
        </p>
      )}

      {transcriptionMode === 'on-device' && !isTranscribing && hasSegments && (
        <p className="text-xs text-muted-foreground">
          Note: On-device transcription requires downloading the model (~75MB) on first use. 
          It runs entirely in your browser with no API costs.
        </p>
      )}
      
      <Textarea
        value={transcriptionText}
        onChange={(e) => setTranscriptionText(e.target.value)}
        placeholder="Transcription will appear here..."
        className="h-[300px] font-mono text-sm"
        readOnly={isTranscribing}
      />
    </div>
  )
}
