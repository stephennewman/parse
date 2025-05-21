import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs'; // Required for creating ReadStream 
import os from 'os';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// File Purpose: This API route receives audio recordings and uses AI to transcribe them into text for the voice-to-form workflow.
// Last updated: 2025-05-21

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null; // Path for temporary file

  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob | null;
    const mimeType = (formData.get('mimeType') as string | null) || 'audio/webm'; // Default if not sent

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio file uploaded.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
        console.error("OpenAI API Key not found in environment variables.");
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // Helper function to get extension
    function getExtensionFromMimeType(mimeType: string): string {
        console.log(`Determining extension for mimeType: ${mimeType}`);
        // Prioritize common types supported by OpenAI Whisper
        if (mimeType.startsWith('audio/mp4')) return 'mp4'; // Often m4a on Apple devices, but mp4 container is valid
        if (mimeType.startsWith('audio/mpeg')) return 'mp3';
        if (mimeType.startsWith('audio/mp3')) return 'mp3';
        if (mimeType.startsWith('audio/ogg')) return 'ogg';
        if (mimeType.startsWith('audio/webm')) return 'webm';
        if (mimeType.startsWith('audio/wav') || mimeType.startsWith('audio/wave') || mimeType.startsWith('audio/x-wav')) return 'wav';
        if (mimeType.startsWith('audio/flac')) return 'flac';
        if (mimeType.startsWith('audio/aac')) return 'm4a'; // AAC often in M4A container
        if (mimeType.startsWith('audio/x-m4a')) return 'm4a';

        // Less common but potentially supported
        if (mimeType.startsWith('audio/mpga')) return 'mpga'; // MPEG audio
        if (mimeType.startsWith('audio/oga')) return 'oga'; // Ogg audio

        console.warn(`Unsupported or unrecognized mimeType received: ${mimeType}. Attempting fallback extension extraction.`);
        
        // Basic fallback based on subtype after '/'
        const subtype = mimeType.split('/')[1]?.split(';')[0]; // Get part after '/' and before any parameters like ';codecs='
        if (subtype && ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'].includes(subtype)) {
             console.log(`Using fallback extension based on subtype: .${subtype}`);
             return subtype;
        }

        console.error(`Could not determine a valid extension for mimeType: ${mimeType}. Defaulting to .bin - OpenAI likely will reject this.`);
        return 'bin'; // Last resort default - likely to fail
    }

    // Save blob to a temporary file
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const fileExtension = getExtensionFromMimeType(mimeType);
    const filename = `audio-${Date.now()}.${fileExtension}`;
    tempFilePath = path.join(os.tmpdir(), filename);
    await fs.promises.writeFile(tempFilePath, buffer);
    console.log(`Saved temporary audio to: ${tempFilePath} (MIME Type: ${mimeType})`); // Log MIME type too

    // Call OpenAI Whisper API with the file stream
    console.log(`Sending temporary file to OpenAI: ${tempFilePath}`);
    const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: fs.createReadStream(tempFilePath),
    });
    const transcription = response.text;
    console.log("Transcription successful.");

    return NextResponse.json({ transcription });

  } catch (error) {
    console.error('Error processing transcription:', error);
    let errorMessage = 'Failed to transcribe audio.';

    // Handle specific OpenAI error structure if available (Revised to avoid 'no-explicit-any')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const potentialOpenAIError = error as any; // Cast once for property checks
    if (
        typeof potentialOpenAIError === 'object' &&
        potentialOpenAIError !== null &&
        typeof potentialOpenAIError.status === 'number' &&
        typeof potentialOpenAIError.error === 'object' &&
        potentialOpenAIError.error !== null &&
        typeof potentialOpenAIError.error.message === 'string'
       )
    {
        errorMessage = `OpenAI Error (${potentialOpenAIError.status}): ${potentialOpenAIError.error.message}`;
    } else if (error instanceof Error) { // Fallback to standard Error
         errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });

  } finally {
    // Clean up the temporary file
    if (tempFilePath) {
        try {
            await fs.promises.unlink(tempFilePath);
            console.log(`Deleted temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
            console.error(`Error cleaning up temporary file ${tempFilePath}:`, cleanupError);
        }
    }
  }
} 