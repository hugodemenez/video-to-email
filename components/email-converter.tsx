"use client"

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { EmailTemplate } from './email-template'
import { EmailPreview } from './email-preview'
// TODO: When plugging in real LLM, use useObject from 'ai/react' instead of manual stream handling
// import { useObject } from 'ai/react'

interface EmailConverterProps {
  transcription: string
}

interface EmailData {
  videoTitle: string
  videoThumbnail?: string
  videoUrl?: string
  previewText?: string
  keyPoints: string[]
  description: string
  companyName?: string
}

export function EmailConverter({ transcription }: EmailConverterProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [emailData, setEmailData] = useState<EmailData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const convertToEmail = async () => {
    if (!transcription || transcription.trim().length === 0) {
      setError('Please provide a transcription first')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcription }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate email')
      }

      // Read the stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let finalData: EmailData | null = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line)
              if (parsed.type === 'object' && parsed.object) {
                finalData = parsed.object
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer)
          if (parsed.type === 'object' && parsed.object) {
            finalData = parsed.object
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      if (finalData) {
        setEmailData(finalData)
      } else {
        throw new Error('No email data received')
      }

    } catch (err) {
      console.error('Error generating email:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate email')
    } finally {
      setIsGenerating(false)
    }
  }

  const hasTranscription = transcription && transcription.trim().length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={convertToEmail}
          disabled={true}
          variant="default"
          className="bg-black text-white hover:bg-black/90"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Generating Email... (wip)</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              <span>Convert to Email (wip)</span>
            </>
          )}
        </Button>
      </div>

      {!hasTranscription && (
        <p className="text-xs text-muted-foreground">
          Please transcribe audio first before converting to email.
        </p>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {emailData && (
        <div className="mt-8 w-full">
          <h2 className="text-xl font-semibold mb-4">Email Preview</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Hover over any text to see the selection ring, then click to edit inline.
          </p>
          <EmailPreview>
            <EmailTemplate
              videoTitle={emailData.videoTitle}
              videoThumbnail={emailData.videoThumbnail}
              videoUrl={emailData.videoUrl}
              previewText={emailData.previewText}
              keyPoints={emailData.keyPoints}
              description={emailData.description}
              companyName={emailData.companyName}
            />
          </EmailPreview>
        </div>
      )}
    </div>
  )
}

