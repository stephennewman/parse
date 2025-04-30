"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition, useEffect, useRef } from "react";
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
import { useRouter } from "next/navigation";
import React from "react";
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { toast } from "sonner";
import { PlusCircle } from 'lucide-react';

interface FormFieldState {
  id: string;
  fieldName: string;
  fieldType: string;
  rating_min?: number;
  rating_max?: number;
}

interface FormFieldPayload {
  template_id: string;
  label: string;
  internal_key: string;
  field_type: string;
  display_order: number;
  options?: string[] | null;
  rating_min?: number | null;
  rating_max?: number | null;
}

// Define allowed field types
const FIELD_TYPES = ["text", "number", "date", "textarea", "checkbox", "select", "radio", "multicheckbox", "rating"];

// Helper function to generate an internal key from a label
function generateInternalKey(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, ''); // Remove non-alphanumeric characters except underscore
}

const PREPOPULATED_FIELDS: FormFieldState[] = [
  { id: crypto.randomUUID(), fieldName: "Date", fieldType: "text" },
  { id: crypto.randomUUID(), fieldName: "Staff Appearance: Uniforms worn with name tags visible", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Staff Appearance: Proper hair/beard restraint worn with no hair exposed", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Breakfast Tray-line: Spreadsheet available in view", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Breakfast Tray-line: Items being served matches the spreadsheet", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Breakfast Tray-line: Steam table set-up properly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Breakfast Tray-line: Proper serving utensils being used", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Breakfast Tray-line: Temperatures checked and recorded", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Dry Storage Room: Items off the floor", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Dry Storage Room: Items stored 18\" from ceiling/sprinkler head", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Dry Storage Room: Opened items covered tightly, labeled and dated", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Dry Storage Room: Free of personal items", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Dry Storage Room: Empty boxes removed", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Janitor Closet: Mop bucket emptied", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Janitor Closet: Mop and brooms hung on hanger", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Janitor Closet: Dustpan clean and stored on hanger", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Janitor Closet: Free of odors", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Paper Storage Room: Items off the floor", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Paper Storage Room: Items stored 18\" from ceiling/sprinkler head", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Paper Storage Room: Free of personal items", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Paper Storage Room: Empty boxes removed", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Cooler: All items labeled and dated correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Cooler: Items stored correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Cooler: Temperature checked and recorded correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Freezer: Items stored and labeled correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Freezer: Free of ice build-up", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Walk-in Freezer: Temperature checked and recorded correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Reach-in Refrigerator: Items properly covered, labeled and dated", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Reach-in Refrigerator: Temperature checked and recorded correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Tray-line Refrigerator: Items properly covered, labeled and dated", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Tray-line Refrigerator: Temperature checked and recorded correctly", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Hand Washing Sinks: Clean", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Hand Washing Sinks: Soap available", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Hand Washing Sinks: Paper towels available", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Pantry: Temperatures checked and recorded daily", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Pantry: Resident food labeled, dated with name, date brought in, and discard date", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Pantry: Equipment clean", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Meal Production: Daily menu posted and is correct", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Meal Production: All food items available for lunch and dinner meal per menu", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: Dumpster area clean and lids/doors closed", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: Trash cans covered", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: Sanitation buckets available with adequate ppm", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: Dish machine temperatures recorded", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: 3-compartment sanitizing PPM recorded and adequate", fieldType: "checkbox" },
  { id: crypto.randomUUID(), fieldName: "Other Areas: Cleaning schedules initialed", fieldType: "checkbox" }
];

export default function NewFormPage() {
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [fields, setFields] = useState<FormFieldState[]>([]);
  const [fieldOptionsText, setFieldOptionsText] = useState<Record<string, string>>({});
  const [fieldRatingValues, setFieldRatingValues] = useState<Record<string, { min?: string; max?: string }>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const initialMount = useRef(true);
  const [isDirty, setIsDirty] = useState(false);

  const supabase = createClientComponentClient();

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: crypto.randomUUID(),
        fieldName: "",
        fieldType: FIELD_TYPES[0] || "text",
      },
    ]);
  };

  const handleFieldChange = (id: string, property: keyof FormFieldState, value: string) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );
    if (property === 'fieldType' && value !== 'select' && value !== 'radio' && value !== 'multicheckbox' && value !== 'rating') {
      setFieldOptionsText(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
    if (property === 'fieldType' && value !== 'rating') {
      setFieldRatingValues(prev => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  const handleOptionsTextChange = (id: string, optionsValue: string) => {
    setFieldOptionsText(prev => ({ ...prev, [id]: optionsValue }));
  };

  const handleRatingChange = (id: string, type: 'min' | 'max', value: string) => {
    setFieldRatingValues(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            [type]: value,
        }
    }));
  };

  const handleRemoveField = (id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
    setFieldOptionsText(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setFieldRatingValues(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const handleSaveTemplate = async () => {
    if (!formTitle.trim()) {
      alert("Please enter a form title.");
      return;
    }
    if (fields.length === 0) {
      alert("Please add at least one form field.");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("User not found. Please log in again.");
        router.push('/login');
        return;
    }

    startTransition(async () => {
        let templateId: string | null = null;

        try {
            const { data: templateData, error: templateError } = await supabase
              .from('form_templates')
              .insert({
                name: formTitle.trim(),
                description: formDescription.trim(),
              })
              .select('id')
              .single();

            if (templateError) throw templateError;
            if (!templateData || !templateData.id) {
              throw new Error("Failed to save template header or retrieve its ID.");
            }
            templateId = templateData.id;

            const fieldsToInsert: FormFieldPayload[] = fields.map((field) => {
              const label = field.fieldName.trim();
              if (!label) {
                 toast.warning(`Field name cannot be empty (check field #${fields.indexOf(field) + 1}).`);
                 throw new Error(`Field name cannot be empty (check field #${fields.indexOf(field) + 1}).`);
              }
              const internalKey = generateInternalKey(label);
              if (!internalKey) {
                  toast.warning(`Could not generate valid internal key for field: ${label}`);
                  throw new Error(`Could not generate valid internal key for field: ${label}`);
              }
              
              let optionsPayload: string[] | null = null;
              if (field.fieldType === 'select' || field.fieldType === 'radio' || field.fieldType === 'multicheckbox') {
                  const optionsString = fieldOptionsText[field.id] || '';
                  optionsPayload = optionsString.split('\n').map(opt => opt.trim()).filter(opt => opt.length > 0);
                  if (optionsPayload.length === 0) {
                     const fieldTypeLabel = field.fieldType.charAt(0).toUpperCase() + field.fieldType.slice(1);
                     toast.warning(`Options cannot be empty for ${fieldTypeLabel} field: ${label}`);
                     throw new Error(`Options cannot be empty for ${fieldTypeLabel} field: ${label}`);
                  }
              }

              let ratingMinPayload: number | null = null;
              let ratingMaxPayload: number | null = null;
              if (field.fieldType === 'rating') {
                  const ratingVals = fieldRatingValues[field.id];
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

              return {
                  template_id: templateId as string,
                  label: label,
                  internal_key: internalKey,
                  field_type: field.fieldType,
                  display_order: fields.indexOf(field),
                  options: optionsPayload,
                  rating_min: ratingMinPayload,
                  rating_max: ratingMaxPayload,
              };
            });

            if (fieldsToInsert.length > 0) {
                const { error: fieldsError } = await supabase
                  .from('form_fields')
                  .insert(fieldsToInsert);

                if (fieldsError) throw fieldsError;
            }

            toast.success("Form template saved successfully!");

            router.push(`/forms/${templateId}`);

        } catch (error) {
            let message = "Error saving template";
            if (error instanceof Error) {
              message = `Error saving template: ${error.message}`;
            }
            console.error("Error saving form template:", error);
            toast.error(message);
        }
    });
  };

  // Helper to compare current state to initial state
  const isFormDirty = () => {
    if (formTitle !== "" || formDescription !== "") return true;
    if (fields.length !== PREPOPULATED_FIELDS.length) return true;
    for (let i = 0; i < fields.length; i++) {
      if (
        fields[i].fieldName !== PREPOPULATED_FIELDS[i].fieldName ||
        fields[i].fieldType !== PREPOPULATED_FIELDS[i].fieldType
      ) {
        return true;
      }
    }
    // Check options and rating values
    if (Object.keys(fieldOptionsText).length > 0) return true;
    if (Object.keys(fieldRatingValues).length > 0) return true;
    return false;
  };

  // Reset state on mount (always)
  useEffect(() => {
    setFields(PREPOPULATED_FIELDS);
    setFormTitle("Culinary Manager - AM Daily Walk-thru Checklist");
    setFormDescription("");
    setFieldOptionsText({});
    setFieldRatingValues({});
    initialMount.current = false;
    setIsDirty(false);
  }, []);

  // Track dirty state
  useEffect(() => {
    if (!initialMount.current) {
      setIsDirty(isFormDirty());
    }
    // eslint-disable-next-line
  }, [formTitle, formDescription, fields, fieldOptionsText, fieldRatingValues]);

  // Prompt on unsaved changes (browser/tab close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Prompt on in-app navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave this page?")) {
        // Prevent navigation
        router.push("/forms/new");
        throw "Route change aborted due to unsaved changes.";
      }
    };
    // Next.js app router does not expose router.events, so we use beforePopState for browser back/forward
    if (typeof window !== "undefined") {
      const handler = (event: PopStateEvent) => {
        if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to leave this page?")) {
          event.preventDefault();
          window.history.pushState(null, "", window.location.pathname);
        }
      };
      window.addEventListener("popstate", handler);
      return () => {
        window.removeEventListener("popstate", handler);
      };
    }
  }, [isDirty, router]);

  // --- Define breadcrumb items for this page ---
  const breadcrumbItems = [
    { label: "Forms", href: "/forms" },
    { label: "Create New" },
  ];

  return (
    <div className="w-full max-w-2xl space-y-4">
      <Breadcrumbs items={breadcrumbItems} />
      <h1 className="text-2xl font-semibold">Create New Form</h1>
      <Card>
        <CardHeader>
          {/* Keep CardTitle for context within the card, or remove if h1 is sufficient */}
          <CardTitle>Create New Form Template</CardTitle>
          <CardDescription>
            Define the structure for your voice-to-form conversion. Start by
            giving it a title and description.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="form-title">Form Title</Label>
            <Input
              id="form-title"
              placeholder="e.g., Customer Intake"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>
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
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
            <strong>Tip:</strong> You can fill out this checklist by <b>tapping the boxes</b> below, or by using voice input if available.
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Fields</h3>
            <div className="space-y-4">
              {fields.length === 0 ? (
                null
              ) : (
                fields.map((field) => (
                  <React.Fragment key={field.id}>
                    <div className="flex items-end gap-4 p-4 border rounded-md bg-gray-50">
                      <div className="flex-grow space-y-2">
                        <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                        <Input
                          id={`field-name-${field.id}`}
                          placeholder="e.g., Full Name"
                          value={field.fieldName}
                          onChange={(e) => handleFieldChange(field.id, 'fieldName', e.target.value)}
                        />
                      </div>
                      <div className="w-1/3 space-y-2">
                        <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                        <Select
                          value={field.fieldType}
                          onValueChange={(value) => handleFieldChange(field.id, 'fieldType', value)}
                        >
                          <SelectTrigger id={`field-type-${field.id}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map(type => (
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
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleRemoveField(field.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove field</span>
                      </Button>
                    </div>

                    {(field.fieldType === 'select' || field.fieldType === 'radio' || field.fieldType === 'multicheckbox') && (
                      <div className="space-y-2 pl-2 pt-2">
                        <Label htmlFor={`field-options-${field.id}`}>Options (one per line)</Label>
                        <Textarea
                          id={`field-options-${field.id}`}
                          placeholder="Option 1\nOption 2\nOption 3"
                          value={fieldOptionsText[field.id] || ''}
                          onChange={(e) => handleOptionsTextChange(field.id, e.target.value)}
                          rows={3}
                        />
                      </div>
                    )}
                    {field.fieldType === 'rating' && (
                      <div className="flex items-center space-x-2 pl-2 pt-2">
                        <div className="space-y-1 w-1/2">
                          <Label htmlFor={`field-rating-min-${field.id}`}>Min Value</Label>
                          <Input
                            id={`field-rating-min-${field.id}`}
                            type="number"
                            placeholder="e.g., 1"
                            value={fieldRatingValues[field.id]?.min || ''}
                            onChange={(e) => handleRatingChange(field.id, 'min', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 w-1/2">
                          <Label htmlFor={`field-rating-max-${field.id}`}>Max Value</Label>
                          <Input
                            id={`field-rating-max-${field.id}`}
                            type="number"
                            placeholder="e.g., 5"
                            value={fieldRatingValues[field.id]?.max || ''}
                            onChange={(e) => handleRatingChange(field.id, 'max', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddField}
              variant="outline"
              className="cursor-pointer"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Field
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" asChild>
            <Link href="/forms">Cancel</Link>
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isPending}
            className="cursor-pointer"
          >
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 