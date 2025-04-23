import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs'; // Required for converting Blob to File-like object for OpenAI
import os from 'os';
import path from 'path';

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your .env.local file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob | null;

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API Key not found in environment variables.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Convert Blob to a File-like object suitable for OpenAI API
    // OpenAI SDK expects a File-like object or ReadStream. We'll create a temporary file.
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`); // Assuming webm format from MediaRecorder
    await fs.promises.writeFile(tempFilePath, buffer);

    let transcription;
    try {
        // Call OpenAI Whisper API
        const response = await openai.audio.transcriptions.create({
          model: 'whisper-1', // Or choose another model if preferred
          file: fs.createReadStream(tempFilePath),
          // language: 'en', // Optional: specify language
          // response_format: 'json' // Default is json
        });
        transcription = response.text;
    } finally {
        // Clean up the temporary file
        await fs.promises.unlink(tempFilePath);
    }


    return NextResponse.json({ transcription });

  } catch (error) {
    console.error('Error processing transcription:', error);
    let errorMessage = 'Failed to transcribe audio.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Consider more specific error handling based on OpenAI errors if needed
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 