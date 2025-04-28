"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Re-add useRouter
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Import UI components as needed
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs'; // Import the new component
import { Button } from '@/components/ui/button'; // Re-add Button import
import { Edit, List, ExternalLink, Trash2 } from 'lucide-react'; // Removed Link2, Copy, Add Trash2
import { toast } from 'sonner'; // Import toast
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
// Drag and drop imports
// import { DndContext, closestCenter } from '@dnd-kit/core';
// import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { CSS } from '@dnd-kit/utilities';
// Define types if not already globally available
interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}
interface FormField {
  id: string;
  label: string;
  field_type: string;
  display_order: number;
  // Add other fields like 'options', 'internal_key' if needed
}

// --- Simple Field Card Component ---
function FieldRow({ field }: { field: FormField }) {
  return (
    <div className="flex items-center text-xs py-1 px-2 border-b last:border-b-0">
      <span className="font-medium text-gray-800 mr-2">{field.label}</span>
      <span className="text-gray-500">({field.field_type})</span>
    </div>
  );
}

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter(); // Initialize router
  const id = (params?.id ?? "") as string; // Extract the id (ensure it's a string, fallback to empty)

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // Add deleting state
  const supabase = createClientComponentClient();

  // State for the capture link
  const [captureLink, setCaptureLink] = useState("");

  // --- Add state for manual/voice mode and form responses ---
  const [entryMode, setEntryMode] = useState<'manual' | 'voice'>('manual');
  const [formResponses, setFormResponses] = useState<Record<string, string>>({});

  const handleResponseChange = (fieldId: string, value: string) => {
    setFormResponses((prev) => ({ ...prev, [fieldId]: value }));
  };

  useEffect(() => {
    if (!id) {
      setError("Form ID not found in URL.");
      setLoading(false);
      return; // Exit if no ID is present
    }

    const fetchFormData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch the template details
        const { data: templateData, error: templateError } = await supabase
          .from('form_templates')
          .select('*')
          .eq('id', id)
          .single(); // Expect only one template

        if (templateError) throw templateError;
        if (!templateData) throw new Error("Form template not found.");
        setTemplate(templateData);

        // Fetch the associated fields
        const { data: fieldsData, error: fieldsError } = await supabase
          .from('form_fields')
          .select('*')
          .eq('template_id', id) // Use the correct foreign key column name
          .order('display_order', { ascending: true }); // Order fields

        if (fieldsError) throw fieldsError;
        setFields(fieldsData || []);

        // Construct capture link using the NEW /form/ path
        if (typeof window !== 'undefined') {
          const link = `${window.location.origin}/form/${id}`;
          setCaptureLink(link);
        }

      } catch (err) { // Apply same error typing fix
        let message = "Failed to load form details.";
        if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        console.error("Error fetching form details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
    // Dependency array includes 'id' and 'supabase'
    // so the effect re-runs if the id changes or supabase client instance changes (though unlikely)
  }, [id, supabase]);

  // --- Delete Template Handler ---
  const handleDeleteTemplate = async () => {
    if (!template) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the form "${template.name}"? This will also delete all associated fields and cannot be undone.`
    );

    if (confirmed) {
      setIsDeleting(true);
      try {
        // 1. Delete associated fields first due to foreign key constraints
        const { error: fieldsError } = await supabase
          .from('form_fields')
          .delete()
          .eq('template_id', template.id);

        if (fieldsError) {
          throw new Error(`Failed to delete form fields: ${fieldsError.message}`);
        }

        // 2. Delete the form template itself
        const { error: templateError } = await supabase
          .from('form_templates')
          .delete()
          .eq('id', template.id);

        if (templateError) {
          // Note: Depending on DB setup, RLS might prevent deletion if submissions exist.
          // You might need cascading deletes or specific handling for submissions later.
          throw new Error(`Failed to delete form template: ${templateError.message}`);
        }

        toast.success(`Form "${template.name}" deleted successfully.`);
        router.push('/forms'); // Redirect to the forms list

      } catch (err) {
        console.error("Deletion error:", err);
        const message = err instanceof Error ? err.message : "An unknown error occurred during deletion.";
        toast.error(`Deletion failed: ${message}`);
        // Optionally set the component error state: setError(message);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Render Loading State
  if (loading) {
    return <div>Loading form details...</div>;
  }

  // Render Error State
  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  // Render Not Found State (if template is null after loading)
  if (!template) {
      return <div>Form template not found.</div>;
  }

  // --- Prepare breadcrumb items ---
  const breadcrumbItems = template
    ? [
        { label: "Forms", href: "/forms" },
        { label: template.name }, // Current page (form name), no href
      ]
    : [{ label: "Forms", href: "/forms" }]; // Fallback if template is not loaded yet

  // --- Open Link Handler ---
  const handleOpenLink = () => {
    if (!captureLink) return;
    window.open(captureLink, '_blank', 'noopener,noreferrer');
  };

  // Render Form Details
  return (
    <div className="space-y-6">
      {/* --- Add Breadcrumbs at the top --- */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Header section with title and action buttons */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold">{template?.name || 'Form Details'}</h1>
        {/* Action Buttons Group - Now includes link sharing and delete */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Existing Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/forms/${id}/edit`)}
            className="cursor-pointer"
            disabled={isDeleting} // Disable while deleting
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/forms/${id}/submissions`)}
            className="cursor-pointer"
            disabled={isDeleting} // Disable while deleting
          >
            <List className="mr-2 h-4 w-4" /> View Submissions
          </Button>
          
          {/* Separator (Optional, for visual distinction) */}
          <div className="h-6 w-px bg-border" aria-hidden="true"></div>

          {/* View Capture Form Button */} 
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenLink}
            disabled={!captureLink || isDeleting}
            className="cursor-pointer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Form
          </Button>
          
          {/* Delete Button */}          
          <Button
            variant="destructive" // Keep destructive variant for semantic meaning and potential base styles
            size="sm"
            onClick={handleDeleteTemplate}
            disabled={isDeleting} // Disable while deleting
            // Add classes for red outline, red text, transparent background, and hover effect
            className="cursor-pointer border border-destructive text-destructive bg-transparent hover:bg-destructive/10" 
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
          {template.description && (
            <CardDescription>{template.description}</CardDescription>
          )}
        </CardHeader>
        {/* Optionally add more details like created date in CardContent */}
      </Card>

      <h2 className="text-xl font-semibold">Fields</h2>
      {fields.length > 0 ? (
        <div className="border rounded bg-white divide-y">
          {fields.map((field) => (
            <FieldRow key={field.id} field={field} />
          ))}
        </div>
      ) : (
        <p>This form template has no fields defined.</p>
      )}

      {/* TODO: Add functionality to use this form (e.g., "Start Voice Input" button) */}
    </div>
  );
} 