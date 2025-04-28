"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Edit } from 'lucide-react';

// Mocked templates
const MOCK_TEMPLATES = [
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

let lastPrintedLabel: any = null;

export default function LabelCreationPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState(MOCK_TEMPLATES[0].id);
  const selectedTemplate = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId)!;
  const [form, setForm] = useState<any>({});

  const handleChange = (key: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handlePrint = () => {
    // Validate required fields
    const missing = selectedTemplate.fields.filter(f => f.required && !form[f.key]);
    if (missing.length > 0) {
      toast.error(`Missing required: ${missing.map(f => f.label).join(", ")}`);
      return;
    }
    lastPrintedLabel = { template: selectedTemplate.name, ...form };
    toast.success("Label sent to printer! (mocked)");
    setForm({});
  };

  const handleReprint = () => {
    if (!lastPrintedLabel) {
      toast("No label to reprint yet.");
      return;
    }
    toast.success(`Reprinted: ${lastPrintedLabel.template} (${Object.values(lastPrintedLabel).join(", ")})`);
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels', href: '/labels' }, { label: 'One-Time Labels' }]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Edit className="text-blue-600" /> One-Time Labels
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Create Label</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template">Label Template</Label>
            <select
              id="template"
              className="w-full border rounded px-2 py-1 mt-1"
              value={selectedTemplateId}
              onChange={e => {
                setSelectedTemplateId(e.target.value);
                setForm({});
              }}
            >
              {MOCK_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <Separator />
          {selectedTemplate.fields.map(field => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={field.key}>{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</Label>
              <Input
                id={field.key}
                type={field.type || "text"}
                value={form[field.key] || ""}
                onChange={e => handleChange(field.key, e.target.value)}
                placeholder={field.label}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={handlePrint}>Print Label</Button>
          <Button variant="outline" onClick={handleReprint}>Reprint Last</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 