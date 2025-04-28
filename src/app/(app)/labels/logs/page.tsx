"use client";
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import Link from "next/link";
import { List } from 'lucide-react';

const MOCK_LOGS = [
  {
    id: 1,
    labelType: "Prep Label",
    printedBy: "Alice",
    date: "2024-06-01 10:15",
    compliance: "Compliant",
  },
  {
    id: 2,
    labelType: "Consumer Label",
    printedBy: "Bob",
    date: "2024-06-01 11:00",
    compliance: "Missing Allergen",
  },
  {
    id: 3,
    labelType: "Prep Label",
    printedBy: "Charlie",
    date: "2024-06-01 12:30",
    compliance: "Compliant",
  },
];

export default function LogsPage() {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels', href: '/labels' }, { label: 'Label Log' }]} />
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <List className="text-blue-600" /> Label Log
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Label Print Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Label Type</th>
                  <th className="text-left py-2 px-3">Printed By</th>
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">Compliance</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LOGS.map(log => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">{log.labelType}</td>
                    <td className="py-2 px-3">{log.printedBy}</td>
                    <td className="py-2 px-3">{log.date}</td>
                    <td className={"py-2 px-3 " + (log.compliance === "Compliant" ? "text-green-600" : "text-red-600")}>{log.compliance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 