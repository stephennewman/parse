"use client";
import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NewPage() {
  const router = useRouter();
  const params = useParams() as Record<string, string>;
  const siteId = params.siteId;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('pages').insert({
      site_id: siteId,
      title,
      slug,
      content_blocks: [],
      order: 100, // TODO: set correct order
    });
    setLoading(false);
    if (error) {
      alert('Error creating page: ' + error.message);
    } else {
      router.push(`/sites/${siteId}/edit`);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Website', href: '/sites' },
        { label: 'New Page' },
      ]} />
      <h1 className="text-2xl font-bold mb-4">Create New Page</h1>
      <div className="max-w-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Page Title</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. About Us"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Slug</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="e.g. about"
            disabled={loading}
          />
        </div>
        <div className="flex gap-4 mt-6">
          <Button onClick={handleSave} disabled={!title || !slug || loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button variant="outline" onClick={() => router.push(`/sites/${siteId}/edit`)} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  );
} 