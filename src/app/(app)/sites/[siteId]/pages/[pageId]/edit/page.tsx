"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Discriminated union for section types
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

const sectionTypes = [
  { type: 'hero', label: 'Hero' },
  { type: 'about', label: 'About' },
  { type: 'form', label: 'Form' },
];

const mockForms = [
  { id: 'f1', name: 'Contact Form' },
  { id: 'f2', name: 'Feedback Form' },
];

export default function PageEditor() {
  const params = useParams() as Record<string, string>;
  const router = useRouter();
  const supabase = createClientComponentClient();
  const siteId = params.siteId;
  const pageId = params.pageId;

  const [sections, setSections] = useState<Section[]>([]);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load page data from Supabase
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
      setPageTitle(data.title);
      setPageSlug(data.slug);
      setSections(data.content_blocks || []);
      setLoading(false);
    }
    fetchPage();
  }, [pageId, supabase]);

  const handleAddSection = (newType: 'hero' | 'about' | 'form') => {
    let content: any;
    if (newType === 'hero') content = { title: '', subtitle: '' };
    else if (newType === 'about') content = { text: '' };
    else if (newType === 'form') content = { formId: '' };
    else return;
    setSections([
      ...sections,
      { id: `s${sections.length + 1}`, type: newType, content } as Section,
    ]);
  };

  const handleSectionChange = (idx: number, content: any) => {
    setSections(sections => sections.map((s, i) => i === idx ? { ...s, content } : s));
  };

  const handleDeleteSection = (idx: number) => {
    setSections(sections => sections.filter((_, i) => i !== idx));
  };

  const handleMoveSection = (idx: number, dir: -1 | 1) => {
    setSections(sections => {
      const newSections = [...sections];
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= newSections.length) return newSections;
      const [removed] = newSections.splice(idx, 1);
      newSections.splice(targetIdx, 0, removed);
      return newSections;
    });
  };

  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState<'hero' | 'about' | 'form'>('hero');

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from('pages')
      .update({ content_blocks: sections })
      .eq('id', pageId);
    setSaving(false);
    if (error) {
      setError('Failed to save: ' + error.message);
    } else {
      alert('Page saved!');
    }
  };

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Sites', href: '/sites' },
        { label: siteId, href: `/sites/${siteId}/edit` },
        { label: pageTitle },
      ]} />
      <h1 className="text-xl font-bold mb-2">Edit Page: {pageTitle}</h1>
      <div className="text-gray-500 mb-4">/{pageSlug}</div>
      <div className="mb-6">
        <Button onClick={() => setAdding(true)}>Add Section</Button>
        {adding && (
          <div className="mt-2 flex gap-2 items-center">
            <select value={newType} onChange={e => setNewType(e.target.value as 'hero' | 'about' | 'form')} className="border rounded px-2 py-1">
              {sectionTypes.map(s => <option key={s.type} value={s.type}>{s.label}</option>)}
            </select>
            <Button size="sm" onClick={() => { handleAddSection(newType); setAdding(false); }}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        )}
      </div>
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={section.id} className="p-4 border rounded-md bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{sectionTypes.find(s => s.type === section.type)?.label} Section</div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleMoveSection(idx, -1)} disabled={idx === 0} title="Move Up">↑</Button>
                <Button size="icon" variant="ghost" onClick={() => handleMoveSection(idx, 1)} disabled={idx === sections.length - 1} title="Move Down">↓</Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteSection(idx)} title="Delete">✕</Button>
              </div>
            </div>
            {/* Editable content editors for each type */}
            {section.type === 'hero' && (
              <>
                <input
                  type="text"
                  className="border rounded px-2 py-1 mb-2 w-full"
                  placeholder="Hero Title"
                  value={section.content.title}
                  onChange={e => handleSectionChange(idx, { ...section.content, title: e.target.value })}
                />
                <input
                  type="text"
                  className="border rounded px-2 py-1 w-full"
                  placeholder="Hero Subtitle"
                  value={section.content.subtitle}
                  onChange={e => handleSectionChange(idx, { ...section.content, subtitle: e.target.value })}
                />
              </>
            )}
            {section.type === 'about' && (
              <textarea
                className="border rounded px-2 py-1 w-full"
                placeholder="About text"
                value={section.content.text}
                onChange={e => handleSectionChange(idx, { ...section.content, text: e.target.value })}
              />
            )}
            {section.type === 'form' && (
              <select
                className="border rounded px-2 py-1 w-full"
                value={section.content.formId}
                onChange={e => handleSectionChange(idx, { ...section.content, formId: e.target.value })}
              >
                <option value="">Select a form...</option>
                {mockForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Page'}</Button>
        <Button variant="outline" onClick={() => window.open(`/site-preview/${siteId}/${pageId}`, '_blank')}>Preview</Button>
      </div>
    </div>
  );
} 