import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  // API is currently restricted
  return NextResponse.json(
    { error: 'API access is currently restricted' },
    { status: 403 }
  )

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    // Convert File to the format expected by OpenAI
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBlob = new Blob([audioBuffer], { type: audioFile.type })
    
    // Create a File object for OpenAI API
    const audioForWhisper = new File([audioBlob], audioFile.name, {
      type: audioFile.type,
    })

    // Transcribe using OpenAI Whisper
    // When response_format is 'text', the response is a string directly
    const transcription = await openai.audio.transcriptions.create({
      file: audioForWhisper,
      model: 'whisper-1',
      response_format: 'text',
    })

    // transcription is a string when response_format is 'text'
    return NextResponse.json({
      transcription: transcription as string,
      fileName: audioFile.name,
    })

  } catch (error) {
    console.error('Transcription error:', error)
    return new Response(null, { status: 500 })
  }
}

