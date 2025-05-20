"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NewSitePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.from('sites').insert({
      name,
      subdomain,
    }).select().single();
    setLoading(false);
    if (error) {
      setError(error.message);
    } else if (data) {
      router.push(`/sites/${data.id}/edit`);
    }
  };

  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Sites', href: '/sites' },
        { label: 'New Site' },
      ]} />
      <h1 className="text-2xl font-bold mb-4">Create New Site</h1>
      <div className="max-w-md space-y-4">
        <div>
          <label className="block mb-1 font-medium">Site Name</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. My Company"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Subdomain</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={subdomain}
            onChange={e => setSubdomain(e.target.value)}
            placeholder="e.g. mycompany"
            disabled={loading}
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-4 mt-6">
          <Button onClick={handleSave} disabled={!name || !subdomain || loading}>{loading ? 'Saving...' : 'Save'}</Button>
          <Button variant="outline" onClick={() => router.push('/sites')} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  );
} 