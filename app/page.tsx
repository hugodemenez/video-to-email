"use client";

import { EmailPreview } from "@/components/email-preview";
import { EmailTemplate } from "@/components/email-template";
import { useState } from "react";
import { AudioSplitter, AudioSegment } from "@/components/audio-splitter";
import { AudioTranscriber } from "@/components/audio-transcriber";
import { EmailConverter } from "@/components/email-converter";

export default function Home() {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [transcription, setTranscription] = useState<string>("");

  return (
    <main className="flex min-h-screen w-full max-w-7xl flex-col py-8 px-4 sm:py-16 sm:px-8 lg:py-32 lg:px-16 sm:items-start">
      <div className="flex flex-col gap-6 w-full">
        <h1 className="text-xl sm:text-2xl lg:text-3xl">
          Send updates to your audience
          <br />
          straight from your latest video.
        </h1>
        <AudioSplitter onSegmentsCreated={setAudioSegments} />
        <AudioTranscriber 
          segments={audioSegments} 
          onTranscriptionChange={setTranscription}
        />
        <EmailConverter transcription={transcription} />
        <div className="mt-8 sm:mt-12 w-full">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Email Preview</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Hover over any text to see the selection ring, then click to edit
            inline.
          </p>
          <EmailPreview onChange={setEditedValues}>
            <EmailTemplate
              videoTitle="Check out my latest video!"
              videoThumbnail="https://via.placeholder.com/600x300/000000/ffffff?text=Video+Thumbnail"
              videoUrl="https://youtube.com/watch?v=example"
              previewText="New video is out!"
            />
          </EmailPreview>
        </div>
      </div>
    </main>
  );
}
