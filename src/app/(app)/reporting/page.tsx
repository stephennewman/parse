"use client";
import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from 'lucide-react';
import Link from "next/link";

// File Purpose: This page provides reporting and analytics features, helping users review compliance and activity data.
// Last updated: 2025-05-21

const report = {
  site: "Boston Site A - Kitchen",
  date: "2024-06-10",
  responsible: "Jane Doe",
  supervisor: "John Smith",
  status: "Compliant",
  ccp: [
    {
      name: "Walk-in Freezer",
      target: "-10–10°F",
      actual: "2°F",
      time: "08:00 AM",
      status: "OK",
      corrective: "N/A",
    },
    {
      name: "Produce Fridge 1",
      target: "34–40°F",
      actual: "38°F",
      time: "08:00 AM",
      status: "OK",
      corrective: "N/A",
    },
    {
      name: "Meat Freezer",
      target: "-10–10°F",
      actual: "15°F",
      time: "08:00 AM",
      status: "Alert",
      corrective: "Moved product, called maintenance",
    },
    {
      name: "Dairy Fridge",
      target: "34–40°F",
      actual: "42°F",
      time: "08:00 AM",
      status: "Alert",
      corrective: "Discarded product, adjusted thermostat",
    },
  ],
  deviations: [
    {
      ccp: "Meat Freezer",
      issue: "Temperature above target. Product moved, maintenance notified.",
    },
    {
      ccp: "Dairy Fridge",
      issue: "Temperature above target. Product discarded, thermostat adjusted.",
    },
  ],
  review: "All corrective actions reviewed and signed off.",
};

export default function ReportingPage() {
  return (
    <div>
      <nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
        <ol className="list-reset flex">
          <li><Link href="/" className="hover:underline">Home</Link></li>
          <li><span className="mx-2">/</span></li>
          <li className="text-gray-700">Reporting</li>
        </ol>
      </nav>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><FileText className="text-blue-600" size={28} /> Reporting</h1>
      <Card className="p-8">
        <h1 className="text-2xl font-bold mb-2">HACCP Food Safety Report</h1>
        <div className="mb-6 text-gray-600">Daily Cold Storage HACCP Log</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div><span className="font-semibold">Site:</span> {report.site}</div>
          <div><span className="font-semibold">Date:</span> {report.date}</div>
          <div><span className="font-semibold">Responsible:</span> {report.responsible}</div>
          <div><span className="font-semibold">Supervisor:</span> {report.supervisor}</div>
          <div><span className="font-semibold">Status:</span> <Badge className="bg-green-100 text-green-800">{report.status}</Badge></div>
        </div>
        <h2 className="text-lg font-semibold mb-2 mt-6">Critical Control Points (CCPs) Monitored</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border rounded mb-6">
            <thead>
              <tr className="bg-muted">
                <th className="px-2 py-1 text-left">CCP</th>
                <th className="px-2 py-1 text-left">Target Range</th>
                <th className="px-2 py-1 text-left">Actual</th>
                <th className="px-2 py-1 text-left">Time</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Corrective Action</th>
              </tr>
            </thead>
            <tbody>
              {report.ccp.map((row, i) => (
                <tr key={i} className={row.status === "Alert" ? "bg-red-50" : ""}>
                  <td className="px-2 py-1">{row.name}</td>
                  <td className="px-2 py-1">{row.target}</td>
                  <td className="px-2 py-1">{row.actual}</td>
                  <td className="px-2 py-1">{row.time}</td>
                  <td className="px-2 py-1">
                    <Badge className={row.status === "Alert" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>{row.status}</Badge>
                  </td>
                  <td className="px-2 py-1">{row.corrective}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="text-lg font-semibold mb-2 mt-6">Deviations & Corrective Actions</h2>
        <ul className="list-disc pl-6 mb-6">
          {report.deviations.map((dev, i) => (
            <li key={i}><span className="font-semibold">{dev.ccp}:</span> {dev.issue}</li>
          ))}
        </ul>
        <h2 className="text-lg font-semibold mb-2 mt-6">Supervisor Review</h2>
        <div className="mb-2">{report.review}</div>
      </Card>
    </div>
  );
} 