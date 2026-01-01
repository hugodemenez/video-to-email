import { NextRequest } from 'next/server'
import { streamObject } from 'ai'
import { z } from 'zod'

// Define the schema for the email template structure
const emailTemplateSchema = z.object({
  videoTitle: z.string().describe('The title of the video'),
  videoThumbnail: z.string().optional().describe('URL to the video thumbnail image'),
  videoUrl: z.string().optional().describe('URL to the video'),
  previewText: z.string().optional().describe('Preview text for the email'),
  keyPoints: z.array(z.string()).describe('Array of key points from the transcription'),
  description: z.string().describe('A well-formatted description of the video content'),
  companyName: z.string().optional().describe('Company or sender name'),
})

export async function POST(request: NextRequest) {
  // API is currently restricted
  return new Response(
    JSON.stringify({ error: 'API access is currently restricted' }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  )

  try {
    const { transcription } = await request.json()

    if (!transcription || typeof transcription !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Transcription text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // For now, we'll use mock data instead of calling an actual LLM
    // This will be replaced with actual AI SDK call later
    const mockEmailData = {
      videoTitle: 'Product Update: New Features Released',
      videoThumbnail: '/painting.jpg',
      videoUrl: 'https://youtube.com/watch?v=example',
      previewText: 'Check out our latest product update!',
      keyPoints: [
        'New feature announcement',
        'Improved user experience',
        'Performance enhancements',
        'Bug fixes and stability improvements',
      ],
      description: transcription.length > 200 
        ? `${transcription.substring(0, 200)}...` 
        : transcription,
      companyName: 'Your Company',
    }

    // Create a mock stream that yields the object
    // In production, this will be replaced with actual streamObject call
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Simulate streaming by sending chunks
        const chunks = [
          JSON.stringify({ type: 'object', object: mockEmailData }),
        ]
        
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk + '\n'))
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })

    // TODO: Replace mock implementation with actual streamObject call:
    // const result = await streamObject({
    //   model: openai('gpt-4o'),
    //   schema: emailTemplateSchema,
    //   prompt: `Convert the following video transcription into a professional email template.
    //     
    //     Transcription:
    //     ${transcription}
    //     
    //     Extract key points, create a compelling title, and format it as a professional email.`,
    // })
    // 
    // return result.toDataStreamResponse()

  } catch (err: unknown) {
    console.error('Email generation error:', err)
    return new Response(null, { status: 500 })
  }
}

