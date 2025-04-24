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
import { Edit, List, Link2, Copy, ExternalLink } from 'lucide-react'; // Re-add Edit, List, Link2, Copy icons, Added ExternalLink
import { Input } from '@/components/ui/input'; // Added Input
import { Label } from '@/components/ui/label'; // Added Label
import { toast } from 'sonner'; // Added toast
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

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter(); // Initialize router
  const id = params.id as string; // Extract the id (ensure it's a string)

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // State for the capture link
  const [captureLink, setCaptureLink] = useState("");

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

        // Construct capture link once component mounts and has window access
        if (typeof window !== 'undefined') {
          const link = `${window.location.origin}/capture/${id}`;
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

  // --- Copy Link Handler ---
  const handleCopyLink = () => {
    if (!captureLink) return;
    navigator.clipboard.writeText(captureLink)
      .then(() => {
        toast.success("Capture link copied to clipboard!");
      })
      .catch(err => {
        console.error("Failed to copy link: ", err);
        toast.error("Failed to copy link.");
      });
  };

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
        {/* Action Buttons Group - Now includes link sharing */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Existing Buttons */}
          <Button variant="outline" size="sm" onClick={() => router.push(`/forms/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/forms/${id}/submissions`)}>
            <List className="mr-2 h-4 w-4" /> View Submissions
          </Button>
          
          {/* Separator (Optional, for visual distinction) */}
          <div className="h-6 w-px bg-border" aria-hidden="true"></div>

          {/* View Capture Form Button */} 
          <Button variant="outline" size="sm" onClick={handleOpenLink} disabled={!captureLink}>
            {/* Optional: Add an icon like ExternalLink if desired */}
            <ExternalLink className="mr-2 h-4 w-4" />
            View Form
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
        <div className="space-y-4">
          {fields.map((field) => (
            <Card key={field.id} className="bg-gray-50">
              <CardContent className="p-4">
                <p><strong>Label:</strong> {field.label}</p>
                <p><strong>Type:</strong> {field.field_type}</p>
                <p><strong>Order:</strong> {field.display_order}</p>
                {/* Display other field properties like internal_key or options if needed */}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>This form template has no fields defined.</p>
      )}

      {/* TODO: Add functionality to use this form (e.g., "Start Voice Input" button) */}
    </div>
  );
} 