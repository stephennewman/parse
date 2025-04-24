import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs'; // Required for converting Blob to File-like object for OpenAI
import os from 'os';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore - Ignore missing types for platform-specific package
import ffmpegInstaller from '@ffmpeg-installer/linux-x64';

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

// Initialize OpenAI client
// Ensure OPENAI_API_KEY is set in your .env.local file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  // Define temporary file paths outside the try block for cleanup
  let tempInputPath: string | null = null;
  let tempOutputPath: string | null = null;

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

    // --- Save Original Blob --- 
    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const inputFilename = `input-${Date.now()}.webm`; // Keep original extension for reference
    tempInputPath = path.join(os.tmpdir(), inputFilename);
    await fs.promises.writeFile(tempInputPath, buffer);
    console.log(`Saved original audio to: ${tempInputPath}`);

    // --- Convert using ffmpeg --- 
    const outputFilename = `output-${Date.now()}.mp3`; // Convert to mp3
    tempOutputPath = path.join(os.tmpdir(), outputFilename);
    console.log(`Attempting conversion to: ${tempOutputPath}`);

    await new Promise<void>((resolve, reject) => {
        ffmpeg(tempInputPath!)
            .toFormat('mp3')
            // .audioCodec('libmp3lame') // Usually not needed, ffmpeg defaults are good
            // .audioBitrate('192k') // Optional: Set bitrate
            .on('end', () => {
                console.log('ffmpeg conversion finished.');
                resolve();
            })
            .on('error', (err: Error) => {
                console.error('ffmpeg conversion error:', err);
                reject(new Error(`Failed to convert audio: ${err.message}`));
            })
            .save(tempOutputPath!);
    });

    // --- Transcribe Converted File --- 
    console.log(`Sending converted file to OpenAI: ${tempOutputPath}`);
    const response = await openai.audio.transcriptions.create({
        model: 'whisper-1',
        file: fs.createReadStream(tempOutputPath!),
    });
    const transcription = response.text;
    console.log("Transcription successful.");

    return NextResponse.json({ transcription });

  } catch (error) {
    console.error('Error processing transcription:', error);
    let errorMessage = 'Failed to transcribe audio.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    // Consider more specific error handling based on OpenAI errors if needed
    return NextResponse.json({ error: errorMessage }, { status: 500 });

  } finally {
    // --- Clean up temporary files --- 
    try {
      if (tempInputPath) {
        await fs.promises.unlink(tempInputPath);
        console.log(`Deleted temporary input file: ${tempInputPath}`);
      }
      if (tempOutputPath) {
        await fs.promises.unlink(tempOutputPath);
        console.log(`Deleted temporary output file: ${tempOutputPath}`);
      }
    } catch (cleanupError) {
        console.error("Error cleaning up temporary files:", cleanupError);
    }
  }
} 