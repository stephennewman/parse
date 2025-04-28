"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Bluetooth } from 'lucide-react';

export default function PrinterIntegrationPage() {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: 'Labels', href: '/labels' },
        { label: 'Printer Integration' }
      ]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Bluetooth className="text-blue-600" /> Printer Integration
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Bluetooth Printer Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This page will allow you to connect and manage a Bluetooth printer for label printing. Bluetooth integration is coming soon!</p>
          <div className="p-4 bg-blue-50 rounded text-blue-800">
            <strong>Coming Soon:</strong> Connect to a supported Bluetooth printer and test label printing directly from this app.
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 