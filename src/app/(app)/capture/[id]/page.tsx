"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Import UI components as needed
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react'; // Example icon

// TODO: Define types for template/fields if not shared
interface FormTemplate {
  id: string;
  name: string;
}
interface FormField {
  id: string;
  label: string;
  internal_key: string; // Need the key for mapping results
  field_type: string;
  display_order: number;
}

export default function CapturePage() {
  const params = useParams();
  const id = params.id as string;

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  // TODO: Add state for audio data, transcription, parsed results
  const supabase = createClientComponentClient();

  useEffect(() => {
    // TODO: Fetch template and field data based on 'id'
    // Similar to FormDetailPage, fetch template name and fields
    // Need 'internal_key' for fields to map results later
    const fetchFormStructure = async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            // Fetch template basics (name)
            const { data: tData, error: tError } = await supabase
                .from('form_templates')
                .select('id, name')
                .eq('id', id)
                .single();
            if (tError) throw tError;
            if (!tData) throw new Error("Form template not found");
            setTemplate(tData);

            // Fetch fields (label, internal_key, type, order)
            const { data: fData, error: fError } = await supabase
                .from('form_fields')
                .select('id, label, internal_key, field_type, display_order')
                .eq('template_id', id)
                .order('display_order', { ascending: true });
            if (fError) throw fError;
            setFields(fData || []);

        } catch (err: any) {
            setError(err.message);
            console.error("Error fetching form structure:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchFormStructure();
  }, [id, supabase]);

  const handleRecordClick = () => {
    if (isRecording) {
      // TODO: Stop recording logic
      console.log("Stopping recording...");
      setIsRecording(false);
    } else {
      // TODO: Start recording logic (request mic permission, etc.)
      console.log("Starting recording...");
      setIsRecording(true);
    }
  };

  if (loading) return <div>Loading form...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!template) return <div>Form not found.</div>;


  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Capture for: {template.name}</h1>

      {/* TODO: Display form fields dynamically */}
      <div className="space-y-4 p-4 border rounded-md">
        <h2 className="text-lg font-medium">Form Fields</h2>
        {fields.length > 0 ? (
            fields.map(field => (
                <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                    {/* TODO: Display input based on field.field_type */}
                    {/* TODO: Bind value to state holding parsed results */}
                    <input
                        type="text"
                        readOnly // For now, just display
                        placeholder={`(${field.field_type})`}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100"
                    />
                </div>
            ))
        ) : (
            <p>No fields defined for this form.</p>
        )}
      </div>

      {/* Recording Controls */}
      <div className="flex justify-center items-center space-x-4 p-4 border-t">
         {/* TODO: Add timer/status display */}
        <Button
          onClick={handleRecordClick}
          size="lg"
          className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
        >
          <Mic className="mr-2 h-5 w-5" />
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </Button>
         {/* TODO: Add processing/submit button */}
      </div>

      {/* TODO: Display transcription/results */}

    </div>
  );
} 