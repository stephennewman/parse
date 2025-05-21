import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// File Purpose: This API route takes transcribed text and uses AI to extract and organize the information into structured form data.
// Last updated: 2025-05-21

// Re-initialize OpenAI client (could potentially share from a utility file later)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the expected input structure for fields
interface InputField {
    label: string;
    internal_key: string;
    field_type: string; // Now includes 'checkbox'
    options?: string[] | null; 
    // <<< Add optional rating range >>>
    rating_min?: number | null;
    rating_max?: number | null;
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
    const fieldDescriptions = fields.map(f => {
      let instruction = `- ${f.label} (key: "${f.internal_key}", type: ${f.field_type})`;
      // Add specific instructions based on field type
      switch (f.field_type) {
          case 'checkbox':
            instruction += ". Respond with only boolean true or false based on the transcription.";
            break;
          case 'select':
          case 'radio': // Treat radio the same as select (choose one)
            if (f.options && f.options.length > 0) {
              const optionsList = JSON.stringify(f.options);
              instruction += `. Choose exactly ONE value from this list: ${optionsList}. Respond with only the chosen option string.`;
            } else {
              instruction += ". (Configuration error: Missing options). Respond with null.";
            }
            break;
          case 'multicheckbox':
            if (f.options && f.options.length > 0) {
              const optionsList = JSON.stringify(f.options);
              instruction += `. Choose ZERO or MORE values from this list: ${optionsList}. Respond with an array of chosen option strings (e.g., ["Option A", "Option C"]) or an empty array [] if none apply.`;
            } else {
              instruction += ". (Configuration error: Missing options). Respond with an empty array [].";
            }
            break;
          case 'rating':
            if (f.rating_min != null && f.rating_max != null && f.rating_min < f.rating_max) {
              instruction += `. Provide a single integer rating between ${f.rating_min} and ${f.rating_max} (inclusive). Respond with only the number.`;
            } else {
              instruction += ". (Configuration error: Invalid rating range). Respond with null.";
            }
            break;
          // Add cases for other types if they need specific instructions (e.g., date format)
          case 'date':
             instruction += ". Respond with the date in YYYY-MM-DD format.";
             break;
          // Default instructions for text, textarea, number are usually sufficient
      }
      return instruction;
    }).join('\n');

    // Update system prompt slightly for new types
    const systemPrompt = `You are an expert data extraction assistant. Your task is to analyze the provided text transcription and extract the information corresponding to the requested form fields. Respond ONLY with a valid JSON object containing the extracted data. The keys of the JSON object MUST match the "key" provided for each field. 
- If you cannot find information for a specific field, use null as the value for that key (unless otherwise specified for the type).
- For 'checkbox' fields: Respond with boolean true or false.
- For 'select'/'radio' fields: Choose exactly ONE option from the provided list and respond with the string.
- For 'multicheckbox' fields: Choose ZERO or MORE options from the provided list and respond with an array of strings (e.g., [] or ["Option A", "Option C"]).
- For 'rating' fields: Respond with a single integer within the specified range.
- For 'date' fields: Respond with the date string in YYYY-MM-DD format.
- Adhere strictly to the field types where possible.
Ensure the output is a single JSON object and nothing else.`;

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