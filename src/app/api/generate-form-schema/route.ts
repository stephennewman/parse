import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// InputField interface for reference
// interface InputField {
//   label: string;
//   internal_key: string;
//   field_type: string;
//   options?: string[] | null;
//   rating_min?: number | null;
//   rating_max?: number | null;
//   required?: boolean;
// }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcription } = body as { transcription: string };

    if (!transcription) {
      return NextResponse.json({ error: 'Missing transcription text.' }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API Key not found in environment variables.");
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    // --- Reverted System Prompt ---
    const systemPrompt = `You are an expert form builder assistant. Your job is to analyze a user's natural language description and generate a JSON array representing the form schema. Each field should be an object with these keys:
- label (string, human-readable question or prompt)
- internal_key (string, unique snake_case key for the field)
- field_type (string, one of: text, textarea, number, checkbox, select, radio, multicheckbox, rating, date)
- options (array of strings, only for select, radio, multicheckbox)
- rating_min (number, only for rating fields)
- rating_max (number, only for rating fields)
- required (boolean, if the field is required)

Do not include any extra commentary. Only output a JSON array of field objects. If the user asks for a checklist, use 'checkbox' fields. If the user asks for yes/no, use 'checkbox' fields. If the user asks for a dropdown, use 'select'.
`;

    const userPrompt = `Generate a form schema for the following description:
"${transcription}"

Output only the JSON array of fields.`;

    // --- Call OpenAI Chat Completion with JSON Mode ---
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    });

    // The model will return a JSON object, but we want the array inside it
    const jsonResponse = completion.choices[0]?.message?.content;
    if (!jsonResponse) {
      throw new Error('OpenAI did not return a valid response content.');
    }
    // The model will output something like: { "fields": [ ... ] }
    const parsed = JSON.parse(jsonResponse);
    // Accept either { fields: [...] } or just [...]
    const schema = Array.isArray(parsed) ? parsed : parsed.fields;

    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Error generating form schema:', error);
    let errorMessage = 'Failed to generate form schema.';
    if (error instanceof OpenAI.APIError) {
      errorMessage = `OpenAI Error: ${error.status} ${error.name} - ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 