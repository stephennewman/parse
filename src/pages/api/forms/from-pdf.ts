import type { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore: If formidable types are not installed, this will suppress the error
import formidable, { Fields, Files } from 'formidable';
import fs from 'fs';
// @ts-ignore: No types for pdf-parse
import pdfParse from 'pdf-parse';
import OpenAI from 'openai';

export const config = {
  api: {
    bodyParser: false,
  },
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable();

  // Wrap form.parse in a Promise
  let fields: Fields, files: Files;
  try {
    ({ fields, files } = await new Promise<{ fields: Fields, files: Files }>((resolve, reject) => {
      form.parse(req, (err: any, fields: Fields, files: Files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    }));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to parse form' });
  }

  try {
    const file = files.file;
    if (!file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
    console.log('File path:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    console.log('Extracted PDF text:', pdfData.text.slice(0, 500)); // Log first 500 chars
    const extractedText = pdfData.text.slice(0, 2000); // Limit to 2000 chars

    // Split the PDF text into sections by headers (lines ending with a colon)
    const sectionRegex = /^(.+?:)\s*$/gm;
    const matches = [...extractedText.matchAll(sectionRegex)];
    let sections = [];
    if (matches.length > 0) {
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].index! + matches[i][0].length;
        const end = matches[i + 1] ? matches[i + 1].index : extractedText.length;
        const header = matches[i][1].trim();
        const body = extractedText.slice(start, end).trim();
        if (body) {
          sections.push({ header, body });
        }
      }
    } else {
      // Fallback: treat the whole text as one section
      sections = [{ header: '', body: extractedText }];
    }

    let allFields: any[] = [];
    for (const section of sections) {
      // Limit each section body to 1500 chars to avoid context overflow
      const sectionText = section.body.slice(0, 1500);
      const prompt = `Extract a checklist schema from the following section. For each checklist item, return an object with a 'label' and a 'type' ('checkbox' for yes/no or compliance checks, 'text' for fill-in-the-blank fields like 'Date'). Prepend the section header ('${section.header}') to each item's label for clarity. Only include actual checklist items, not instructions or blank lines. Return ONLY a JSON array, no extra text.\n\nSection:\n${section.header}\n${sectionText}\n\nJSON array:`;
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that extracts checklist fields from documents.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2,
          max_tokens: 4096,
          response_format: { type: 'json_object' }
        });
        const content = completion.choices[0].message?.content || '';
        console.log(`OpenAI response for section '${section.header}':`, content);
        const parsed = JSON.parse(content);
        let fieldsResult = [];
        if (Array.isArray(parsed)) {
          fieldsResult = parsed;
        } else if (parsed && Array.isArray(parsed.fields)) {
          fieldsResult = parsed.fields;
        } else if (parsed && typeof parsed === 'object' && parsed.label && parsed.type) {
          fieldsResult = [parsed];
        } else {
          throw new Error('AI response did not contain a valid array or field object.');
        }
        allFields = allFields.concat(fieldsResult);
      } catch (e) {
        console.error(`Failed to parse AI response for section '${section.header}':`, e);
        // Continue with other sections
      }
    }
    if (allFields.length === 0) {
      return res.status(500).json({ error: 'Failed to extract any checklist fields from the document.' });
    }
    return res.status(200).json({ fields: allFields });
  } catch (e: any) {
    console.error('Server error:', e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
} 