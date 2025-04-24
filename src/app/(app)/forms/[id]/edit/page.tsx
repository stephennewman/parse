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

// Define allowed field types
const FIELD_TYPES = ["text", "number", "date", "textarea"];

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
  const [originalFields, setOriginalFields] = useState<FormFieldState[]>([]); // Store original fields for comparison
  const [loading, setLoading] = useState(true); // State for initial data fetch
  const [isUpdating, startTransition] = useTransition(); // Renamed from isPending for clarity
  const [error, setError] = useState<string | null>(null); // State for fetch/update errors

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
          // Deep copy for original state comparison during update
          // setOriginalFields(JSON.parse(JSON.stringify(mappedFields))); // Original state potentially not needed or handled differently

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
  };

  const handleRemoveField = (clientId: string) => {
    setFields(prevFields => prevFields.filter(field => field.clientId !== clientId));
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
            const originalFieldsMap = new Map(originalFields.map(f => [f.dbId, f])); // Use dbId for original map

            const fieldsToAdd: any[] = [];
            const fieldsToUpdate: any[] = [];
            const fieldIdsToDelete: string[] = [];

            // Check for updates and additions
            for (const currentField of fields) {
                const originalField = originalFields.find(of => of.clientId === currentField.clientId);
                const label = currentField.fieldName.trim();
                const internalKey = generateInternalKey(label);
                 if (!internalKey) {
                    throw new Error(`Could not generate valid internal key for field: ${label}`);
                }

                if (currentField.dbId) { // Existing field
                     const originalForCompare = originalFieldsMap.get(currentField.dbId);
                     // Check if name or type changed
                     if (originalForCompare && 
                         (originalForCompare.fieldName !== label || originalForCompare.fieldType !== currentField.fieldType))
                     {
                         fieldsToUpdate.push({
                             id: currentField.dbId,
                             label: label,
                             internal_key: internalKey,
                             field_type: currentField.fieldType,
                             // display_order might need updating if reordering is implemented
                             // display_order: fields.findIndex(f => f.clientId === currentField.clientId)
                         });
                     }
                } else { // New field
                     fieldsToAdd.push({
                         template_id: formId,
                         label: label,
                         internal_key: internalKey,
                         field_type: currentField.fieldType,
                         display_order: fields.findIndex(f => f.clientId === currentField.clientId) // Use current index for order
                     });
                }
            }

            // Check for deletions
            for (const originalField of originalFields) {
                 if (originalField.dbId && !fields.some(cf => cf.clientId === originalField.clientId)) {
                    fieldIdsToDelete.push(originalField.dbId);
                 }
            }

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
                // Supabase update can take an array of objects if primary key (id) is included
                const { error: updateError } = await supabase
                    .from('form_fields')
                    .upsert(fieldsToUpdate); // Use upsert to be safe, though update should work if IDs are correct
                 if (updateError) throw new Error(`Failed to update fields: ${updateError.message}`);
            }
            
            // Additions last
            if (fieldsToAdd.length > 0) {
                 // Update display_order for fields added based on their final position
                 const finalOrderedFields = fields.map((field, index) => {
                    const addedField = fieldsToAdd.find(fa => fa.label === field.fieldName.trim()); // Match by label for simplicity here
                    if (addedField) {
                        addedField.display_order = index;
                        return addedField;
                    }
                    return null; // Should not happen if logic is correct
                 }).filter(f => f !== null);

                const { error: insertError } = await supabase
                    .from('form_fields')
                    .insert(finalOrderedFields as any[]); // Insert the new fields with correct order
                 if (insertError) throw new Error(`Failed to add new fields: ${insertError.message}`);
            }
            
            // --- 4. Success --- 
            toast.success("Form template updated successfully!");
            // Update originalFields state to reflect the saved changes
            // setOriginalFields(JSON.parse(JSON.stringify(fields))); 
            // Optionally redirect, or just stay on the page
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
                  <div key={field.clientId} className="flex items-end space-x-2">
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" onClick={handleAddField}>Add Field</Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleUpdateTemplate} disabled={isUpdating || loading}>
            {isUpdating ? "Updating..." : "Update Template"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 