"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useRouter } from "next/navigation";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AddTemplatePage() {
  const router = useRouter();
  const [template, setTemplate] = useState<any>({ name: "", fields: [] });
  const [fieldDraft, setFieldDraft] = useState<any>({ label: "", key: "", required: false, type: "text" });

  const handleAddField = () => {
    if (!fieldDraft.label.trim()) {
      toast.error("Field label required");
      return;
    }
    const key = fieldDraft.label.trim().toLowerCase().replace(/\s+/g, "_");
    const field = { ...fieldDraft, key };
    setTemplate({ ...template, fields: [...template.fields, field] });
    setFieldDraft({ label: "", key: "", required: false, type: "text" });
  };

  const handleRemoveField = (idx: number) => {
    setTemplate({ ...template, fields: template.fields.filter((_: any, i: number) => i !== idx) });
  };

  const handleAddTemplate = () => {
    if (!template.name.trim()) {
      toast.error("Template name required");
      return;
    }
    if (template.fields.length === 0) {
      toast.error("Add at least one field");
      return;
    }
    // For demo: store in localStorage
    const existing = JSON.parse(localStorage.getItem("demo_templates") || "[]");
    localStorage.setItem("demo_templates", JSON.stringify([...existing, { ...template, id: genId() }]));
    toast.success("Template added");
    router.push("/labels/templates");
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels', href: '/labels' }, { label: 'Templates', href: '/labels/templates' }, { label: 'Add Template' }]} />
      <h1 className="text-2xl font-semibold">Add New Template</h1>
      <Card>
        <CardHeader>
          <CardTitle>Add New Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Template Name"
            value={template.name}
            onChange={e => setTemplate({ ...template, name: e.target.value })}
          />
          <div className="space-y-2">
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
              <Button size="sm" onClick={handleAddField}>Add Field</Button>
            </div>
            <ul className="text-xs mt-2">
              {template.fields.map((f: any, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  {f.label} ({f.type}) {f.required && <span className="text-red-500">*</span>}
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveField(i)}>Remove</Button>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddTemplate}>Add Template</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 