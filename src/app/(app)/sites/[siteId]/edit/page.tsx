"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Page } from '@/lib/database.types';

const mockSite = {
  id: '1',
  name: 'My First Site',
  subdomain: 'myfirstsite',
};

export default function SiteEditorPage() {
  const params = useParams() as Record<string, string>;
  const router = useRouter();
  const siteId = params.siteId || mockSite.id;
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPages() {
      setLoading(true);
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('site_id', siteId)
        .order('order', { ascending: true });
      if (!error && data) setPages(data);
      setLoading(false);
    }
    fetchPages();
  }, [siteId, supabase]);

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Sites', href: '/sites' },
        { label: mockSite.name },
      ]} />
      <h1 className="text-2xl font-bold mb-2">Edit Site: {mockSite.name}</h1>
      <div className="text-gray-600 mb-4">{mockSite.subdomain}.parseapp.com</div>
      <div className="mb-6">
        <Button className="cursor-pointer" onClick={() => router.push(`/sites/${siteId}/pages/new`)}>Add New Page</Button>
      </div>
      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-400">Loading pages...</div>
        ) : pages.length === 0 ? (
          <div className="text-gray-400">No pages yet.</div>
        ) : (
          pages.map(page => (
            <div key={page.id} className="p-4 border rounded-md bg-white flex items-center justify-between">
              <div>
                <div className="font-semibold">{page.title}</div>
                <div className="text-xs text-gray-400">/{page.slug}</div>
              </div>
              <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => router.push(`/sites/${siteId}/pages/${page.id}/edit`)}>Edit Page</Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 