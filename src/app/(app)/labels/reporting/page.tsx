"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { BarChart2 } from 'lucide-react';

export default function ReportingPage() {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[
        { label: 'Labels', href: '/labels' },
        { label: 'Reporting' }
      ]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <BarChart2 className="text-blue-600" /> Reporting
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Label Usage Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="font-semibold mb-2">Labels Printed (Last 7 Days)</div>
            {/* Placeholder bar chart */}
            <div className="flex items-end gap-2 h-32">
              {[4, 7, 2, 9, 5, 3, 6].map((val, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="bg-blue-500 rounded w-6" style={{ height: `${val * 12}px` }}></div>
                  <div className="text-xs mt-1">{['S','M','T','W','T','F','S'][i]}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-700">36</div>
              <div className="text-sm text-blue-800">Labels Printed This Week</div>
            </div>
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-700">12</div>
              <div className="text-sm text-blue-800">Unique Food Items Labeled</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 