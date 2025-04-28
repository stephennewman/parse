import React from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Printer, LayoutTemplate, Edit, List, Database as DatabaseIcon } from 'lucide-react';

export default function LabelsHomePage() {
  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels' }]} />
      <h1 className="text-2xl font-semibold">Labels</h1>
      <div className="grid gap-6 md:grid-cols-3 justify-start">
        <Card>
          <CardHeader className="flex flex-row gap-3 items-center">
            <Printer size={32} className="text-blue-600" />
            <CardTitle>Pick & Print Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[48px] mb-4 flex items-center">
              <p className="text-sm text-muted-foreground">Quickly select a food item and print a label with minimal typing using Pick & Print Labels.</p>
            </div>
            <div className="flex flex-col h-full justify-between">
              <Button asChild className="w-full">
                <Link href="/labels/pick-print">Go to Pick & Print Labels</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row gap-3 items-center">
            <LayoutTemplate size={32} className="text-blue-600" />
            <CardTitle>Label Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[48px] mb-4 flex items-center">
              <p className="text-sm text-muted-foreground">Create and edit label templates (fields, rules).</p>
            </div>
            <div className="flex flex-col h-full justify-between">
              <Button asChild className="w-full">
                <Link href="/labels/templates">Go to Label Templates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row gap-3 items-center">
            <Edit size={32} className="text-blue-600" />
            <CardTitle>One-Time Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[48px] mb-4 flex items-center">
              <p className="text-sm text-muted-foreground">Fill out a one-time label and send it to the printer (mocked).</p>
            </div>
            <div className="flex flex-col h-full justify-between">
              <Button asChild className="w-full">
                <Link href="/labels/new">Create One-Time Label</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row gap-3 items-center">
            <List size={32} className="text-blue-600" />
            <CardTitle>Label Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[48px] mb-4 flex items-center">
              <p className="text-sm text-muted-foreground">View a log of all printed labels (mocked).</p>
            </div>
            <div className="flex flex-col h-full justify-between">
              <Button asChild className="w-full">
                <Link href="/labels/logs">View Log</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row gap-3 items-center">
            <DatabaseIcon size={32} className="text-blue-600" />
            <CardTitle>Inventory Database</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-[48px] mb-4 flex items-center">
              <p className="text-sm text-muted-foreground">Manage the inventory database for label selection.</p>
            </div>
            <div className="flex flex-col h-full justify-between">
              <Button asChild className="w-full">
                <Link href="/labels/foods">Go to Inventory Database</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 