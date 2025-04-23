"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useTransition } from "react";
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

interface FormField {
  id: string;
  fieldName: string;
  fieldType: string;
}

// Define allowed field types
const FIELD_TYPES = ["text", "number", "date", "textarea"];

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
  const [fields, setFields] = useState<FormField[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  const handleFieldChange = (id: string, property: keyof FormField, value: string) => {
    setFields(prevFields =>
      prevFields.map(field =>
        field.id === id ? { ...field, [property]: value } : field
      )
    );
  };

  const handleRemoveField = (id: string) => {
    setFields(prevFields => prevFields.filter(field => field.id !== id));
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

            const fieldsToInsert = fields.map((field, _index) => {
              const label = field.fieldName.trim();
              if (!label) {
                 toast.warning(`Field name cannot be empty (check field #${_index + 1}).`);
                 throw new Error(`Field name cannot be empty (check field #${_index + 1}).`);
              }
              const internalKey = generateInternalKey(label);
              if (!internalKey) {
                  toast.warning(`Could not generate valid internal key for field: ${label}`);
                  throw new Error(`Could not generate valid internal key for field: ${label}`);
              }
              return {
                  template_id: templateId,
                  label: label,
                  internal_key: internalKey,
                  field_type: field.fieldType,
                  display_order: _index,
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
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Form Fields</h3>
            <div className="space-y-4">
              {fields.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-md min-h-[100px] flex items-center justify-center text-sm text-gray-500">
                  Add fields using the button below.
                </div>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                fields.map((field, _index) => (
                  <div key={field.id} className="flex items-end gap-4 p-4 border rounded-md bg-gray-50">
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
                ))
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddField}
            >
              Add Field
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
          >
            {isPending ? "Saving..." : "Save Template"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 