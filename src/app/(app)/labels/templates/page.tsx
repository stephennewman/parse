"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import Link from "next/link";
import { LayoutTemplate } from 'lucide-react';

// Initial mocked templates
const INITIAL_TEMPLATES = [
  {
    id: "prep",
    name: "Prep Label",
    fields: [
      { key: "foodItem", label: "Food Item", required: true },
      { key: "prepDate", label: "Prep Date", required: true, type: "date" },
      { key: "expiration", label: "Expiration Date", required: true, type: "date" },
      { key: "person", label: "Person", required: true },
      { key: "allergens", label: "Allergens", required: true },
    ],
  },
  {
    id: "consumer",
    name: "Consumer Label",
    fields: [
      { key: "foodItem", label: "Food Item", required: true },
      { key: "weight", label: "Weight (g)", required: true },
      { key: "price", label: "Price ($)", required: true },
      { key: "sellBy", label: "Sell By Date", required: true, type: "date" },
      { key: "ingredients", label: "Ingredients", required: true },
      { key: "quantity", label: "Quantity", required: true },
      { key: "barcode", label: "Barcode", required: false },
    ],
  },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [editing, setEditing] = useState<any | null>(null);
  const [newTemplate, setNewTemplate] = useState<any>({ name: "", fields: [] });
  const [fieldDraft, setFieldDraft] = useState<any>({ label: "", key: "", required: false, type: "text" });

  // Load templates from localStorage on mount
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("demo_templates") || "[]");
    // Merge, but avoid duplicates by id
    const merged = [...INITIAL_TEMPLATES];
    stored.forEach((t: any) => {
      if (!merged.some((it) => it.id === t.id)) merged.push(t);
    });
    setTemplates(merged);
  }, []);

  // Add new template
  const handleAddTemplate = () => {
    if (!newTemplate.name.trim()) {
      toast.error("Template name required");
      return;
    }
    if (newTemplate.fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }
    setTemplates([...templates, { ...newTemplate, id: genId() }]);
    setNewTemplate({ name: "", fields: [] });
    toast.success("Template added");
  };

  // Edit template
  const handleSaveEdit = () => {
    if (!editing.name.trim()) {
      toast.error("Template name required");
      return;
    }
    if (editing.fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }
    setTemplates(templates.map(t => t.id === editing.id ? editing : t));
    setEditing(null);
    toast.success("Template updated");
  };

  // Delete template
  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    toast.success("Template deleted");
  };

  // Add field to draft (for new or edit)
  const handleAddField = (toEdit = false) => {
    if (!fieldDraft.label.trim()) {
      toast.error("Field label required");
      return;
    }
    const key = fieldDraft.label.trim().toLowerCase().replace(/\s+/g, "_");
    const field = { ...fieldDraft, key };
    if (toEdit && editing) {
      setEditing({ ...editing, fields: [...editing.fields, field] });
    } else {
      setNewTemplate({ ...newTemplate, fields: [...newTemplate.fields, field] });
    }
    setFieldDraft({ label: "", key: "", required: false, type: "text" });
  };

  // Remove field from template
  const handleRemoveField = (idx: number, toEdit = false) => {
    if (toEdit && editing) {
      setEditing({ ...editing, fields: editing.fields.filter((_: any, i: number) => i !== idx) });
    } else {
      setNewTemplate({ ...newTemplate, fields: newTemplate.fields.filter((_: any, i: number) => i !== idx) });
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels', href: '/labels' }, { label: 'Label Templates' }]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <LayoutTemplate className="text-blue-600" /> Label Templates
      </h1>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Label Templates</h1>
        <Button asChild>
          <Link href="/labels/templates/new">Add Template</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Label Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {templates.map(t => (
              <li key={t.id} className="border rounded p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{t.name}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...t })}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(t.id)}>Delete</Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Fields: {t.fields.map((f: any) => f.label).join(", ")}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Edit template modal (inline for demo) */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Edit Template</h2>
            <Input
              placeholder="Template Name"
              value={editing.name}
              onChange={e => setEditing({ ...editing, name: e.target.value })}
            />
            <div className="space-y-2 mt-4">
              <div className="flex gap-2 items-end">
                <Input
                  placeholder="Field Label"
                  value={fieldDraft.label}
                  onChange={e => setFieldDraft({ ...fieldDraft, label: e.target.value })}
                />
                <select
                  className="border rounded px-2 py-1"
                  value={fieldDraft.type}
                  onChange={e => setFieldDraft({ ...fieldDraft, type: e.target.value })}
                >
                  <option value="text">Text</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={fieldDraft.required}
                    onChange={e => setFieldDraft({ ...fieldDraft, required: e.target.checked })}
                  />
                  Required
                </label>
                <Button size="sm" onClick={() => handleAddField(true)}>Add Field</Button>
              </div>
              <ul className="text-xs mt-2">
                {editing.fields.map((f: any, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    {f.label} ({f.type}) {f.required && <span className="text-red-500">*</span>}
                    <Button size="sm" variant="ghost" onClick={() => handleRemoveField(i, true)}>Remove</Button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 