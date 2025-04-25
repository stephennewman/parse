import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs'; // Required for creating ReadStream 
import os from 'os';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        if (mimeType.startsWith('audio/mp4')) return 'mp4';
        if (mimeType.startsWith('audio/ogg')) return 'ogg';
        if (mimeType.startsWith('audio/webm')) return 'webm';
        // Add more specific types if needed
        console.warn(`Unknown mimeType received: ${mimeType}, using .bin extension`);
        return 'bin'; // Default binary extension
    }

    // Save blob to a temporary file
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const fileExtension = getExtensionFromMimeType(mimeType);
    const filename = `audio-${Date.now()}.${fileExtension}`;
    tempFilePath = path.join(os.tmpdir(), filename);
    await fs.promises.writeFile(tempFilePath, buffer);
    console.log(`Saved temporary audio to: ${tempFilePath}`);

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