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
import {
  Type,
  Hash,
  Calendar,
  AlignLeft,
  CheckSquare,
  List,
  Dot,
  ListChecks,
  Star,
} from 'lucide-react';

// File Purpose: This page allows users to edit an existing form template, including changing fields, options, and structure.
// Last updated: 2025-05-21

// Interface for field state (matches NewFormPage)
interface FormFieldState {
  // Client-side temporary ID for React key prop and state management
  clientId: string; 
  // Store original DB ID if it exists (for updates/deletes)
  dbId?: string;
  fieldName: string;
  fieldType: string;
  required?: boolean;
  // <<< Add optional rating properties >>>
  rating_min?: number;
  rating_max?: number;
  checkboxDescription?: string;
  checkboxTextDescription?: string;
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
    rating_min?: number | null;
    rating_max?: number | null;
    required?: boolean | null;
}

// Interface for the payload to insert new fields
interface NewFormFieldPayload {
    template_id: string;
    label: string;
    internal_key: string;
    field_type: string;
    display_order: number;
    options?: string[] | null;
    rating_min?: number | null;
    rating_max?: number | null;
    required?: boolean | null;
}

// Define allowed field types
const FIELD_TYPES = ["text", "number", "date", "textarea", "checkbox", "select", "radio", "multicheckbox", "rating"];

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
  const formId = (params?.id ?? "") as string; // Get ID from URL, fallback to empty string if undefined

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormFieldState[]>([]);
  const [loading, setLoading] = useState(true); // State for initial data fetch
  const [isUpdating, startTransition] = useTransition(); // Renamed from isPending for clarity
  const [error, setError] = useState<string | null>(null); // State for fetch/update errors

  // Need state to store options text for select/radio fields
  // Use an object keyed by field.clientId for temporary storage
  const [fieldOptionsText, setFieldOptionsText] = useState<Record<string, string>>({});
  // <<< Add state for rating min/max values >>>
  const [fieldRatingValues, setFieldRatingValues] = useState<Record<string, { min?: string; max?: string }>>({});

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
              .select('id, label, field_type, display_order, options, rating_min, rating_max, required') // Fetch db id, label, type, options, rating
              .eq('template_id', formId)
              .order('display_order', { ascending: true });

          if (fieldsError) throw new Error(`Failed to fetch fields: ${fieldsError.message}`);

          // Map fetched fields to FormFieldState
          const mappedFields = (fieldsData || []).map(field => ({
              clientId: crypto.randomUUID(), // Generate a client ID for state management
              dbId: field.id,                // Store the original DB ID
              fieldName: field.label,        // Map label to fieldName
              fieldType: field.field_type,   // Map field_type to fieldType
              required: field.required ?? false,
              rating_min: field.rating_min ?? undefined, // <<< Map rating_min
              rating_max: field.rating_max ?? undefined, // <<< Map rating_max
          }));

          setFields(mappedFields);
          // <<< Initialize rating state from fetched data >>>
          const initialRatingValues: Record<string, { min?: string; max?: string }> = {};
          const initialOptionsText: Record<string, string> = {};
          (fieldsData || []).forEach(field => {
              const clientId = mappedFields.find(mf => mf.dbId === field.id)?.clientId;
              if (clientId) {
                  if (field.field_type === 'rating' && (field.rating_min !== null || field.rating_max !== null)) {
                      initialRatingValues[clientId] = {
                          min: field.rating_min?.toString() ?? '',
                          max: field.rating_max?.toString() ?? '',
                      };
                  }
                  if ((field.field_type === 'select' || field.field_type === 'radio' || field.field_type === 'multicheckbox') && field.options) {
                      initialOptionsText[clientId] = field.options.join('\n');
                  }
              }
          });
          setFieldRatingValues(initialRatingValues);
          setFieldOptionsText(initialOptionsText);

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
        clientId: crypto.randomUUID(),
        fieldName: "",
        fieldType: FIELD_TYPES[0] || "text",
        required: false,
      },
    ]);
  };

  const handleFieldChange = (clientId: string, property: keyof FormFieldState, value: any) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.clientId === clientId ? { ...field, [property]: value } : field
      )
    );
    if (property === 'fieldType' && value !== 'select' && value !== 'radio' && value !== 'multicheckbox') {
      setFieldOptionsText(prev => {
        const newState = { ...prev };
        delete newState[clientId];
        return newState;
      });
    }
    if (property === 'fieldType' && value !== 'rating') {
      setFieldRatingValues(prev => {
        const newState = { ...prev };
        delete newState[clientId];
        return newState;
      });
    }
  };

  // Handler for the options textarea (renamed)
  const handleOptionsTextChange = (clientId: string, optionsValue: string) => {
    setFieldOptionsText(prev => ({ ...prev, [clientId]: optionsValue }));
  };

  // <<< Handler for rating min/max inputs >>>
  const handleRatingChange = (clientId: string, type: 'min' | 'max', value: string) => {
    setFieldRatingValues(prev => ({
        ...prev,
        [clientId]: {
            ...prev[clientId],
            [type]: value,
        }
    }));
  };

  const handleRemoveField = (clientId: string) => {
    setFields(prevFields => prevFields.filter(field => field.clientId !== clientId));
    // Also remove any stored options text for the removed field
    setFieldOptionsText(prev => {
      const newState = { ...prev };
      delete newState[clientId];
      return newState;
    });
    // <<< Also remove rating values on field removal >>>
    setFieldRatingValues(prev => {
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
                if (currentField.fieldType === 'select' || currentField.fieldType === 'radio' || currentField.fieldType === 'multicheckbox') {
                    const optionsString = fieldOptionsText[currentField.clientId] || '';
                    optionsPayload = optionsString.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
                    if (optionsPayload.length === 0) {
                       const fieldTypeLabel = currentField.fieldType.charAt(0).toUpperCase() + currentField.fieldType.slice(1);
                       toast.warning(`Options cannot be empty for ${fieldTypeLabel} field: ${label}`);
                       throw new Error(`Options cannot be empty for ${fieldTypeLabel} field: ${label}`);
                    }
                }

                // <<< Prepare rating payload >>>
                let ratingMinPayload: number | null = null;
                let ratingMaxPayload: number | null = null;
                if (currentField.fieldType === 'rating') {
                    const ratingVals = fieldRatingValues[currentField.clientId];
                    const minStr = ratingVals?.min?.trim();
                    const maxStr = ratingVals?.max?.trim();

                    if (!minStr || !maxStr) {
                        toast.warning(`Rating scale must have both a Minimum and Maximum value for field: ${label}`);
                        throw new Error(`Rating scale must have both Min and Max values for field: ${label}`);
                    }
                    
                    ratingMinPayload = parseInt(minStr, 10);
                    ratingMaxPayload = parseInt(maxStr, 10);
                    
                    if (isNaN(ratingMinPayload) || isNaN(ratingMaxPayload)) {
                        toast.warning(`Rating Min/Max must be valid numbers for field: ${label}`);
                        throw new Error(`Rating Min/Max must be valid numbers for field: ${label}`);
                    }

                    if (ratingMinPayload >= ratingMaxPayload) {
                        toast.warning(`Rating Min must be less than Rating Max for field: ${label}`);
                        throw new Error(`Rating Min must be less than Rating Max for field: ${label}`);
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
                        options: optionsPayload, // Add options to update payload
                        rating_min: ratingMinPayload, // <<< Add rating min
                        rating_max: ratingMaxPayload, // <<< Add rating max
                        required: !!currentField.required,
                    });
                } else { // New field
                     fieldsToAdd.push({
                         template_id: formId,
                         label: label,
                         internal_key: internalKey,
                         field_type: currentField.fieldType,
                         display_order: fields.findIndex(f => f.clientId === currentField.clientId),
                         options: optionsPayload, // Add options to insert payload
                         rating_min: ratingMinPayload, // <<< Add rating min
                         rating_max: ratingMaxPayload, // <<< Add rating max
                         required: !!currentField.required,
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
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
      {/* Left: Form Builder */}
      <div className="flex-1 space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Card>
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
                      <div className="flex items-end gap-4 p-4 border rounded-md bg-gray-50 relative">
                        {/* Required toggle: top right, styled black */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <span className="text-xs font-medium">Required</span>
                          <input
                            type="checkbox"
                            checked={field.required || false}
                            onChange={e => handleFieldChange(field.clientId, 'required', e.target.checked)}
                            className="toggle toggle-sm accent-black"
                            aria-label="Toggle required field"
                          />
                        </div>
                        <div className="flex-grow space-y-2">
                          <div className="flex gap-2 mb-2">
                            {[
                              { type: 'text', icon: Type, label: 'Text' },
                              { type: 'number', icon: Hash, label: 'Number' },
                              { type: 'date', icon: Calendar, label: 'Date' },
                              { type: 'textarea', icon: AlignLeft, label: 'Textarea' },
                              { type: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
                              { type: 'select', icon: List, label: 'Select' },
                              { type: 'radio', icon: Dot, label: 'Radio' },
                              { type: 'multicheckbox', icon: ListChecks, label: 'Multicheckbox' },
                              { type: 'rating', icon: Star, label: 'Rating' },
                            ].map(({ type, icon: Icon, label }) => (
                              <button
                                key={type}
                                type="button"
                                aria-label={label}
                                title={label}
                                onClick={() => handleFieldChange(field.clientId, 'fieldType', type)}
                                className={`p-1 rounded border ${field.fieldType === type ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'} hover:bg-blue-50 transition`}
                              >
                                <Icon className={`w-5 h-5 ${field.fieldType === type ? 'text-blue-600' : 'text-gray-500'}`} />
                              </button>
                            ))}
                          </div>
                          <Input
                            id={`field-name-${field.clientId}`}
                            placeholder={(() => {
                              switch (field.fieldType) {
                                case 'text':
                                  return 'Text field (e.g., First Name, Last Name)';
                                case 'number':
                                  return 'Number field (e.g., Quantity, Age)';
                                case 'date':
                                  return 'Date field (e.g., Date of Birth, Start Date)';
                                case 'textarea':
                                  return 'Long text field (e.g., Comments, Notes)';
                                case 'checkbox':
                                  return 'Checkbox field (e.g., Accept Terms, Subscribe)';
                                case 'select':
                                  return 'Select field (e.g., Favorite Fruit, Department)';
                                case 'radio':
                                  return 'Radio field (e.g., Preferred Contact Method, Gender)';
                                case 'multicheckbox':
                                  return 'Multi-select field (e.g., Allergies, Skills)';
                                case 'rating':
                                  return 'Rating field (e.g., Satisfaction Rating, Difficulty)';
                                default:
                                  return 'Field Name';
                              }
                            })()}
                            value={field.fieldName}
                            onChange={(e) => handleFieldChange(field.clientId, 'fieldName', e.target.value)}
                          />
                          {/* Checkbox-specific description fields */}
                          {field.fieldType === 'checkbox' && (
                            <Input
                              id={`checkbox-desc-${field.clientId}`}
                              placeholder="Description (e.g., I agree, Yes, Accept Terms)"
                              value={field.checkboxDescription || ''}
                              onChange={e => handleFieldChange(field.clientId, 'checkboxDescription', e.target.value)}
                              className="mt-1"
                            />
                          )}
                          {(field.fieldType === 'select' || field.fieldType === 'radio' || field.fieldType === 'multicheckbox') && (
                            <div className="space-y-2 pt-2">
                              <Label htmlFor={`field-options-${field.clientId}`}>Options (one per line)</Label>
                              <Textarea
                                id={`field-options-${field.clientId}`}
                                placeholder="Option 1\nOption 2\nOption 3"
                                value={fieldOptionsText[field.clientId] || ''}
                                onChange={(e) => handleOptionsTextChange(field.clientId, e.target.value)}
                                rows={3}
                              />
                            </div>
                          )}
                          {field.fieldType === 'rating' && (
                            <div className="flex items-center space-x-2 pt-2">
                              <div className="space-y-1 w-1/2">
                                <Label htmlFor={`field-rating-min-${field.clientId}`}>Min Value</Label>
                                <Input
                                  id={`field-rating-min-${field.clientId}`}
                                  type="number"
                                  placeholder="e.g., 1"
                                  value={fieldRatingValues[field.clientId]?.min || ''}
                                  onChange={(e) => handleRatingChange(field.clientId, 'min', e.target.value)}
                                />
                              </div>
                              <div className="space-y-1 w-1/2">
                                <Label htmlFor={`field-rating-max-${field.clientId}`}>Max Value</Label>
                                <Input
                                  id={`field-rating-max-${field.clientId}`}
                                  type="number"
                                  placeholder="e.g., 5"
                                  value={fieldRatingValues[field.clientId]?.max || ''}
                                  onChange={(e) => handleRatingChange(field.clientId, 'max', e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(field.clientId)}
                          aria-label="Remove field"
                          className="text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
      {/* Right: Live Preview */}
      <div className="flex-1 min-w-[320px] md:sticky md:top-8 md:max-h-screen md:overflow-auto">
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-1">{formTitle || <span className="text-gray-400">Form Title</span>}</h2>
              <p className="text-gray-500 mb-4">{formDescription || <span className="text-gray-300">Form description...</span>}</p>
            </div>
            <form className="space-y-4">
              {fields.length === 0 ? (
                <div className="text-gray-400 italic">No fields yet. Add fields to preview the form.</div>
              ) : (
                fields.map((field) => {
                  switch (field.fieldType) {
                    case 'text':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Text Field'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <Input disabled placeholder="Text input" />
                        </div>
                      );
                    case 'number':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Number Field'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <Input type="number" disabled placeholder="Number input" />
                        </div>
                      );
                    case 'date':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Date Field'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <Input type="date" disabled />
                        </div>
                      );
                    case 'textarea':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Textarea'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <Textarea disabled placeholder="Textarea" />
                        </div>
                      );
                    case 'checkbox':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Checkbox'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="checkbox" disabled />
                            <span>{field.checkboxDescription || 'Checkbox'}</span>
                          </div>
                        </div>
                      );
                    case 'select':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Select'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <select disabled className="border rounded px-2 py-1 w-full">
                            {(fieldOptionsText[field.clientId]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <option key={idx}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    case 'radio':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Radio'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <div className="flex gap-4 mt-1">
                            {(fieldOptionsText[field.clientId]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <label key={idx} className="flex items-center gap-1">
                                <input type="radio" disabled name={field.clientId} /> {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    case 'multicheckbox':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Multicheckbox'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <div className="flex gap-4 mt-1">
                            {(fieldOptionsText[field.clientId]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <label key={idx} className="flex items-center gap-1">
                                <input type="checkbox" disabled /> {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    case 'rating':
                      return (
                        <div key={field.clientId}>
                          <Label>{field.fieldName || 'Rating'}{field.required ? <span className="text-red-500 ml-1">*</span> : null}</Label>
                          <div className="flex gap-1 mt-1">
                            {(() => {
                              const min = parseInt(fieldRatingValues[field.clientId]?.min || '1', 10);
                              const max = parseInt(fieldRatingValues[field.clientId]?.max || '5', 10);
                              const stars = [];
                              for (let i = min; i <= max; i++) {
                                stars.push(<Star key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" />);
                              }
                              return stars;
                            })()}
                          </div>
                        </div>
                      );
                    default:
                      return null;
                  }
                })
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 