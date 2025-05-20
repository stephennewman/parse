"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface HeroSection {
  id: string;
  type: 'hero';
  content: { title: string; subtitle: string };
}
interface AboutSection {
  id: string;
  type: 'about';
  content: { text: string };
}
interface FormSection {
  id: string;
  type: 'form';
  content: { formId: string };
}
type Section = HeroSection | AboutSection | FormSection;

const mockForms = [
  { id: 'f1', name: 'Contact Form' },
  { id: 'f2', name: 'Feedback Form' },
];

export default function SitePreviewPage() {
  const params = useParams() as Record<string, string>;
  const supabase = createClientComponentClient();
  const siteId = params.siteId;
  const pageId = params.pageId;

  const [page, setPage] = useState<any>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single();
      if (error) {
        setError('Could not load page.');
        setLoading(false);
        return;
      }
      setPage(data);
      setSections(data.content_blocks || []);
      setLoading(false);
    }
    fetchPage();
  }, [pageId, supabase]);

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-white">
      <header className="py-6 border-b mb-8 text-center">
        <h1 className="text-3xl font-bold">{page?.title}</h1>
        <div className="text-gray-500">{page?.slug}</div>
      </header>
      <main className="max-w-2xl mx-auto space-y-12">
        {sections.map(section => {
          if (section.type === 'hero') {
            return (
              <section key={section.id} className="text-center py-12 bg-blue-50 rounded">
                <h2 className="text-2xl font-bold mb-2">{section.content.title}</h2>
                <p className="text-lg text-gray-600">{section.content.subtitle}</p>
              </section>
            );
          }
          if (section.type === 'about') {
            return (
              <section key={section.id} className="py-8">
                <h3 className="text-xl font-semibold mb-2">About</h3>
                <p className="text-gray-700">{section.content.text}</p>
              </section>
            );
          }
          if (section.type === 'form') {
            const form = mockForms.find(f => f.id === section.content.formId);
            return (
              <section key={section.id} className="py-8">
                <h3 className="text-xl font-semibold mb-2">Form</h3>
                <div className="text-gray-500">{form ? form.name : 'No form selected'}</div>
                {/* Placeholder for embedded form */}
                <div className="mt-4 p-4 border rounded bg-gray-50 text-center text-gray-400">[Form Embed Here]</div>
              </section>
            );
          }
          return null;
        })}
      </main>
    </div>
  );
} 