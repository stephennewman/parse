"use client";
import React from 'react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

const mockSites = [
  { id: '1', name: 'My First Site', subdomain: 'myfirstsite', published_at: '2024-09-01' },
  { id: '2', name: 'Demo Site', subdomain: 'demo', published_at: null },
];

export default function SitesPage() {
  const router = useRouter();
  return (
    <div>
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Sites' }
      ]} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Globe className="text-blue-600" size={28} /> Sites</h1>
        <Button onClick={() => router.push('/sites/new')} className="cursor-pointer">
          Create New Site
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockSites.map(site => (
          <Card key={site.id}>
            <CardContent className="p-4">
              <CardTitle>{site.name}</CardTitle>
              <div className="text-gray-600 text-sm mb-2">{site.subdomain}.parseapp.com</div>
              <div className="text-xs text-gray-400">{site.published_at ? `Published: ${site.published_at}` : 'Not published'}</div>
              <Button size="sm" className="mt-4 cursor-pointer" onClick={() => router.push(`/sites/${site.id}/edit`)}>
                Edit Site
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 