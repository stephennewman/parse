'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Database } from 'lucide-react';

// Define an interface for the shape of your form field data
// Adjust properties based on your actual 'form_fields' table columns
interface FormField {
  id: string;
  created_at: string;
  label: string; // Assuming you have a 'label' column
  field_type: string; // Assuming you have a 'field_type' column (e.g., 'text', 'email')
  template_id: string; // Assuming a link to the template
  // Join with form_templates to get the template name
  form_templates: {
    name: string;
  } | null;
}

export default function DataPage() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ensure user is authenticated before fetching
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) {
            // This shouldn't happen if middleware is set up, but good practice
            throw new Error("User not authenticated.");
        }

        // Fetch all form fields, joining with template name
        // Adjust the select query based on your actual columns
        const { data, error: fetchError } = await supabase
          .from('form_fields')
          .select(`
            id,
            created_at,
            label,
            field_type,
            template_id,
            form_templates ( name )
          `)
          .order('created_at', { ascending: false }); // Order by newest first

        if (fetchError) throw fetchError;

        console.log("Raw form fields data from Supabase:", data);

        // Set state with fetched data
        setFields((data as unknown as FormField[]) || []);

      } catch (err: any) {
        console.error("Error fetching form fields:", err);
        const errorMessage = err.message || "Failed to load form fields. Please try again later.";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [supabase]); // Re-run effect if supabase client instance changes

  return (
    <div className="space-y-6">
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li><a href="/" className="hover:underline">Home</a></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-gray-700">Form Fields</li>
        </ol>
      </nav>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><Database className="text-blue-600" size={28} /> Form Fields</h1>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2">Loading fields...</span>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 py-10">
          <p>Error loading fields: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <Table>
          <TableCaption>A list of all available form fields across all templates.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Created At</TableHead>
              {/* Add other relevant headers */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.length > 0 ? (
              fields.map((field) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">
                    {field.label ?? 'N/A'}
                  </TableCell>
                  <TableCell>{field.field_type ?? 'N/A'}</TableCell>
                  <TableCell>{field.form_templates?.name ?? 'Unknown/Deleted Template'}</TableCell>
                  <TableCell>
                    {format(new Date(field.created_at), 'PPpp')}
                  </TableCell>
                  {/* Add other relevant cells */}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-10">
                  No form fields found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 