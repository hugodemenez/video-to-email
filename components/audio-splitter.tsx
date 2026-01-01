"use client"

import { useRef, useState, useEffect } from 'react'
import { Input as MediaInput, Output, Conversion, ALL_FORMATS, BlobSource, WavOutputFormat, BufferTarget } from 'mediabunny'
import { Upload } from 'lucide-react'
import { Button } from './ui/button'

export interface AudioSegment {
  buffer: ArrayBuffer
  fileName: string
  startTime: number
  endTime: number
  index: number
  transcription?: string
}

interface AudioSplitterProps {
  onSegmentsCreated?: (segments: AudioSegment[]) => void
}

const STORAGE_KEY_DURATION = 'video-to-email-duration'

// Get duration from localStorage (metadata only, no audio data)
function getStoredDurationMinutes(): number | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DURATION)
    if (!stored) return null
    return parseFloat(stored)
  } catch (error) {
    console.error('Error loading duration from localStorage:', error)
    return null
  }
}

// Save duration to localStorage (metadata only, no audio data)
function saveDurationToStorage(durationMinutes: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_DURATION, durationMinutes.toString())
  } catch (error) {
    console.error('Error saving duration to localStorage:', error)
  }
}

export function AudioSplitter({ onSegmentsCreated }: AudioSplitterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null)
  const [segments, setSegments] = useState<AudioSegment[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load duration from localStorage on mount (metadata only)
  useEffect(() => {
    const storedDuration = getStoredDurationMinutes()
    if (storedDuration !== null) {
      setDurationMinutes(storedDuration)
    }
  }, [])

  const splitAudio = async (file: File) => {
    setIsLoading(true)
    setProgress(0)
    
    try {
      console.log('Starting audio splitting for file:', file.name, file.type, file.size)
      
      // Create input from the video/audio file
      const input = new MediaInput({
        source: new BlobSource(file),
        formats: ALL_FORMATS,
      })

      // Check if the file has audio tracks
      const audioTrack = await input.getPrimaryAudioTrack()
      
      if (!audioTrack) {
        throw new Error('No audio track found in the file')
      }

      // Get the duration of the audio track
      const duration = await audioTrack.computeDuration()
      const durationMinutes = duration / 60
      console.log('Audio duration:', duration, 'seconds', `(${durationMinutes.toFixed(1)} minutes)`)

      // Calculate number of 10-second segments
      const segmentDuration = 10 // 10 seconds
      const numberOfSegments = Math.ceil(duration / segmentDuration)
      console.log('Number of segments to create:', numberOfSegments)

      const createdSegments: AudioSegment[] = []

      // Create each segment
      for (let i = 0; i < numberOfSegments; i++) {
        const startTime = i * segmentDuration
        const endTime = Math.min(startTime + segmentDuration, duration)
        
        console.log(`Creating segment ${i + 1}/${numberOfSegments}: ${startTime}s - ${endTime}s`)
        
        // Create output for WAV audio
        const output = new Output({
          format: new WavOutputFormat(),
          target: new BufferTarget(),
        })

        // Perform the conversion with trim option
        const conversion = await Conversion.init({ 
          input, 
          output,
          trim: {
            start: startTime,
            end: endTime,
          }
        })
        
        await conversion.execute()

        // Get the resulting audio buffer
        const buffer = output.target.buffer
        
        if (!buffer) {
          throw new Error(`Failed to generate segment ${i + 1} - no buffer created`)
        }
        
        // Create segment object
        const segment: AudioSegment = {
          buffer,
          fileName: `${file.name.replace(/\.[^/.]+$/, '')}_segment_${String(i + 1).padStart(3, '0')}.wav`,
          startTime,
          endTime,
          index: i + 1
        }
        
        createdSegments.push(segment)
        
        // Update progress
        const progressPercent = ((i + 1) / numberOfSegments) * 100
        setProgress(progressPercent)
        
        console.log(`Segment ${i + 1} created successfully`)
      }

      // Update state (segments stay in memory, not localStorage)
      setSegments(createdSegments)
      
      // Set the duration for display and save only metadata
      setDurationMinutes(durationMinutes)
      saveDurationToStorage(durationMinutes)
      
      if (onSegmentsCreated) {
        onSegmentsCreated(createdSegments)
      }

      console.log('Audio splitting completed successfully')

    } catch (error) {
      console.error('Error splitting audio:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to split audio: ${errorMessage}`)
      setDurationMinutes(null)
    } finally {
      setIsLoading(false)
      setProgress(0)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith('video/') || file.type.startsWith('audio/'))) {
      splitAudio(file)
    } else {
      alert('Please select a valid video or audio file')
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="relative inline-flex items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*"
        onChange={handleFileChange}
        disabled={isLoading}
        className="hidden"
      />
      <div className="relative inline-flex items-center justify-center">
        <Button
          onClick={handleButtonClick}
          disabled={isLoading}
          className="relative z-10 cursor-pointer"
        >
          {isLoading ? (
            <span>Processing... {Math.round(progress)}%</span>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Upload a video</span>
            </>
          )}
        </Button>
        {isLoading && (
          <>
            {/* Top border - fills left to right (0-25%) */}
            <div
              className="absolute top-0 left-0 h-0.5 bg-current pointer-events-none transition-all duration-300"
              style={{
                width: progress <= 25 ? (progress / 25) * 100 + '%' : '100%',
                opacity: 0.6,
              }}
            />
            {/* Right border - fills top to bottom (25-50%) */}
            <div
              className="absolute top-0 right-0 w-0.5 bg-current pointer-events-none transition-all duration-300"
              style={{
                height: progress <= 25 ? '0%' : progress <= 50 ? ((progress - 25) / 25) * 100 + '%' : '100%',
                opacity: 0.6,
              }}
            />
            {/* Bottom border - fills right to left (50-75%) */}
            <div
              className="absolute bottom-0 right-0 h-0.5 bg-current pointer-events-none transition-all duration-300"
              style={{
                width: progress <= 50 ? '0%' : progress <= 75 ? ((progress - 50) / 25) * 100 + '%' : '100%',
                opacity: 0.6,
              }}
            />
            {/* Left border - fills bottom to top (75-100%) */}
            <div
              className="absolute bottom-0 left-0 w-0.5 bg-current pointer-events-none transition-all duration-300"
              style={{
                height: progress <= 75 ? '0%' : ((progress - 75) / 25) * 100 + '%',
                opacity: 0.6,
              }}
            />
          </>
        )}
      </div>
      {!isLoading && durationMinutes !== null && (
        <span className="text-sm text-muted-foreground">
          {durationMinutes % 1 === 0 
            ? `${Math.round(durationMinutes)} min${Math.round(durationMinutes) === 1 ? '' : 's'} of audio extracted`
            : `${durationMinutes.toFixed(1)} mins of audio extracted`
          }
        </span>
      )}
    </div>
  )
}
