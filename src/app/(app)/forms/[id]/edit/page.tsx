"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useTransition } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useParams } from "next/navigation"; // Added useParams
import React from "react";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { toast } from "sonner";

// Interface for field state (matches NewFormPage)
interface FormFieldState {
  // Client-side temporary ID for React key prop and state management
  clientId: string; 
  // Store original DB ID if it exists (for updates/deletes)
  dbId?: string;
  fieldName: string;
  fieldType: string;
}

// Interface matching DB form_fields structure
interface FormField {
    id: string;
    template_id: string;
    label: string;
    internal_key: string;
    field_type: string;
    display_order: number;
    options?: string[] | null;
}

// Interface for the payload to insert new fields
interface NewFormFieldPayload {
    template_id: string;
    label: string;
    internal_key: string;
    field_type: string;
    display_order: number;
    options?: string[] | null;
}

// Define allowed field types
const FIELD_TYPES = ["text", "number", "date", "textarea", "checkbox", "select"];

// Helper function (can be moved to utils)
function generateInternalKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string; // Get ID from URL

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormFieldState[]>([]);
  const [loading, setLoading] = useState(true); // State for initial data fetch
  const [isUpdating, startTransition] = useTransition(); // Renamed from isPending for clarity
  const [error, setError] = useState<string | null>(null); // State for fetch/update errors

  // Need state to store options text for select fields
  // Use an object keyed by field.clientId for temporary storage
  const [selectOptionsText, setSelectOptionsText] = useState<Record<string, string>>({});

  const supabase = createClientComponentClient();

  // useEffect to fetch existing form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) {
          setError("Form ID is missing.");
          setLoading(false);
          return;
      }
      setLoading(true);
      setError(null);

      try {
          // Fetch template details (title, description)
          const { data: templateData, error: templateError } = await supabase
              .from('form_templates')
              .select('id, name, description')
              .eq('id', formId)
              .single();

          if (templateError) throw new Error(`Failed to fetch template: ${templateError.message}`);
          if (!templateData) throw new Error('Form template not found.');

          setFormTitle(templateData.name || "");
          setFormDescription(templateData.description || "");

          // Fetch associated fields
          const { data: fieldsData, error: fieldsError } = await supabase
              .from('form_fields')
              .select('id, label, field_type, display_order') // Fetch db id, label, type
              .eq('template_id', formId)
              .order('display_order', { ascending: true });

          if (fieldsError) throw new Error(`Failed to fetch fields: ${fieldsError.message}`);

          // Map fetched fields to FormFieldState
          const mappedFields = (fieldsData || []).map(field => ({
              clientId: crypto.randomUUID(), // Generate a client ID for state management
              dbId: field.id,                // Store the original DB ID
              fieldName: field.label,        // Map label to fieldName
              fieldType: field.field_type,   // Map field_type to fieldType
          }));

          setFields(mappedFields);
          // setOriginalFields(JSON.parse(JSON.stringify(mappedFields))); // Removed - no longer needed

      } catch (err) {
          console.error("Error fetching form data:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred while loading the form.");
      } finally {
          setLoading(false);
      }
    };

    fetchFormData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId]); // Dependency array only needs formId, supabase client is stable

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        clientId: crypto.randomUUID(), // Use clientId for React key
        fieldName: "",
        fieldType: FIELD_TYPES[0] || "text",
      },
    ]);
  };

  const handleFieldChange = (clientId: string, property: keyof FormFieldState, value: string) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.clientId === clientId ? { ...field, [property]: value } : field
      )
    );
    // If changing type *away* from select, clear the stored options text for that field
    if (property === 'fieldType' && value !== 'select') {
      setSelectOptionsText(prev => {
        const newState = { ...prev };
        delete newState[clientId];
        return newState;
      });
    }
  };

  // Handler for the options textarea
  const handleOptionsChange = (clientId: string, optionsValue: string) => {
    setSelectOptionsText(prev => ({ ...prev, [clientId]: optionsValue }));
  };

  const handleRemoveField = (clientId: string) => {
    setFields(prevFields => prevFields.filter(field => field.clientId !== clientId));
    // Also remove any stored options text for the removed field
    setSelectOptionsText(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
  };

  const handleUpdateTemplate = async () => {
    // Basic Validations
    if (!formTitle.trim()) {
      toast.error("Form Title cannot be empty.");
      return;
    }
    const hasEmptyFieldName = fields.some(f => !f.fieldName.trim());
    if (hasEmptyFieldName) {
      toast.error("All Field Names must be filled in.");
      return;
    }

    startTransition(async () => {
        setError(null);
        try {
            // <<< REMOVE user ID fetch start >>>
            // const { data: { user }, error: userError } = await supabase.auth.getUser();
            // if (userError || !user) {
            //     throw new Error("Could not get user session. Please log in again.");
            // }
            // const userId = user.id;
            // <<< REMOVE user ID fetch end >>>

            // --- 1. Update Template Title/Description --- 
            const { error: templateUpdateError } = await supabase
                .from('form_templates')
                .update({
                    name: formTitle.trim(),
                    description: formDescription.trim(),
                })
                .eq('id', formId);
            
            if (templateUpdateError) throw new Error(`Failed to update template details: ${templateUpdateError.message}`);

            // --- 2. Calculate Field Differences --- 
            const fieldsToAdd: NewFormFieldPayload[] = [];
            const fieldsToUpdate: (Partial<FormField> & { id: string })[] = []; 
            const fieldIdsToDelete: string[] = [];

            // Check for updates and additions
            for (const currentField of fields) {
                const label = currentField.fieldName.trim();
                const internalKey = generateInternalKey(label);
                 if (!internalKey) {
                    throw new Error(`Could not generate valid internal key for field: ${label}`);
                }

                // <<< Prepare options payload >>>
                let optionsPayload: string[] | null = null;
                if (currentField.fieldType === 'select') {
                    const optionsString = selectOptionsText[currentField.clientId] || '';
                    optionsPayload = optionsString.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
                    if (optionsPayload.length === 0) {
                       toast.warning(`Options cannot be empty for Select field: ${label}`);
                       throw new Error(`Options cannot be empty for Select field: ${label}`);
                    }
                }

                if (currentField.dbId) { // Existing field
                    fieldsToUpdate.push({
                        id: currentField.dbId,
                        template_id: formId,
                        label: label,
                        internal_key: internalKey,
                        field_type: currentField.fieldType,
                        display_order: fields.findIndex(f => f.clientId === currentField.clientId),
                        options: optionsPayload // Add options to update payload
                    });
                } else { // New field
                     fieldsToAdd.push({
                         template_id: formId,
                         label: label,
                         internal_key: internalKey,
                         field_type: currentField.fieldType,
                         display_order: fields.findIndex(f => f.clientId === currentField.clientId),
                         options: optionsPayload // Add options to insert payload
                     });
                }
            }

            // Check for deletions - Fetch original IDs and compare with current state
            // Fetch original IDs first to compare against current state's dbIds.
            const { data: originalFieldIdsData, error: fetchIdsError } = await supabase
                .from('form_fields')
                .select('id')
                .eq('template_id', formId);

            if (fetchIdsError) throw new Error(`Failed to fetch original field IDs: ${fetchIdsError.message}`);

            const originalDbIds = new Set((originalFieldIdsData || []).map(f => f.id));
            const currentDbIds = new Set(fields.map(f => f.dbId).filter(id => !!id)); // Get IDs from current state

            originalDbIds.forEach(originalId => {
                if (!currentDbIds.has(originalId)) {
                    fieldIdsToDelete.push(originalId);
                }
            });

            // --- 3. Perform Field Updates in Supabase --- 

            // Deletions first
            if (fieldIdsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('form_fields')
                    .delete()
                    .in('id', fieldIdsToDelete);
                if (deleteError) throw new Error(`Failed to delete fields: ${deleteError.message}`);
            }

            // Updates next
            if (fieldsToUpdate.length > 0) {
                // Use upsert: updates existing rows based on `id`, inserts if `id` doesn't exist (though it shouldn't happen here)
                const { error: updateError } = await supabase
                    .from('form_fields')
                    .upsert(fieldsToUpdate); 
                 if (updateError) throw new Error(`Failed to update fields: ${updateError.message}`);
            }
            
            // Additions last
            if (fieldsToAdd.length > 0) {
                 // The `fieldsToAdd` array already has the correct display_order from the initial loop
                  const { error: insertError } = await supabase
                      .from('form_fields')
                      .insert(fieldsToAdd); // Insert the new fields prepared earlier
                  if (insertError) throw new Error(`Failed to add new fields: ${insertError.message}`);
             }
            
            // --- 4. Success --- 
            toast.success("Form template updated successfully!");
            router.push(`/forms/${formId}`); // Redirect back to detail view

        } catch (err) {
            console.error("Error updating form template:", err);
            const message = err instanceof Error ? err.message : "An unknown error occurred during update.";
            setError(message);
            toast.error(`Update failed: ${message}`);
        }
    });
  };

  // --- Breadcrumbs --- 
  const breadcrumbItems = [
    { label: "Forms", href: "/forms" },
    { label: formTitle || "Loading...", href: `/forms/${formId}` },
    { label: "Edit" },
  ];

  if (loading) return <div>Loading form data...</div>;
  if (error) return <div className="text-red-500">Error loading form: {error}</div>;

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-2xl font-semibold">Edit Form: {formTitle || ''}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Edit Form Template</CardTitle>
          <CardDescription>
            Modify the title, description, and fields for this form template.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="form-title">Form Title</Label>
            <Input
              id="form-title"
              placeholder="e.g., Customer Intake"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>
          {/* Description Textarea */}
          <div className="space-y-2">
            <Label htmlFor="form-description">Description (Optional)</Label>
            <Textarea
              id="form-description"
              placeholder="e.g., Collects basic contact and inquiry details."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>

          <Separator />

          {/* Dynamic Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Fields</h3>
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-md min-h-[100px] flex items-center justify-center text-sm text-gray-500">
                  Add fields using the button below.
                </div>
              ) : (
                fields.map((field, index) => (
                  <React.Fragment key={field.clientId}>
                    <div className="flex items-end space-x-2">
                      <div className="flex-grow space-y-2">
                        <Label htmlFor={`field-name-${field.clientId}`}>Field Name #{index + 1}</Label>
                        <Input
                          id={`field-name-${field.clientId}`}
                          placeholder="e.g., Full Name"
                          value={field.fieldName}
                          onChange={(e) => handleFieldChange(field.clientId, 'fieldName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`field-type-${field.clientId}`}>Type</Label>
                        <Select
                          value={field.fieldType}
                          onValueChange={(value) => handleFieldChange(field.clientId, 'fieldType', value)}
                        >
                          <SelectTrigger id={`field-type-${field.clientId}`} className="w-[120px]">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveField(field.clientId)}
                        aria-label="Remove field"
                        className="cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* <<< Conditionally render Options Textarea >>> */} 
                    {field.fieldType === 'select' && (
                      <div className="space-y-2 pl-2 pt-2"> {/* Indent slightly */} 
                        <Label htmlFor={`field-options-${field.clientId}`}>Options (one per line)</Label>
                        <Textarea
                          id={`field-options-${field.clientId}`}
                          placeholder="Option 1\nOption 2\nOption 3"
                          value={selectOptionsText[field.clientId] || ''}
                          onChange={(e) => handleOptionsChange(field.clientId, e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={handleAddField}
              className="cursor-pointer"
            >
              Add Field
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleUpdateTemplate} 
            disabled={isUpdating || loading}
            className="cursor-pointer"
          >
            {isUpdating ? "Updating..." : "Update Template"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 