import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Re-initialize OpenAI client (could potentially share from a utility file later)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected input structure for fields
interface InputField {
    label: string;
    internal_key: string;
    field_type: string; // e.g., 'text', 'number', 'date', 'textarea'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription, fields } = body as { transcription: string; fields: InputField[] };

    if (!transcription) {
      return NextResponse.json({ error: 'Missing transcription text.' }, { status: 400 });
    }
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'Missing or invalid form fields definition.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API Key not found in environment variables.");
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // --- Construct the Prompt --- 
    // Create a simple representation of the fields for the prompt
    const fieldDescriptions = fields.map(f => 
        `- ${f.label} (key: "${f.internal_key}", type: ${f.field_type})`
    ).join('\n');

    const systemPrompt = `You are an expert data extraction assistant. Your task is to analyze the provided text transcription and extract the information corresponding to the requested form fields. Respond ONLY with a valid JSON object containing the extracted data. The keys of the JSON object MUST match the "key" provided for each field. If you cannot find information for a specific field, use null as the value for that key. Adhere strictly to the field types where possible (e.g., numbers for number fields, dates for date fields), but prioritize extracting the relevant text if the format is ambiguous. Ensure the output is a single JSON object and nothing else.`;

    const userPrompt = `Please extract the data for the following fields from the transcription below:

**Fields:**
${fieldDescriptions}

**Transcription:**
"${transcription}"

**Output JSON:**`;
    // --- End Prompt Construction ---

    // --- Call OpenAI Chat Completion with JSON Mode --- 
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using a cost-effective and capable model
      response_format: { type: "json_object" }, // Enable JSON mode
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2, // Lower temperature for more deterministic output
    });

    const jsonResponse = completion.choices[0]?.message?.content;

    if (!jsonResponse) {
      throw new Error('OpenAI did not return a valid response content.');
    }

    // Parse the JSON string from the response
    const parsedData = JSON.parse(jsonResponse);

    return NextResponse.json({ parsedData });

  } catch (error) {
    console.error('Error processing parsing request:', error);
    let errorMessage = 'Failed to parse transcription.';
    if (error instanceof OpenAI.APIError) {
        // Handle potential OpenAI specific errors
        errorMessage = `OpenAI Error: ${error.status} ${error.name} - ${error.message}`;
    } else if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 