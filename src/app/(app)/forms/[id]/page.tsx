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
import { Edit, List, ExternalLink, Trash2, MoreVertical } from 'lucide-react'; // Removed Link2, Copy, Add Trash2
import { toast } from 'sonner'; // Import toast
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
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

// File Purpose: This page shows the details of a specific form template, including its fields and options to edit or delete it.
// Last updated: 2025-05-21

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

  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

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
    window.open(`${captureLink}?entryMode=voice`, '_blank', 'noopener,noreferrer');
  };

  // Render Form Details
  return (
    <div className="space-y-6">
      {/* --- Add Breadcrumbs at the top --- */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* --- Add shared header and action bar (mirroring edit page style) --- */}
      <Card className="max-w-2xl mt-0">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {template.name}
            </CardTitle>
            <CardDescription>{template.description}</CardDescription>
          </div>
          <div className="flex gap-2 items-center relative">
            <Button variant="outline" onClick={() => window.open(`${captureLink}?entryMode=voice`, '_blank')} size="sm" className="cursor-pointer">
              <ExternalLink className="w-4 h-4 mr-1" /> View Form
            </Button>
            {/* Custom Meatball Dropdown */}
            <div ref={dropdownRef} className="relative">
              <Button variant="ghost" size="icon" aria-label="More actions" onClick={() => setDropdownOpen((v) => !v)} className="cursor-pointer">
                <MoreVertical className="w-5 h-5" />
              </Button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-lg z-50">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setDropdownOpen(false); router.push(`/forms/${id}/edit`); }}
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onClick={() => { setDropdownOpen(false); router.push(`/forms/${id}/submissions`); }}
                  >
                    <List className="w-4 h-4 mr-2" /> Submissions
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                    onClick={() => { setDropdownOpen(false); handleDeleteTemplate(); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          {/* --- Form Preview Section --- */}
          <div className="mt-4">
            <h3 className="font-semibold mb-2 text-lg">Form Preview</h3>
            <div className="space-y-4 text-left">
              {fields.length === 0 && <div className="text-gray-500">No fields defined for this form.</div>}
              {fields.map((field) => (
                <div key={field.id} className="border rounded p-3 bg-gray-50">
                  <div className="font-medium text-gray-800 mb-1 flex items-center gap-2">
                    {field.label}
                    {/* Safely show required asterisk if present */}
                    {('required' in field && (field as any).required) && <span className="text-red-500">*</span>}
                    <span className="text-xs text-gray-500">({field.field_type})</span>
                  </div>
                  {/* Render a disabled input/preview based on field type */}
                  {(() => {
                    // Use 'as any' to access options/rating_max if present
                    const options = 'options' in field ? (field as any).options || [] : [];
                    const ratingMax = 'rating_max' in field ? (field as any).rating_max ?? 5 : 5;
                    switch (field.field_type) {
                      case 'text':
                      case 'number':
                      case 'date':
                        return <Input disabled placeholder={field.label} type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'} />;
                      case 'textarea':
                        return <Textarea disabled placeholder={field.label} />;
                      case 'checkbox':
                        return <div className="flex items-center gap-2"><input type="checkbox" disabled /> <span>{field.label}</span></div>;
                      case 'select':
                      case 'radio':
                        return <div className="flex gap-2 flex-wrap">{options.map((opt: string, idx: number) => <Button key={idx} variant="outline" size="sm" disabled>{opt}</Button>)}</div>;
                      case 'multicheckbox':
                        return <div className="flex gap-2 flex-wrap">{options.map((opt: string, idx: number) => <div key={idx} className="flex items-center gap-1"><input type="checkbox" disabled /> <span>{opt}</span></div>)}</div>;
                      case 'rating':
                        return <div className="flex gap-1">{Array.from({ length: ratingMax as number }, (_, i) => <Star key={i} className="w-4 h-4 text-gray-300" />)}</div>;
                      default:
                        return <div className="text-gray-400">Unsupported field type</div>;
                    }
                  })()}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 