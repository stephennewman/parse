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
    if (fields.length !== 0) return true;
    // Check options and rating values
    if (Object.keys(fieldOptionsText).length > 0) return true;
    if (Object.keys(fieldRatingValues).length > 0) return true;
    return false;
  };

  // Reset state on mount (always) and on route change to /forms/new
  useEffect(() => {
    const resetFormState = () => {
      setFields([]);
      setFormTitle("");
      setFormDescription("");
      setFieldOptionsText({});
      setFieldRatingValues({});
      initialMount.current = false;
      setIsDirty(false);
    };
    resetFormState();
    // Listen for route changes
    const handleRouteChange = () => {
      if (window.location.pathname === "/forms/new") {
        resetFormState();
      }
    };
    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("pushstate", handleRouteChange);
    window.addEventListener("replacestate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("pushstate", handleRouteChange);
      window.removeEventListener("replacestate", handleRouteChange);
    };
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
    <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
      {/* Left: Form Builder */}
      <div className="flex-1 space-y-4">
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
                          <div className="flex gap-2 mt-2">
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
                                onClick={() => handleFieldChange(field.id, 'fieldType', type)}
                                className={`p-1 rounded border ${field.fieldType === type ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'} hover:bg-blue-50 transition`}
                              >
                                <Icon className={`w-5 h-5 ${field.fieldType === type ? 'text-blue-600' : 'text-gray-500'}`} />
                              </button>
                            ))}
                          </div>
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
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Text Field'}</Label>
                          <Input disabled placeholder="Text input" />
                        </div>
                      );
                    case 'number':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Number Field'}</Label>
                          <Input type="number" disabled placeholder="Number input" />
                        </div>
                      );
                    case 'date':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Date Field'}</Label>
                          <Input type="date" disabled />
                        </div>
                      );
                    case 'textarea':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Textarea'}</Label>
                          <Textarea disabled placeholder="Textarea" />
                        </div>
                      );
                    case 'checkbox':
                      return (
                        <div key={field.id} className="flex items-center gap-2">
                          <input type="checkbox" disabled />
                          <Label>{field.fieldName || 'Checkbox'}</Label>
                        </div>
                      );
                    case 'select':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Select'}</Label>
                          <select disabled className="border rounded px-2 py-1 w-full">
                            {(fieldOptionsText[field.id]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <option key={idx}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      );
                    case 'radio':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Radio'}</Label>
                          <div className="flex gap-4 mt-1">
                            {(fieldOptionsText[field.id]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <label key={idx} className="flex items-center gap-1">
                                <input type="radio" disabled name={field.id} /> {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    case 'multicheckbox':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Multicheckbox'}</Label>
                          <div className="flex gap-4 mt-1">
                            {(fieldOptionsText[field.id]?.split('\n').filter(Boolean) || ['Option 1', 'Option 2']).map((opt, idx) => (
                              <label key={idx} className="flex items-center gap-1">
                                <input type="checkbox" disabled /> {opt}
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    case 'rating':
                      return (
                        <div key={field.id}>
                          <Label>{field.fieldName || 'Rating'}</Label>
                          <div className="flex gap-1 mt-1">
                            {(() => {
                              const min = parseInt(fieldRatingValues[field.id]?.min || '1', 10);
                              const max = parseInt(fieldRatingValues[field.id]?.max || '5', 10);
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