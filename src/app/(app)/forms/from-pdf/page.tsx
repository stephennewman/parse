"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { FileText } from 'lucide-react';

export default function CreateFormFromPDFPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFields([]);
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/forms/from-pdf', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Failed to extract fields from PDF.');
      }
      const data = await res.json();
      setFields(data.fields || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: 'Forms', href: '/forms' },
        { label: 'Create from PDF' }
      ]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <FileText className="text-blue-600" /> Create Form from PDF
      </h1>
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Upload PDF Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input type="file" accept="application/pdf" onChange={handleFileChange} />
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {loading && <div>Extracting fields from PDF...</div>}
            {fields.length > 0 && (
              <div>
                <div className="font-semibold mb-2">Extracted Fields (Preview):</div>
                <ul className="list-disc pl-6">
                  {fields.map((f, i) => (
                    <li key={i}>{f.label} ({f.type})</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading}>Generate Form</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 