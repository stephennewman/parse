"use client";
import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { toast } from "sonner";
import Link from "next/link";
import { Printer } from 'lucide-react';

const STAFF_INITIALS = ["AB", "CD", "EF", "GH"];
const CATEGORY_ORDER = ["Breakfast", "Lunch", "Dinner", "Misc"];
const MOST_POPULAR = [
  "Scrambled Eggs",
  "Chicken Salad",
  "Mac & Cheese",
  "Fruit Cup",
  "Pancakes",
  "Beef Stew",
  "Apple Pie"
];

function groupByCategory(items: any[]): Record<string, any[]> {
  return items.reduce((acc: Record<string, any[]>, item: any) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function calcDiscardDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString();
}

// Helper to determine template type
function getTemplateType(category: string) {
  if (["Breakfast", "Lunch", "Dinner", "Snack"].includes(category)) return "Prep Label";
  return "Consumer Label";
}

function getTemplateLink(templateType: string) {
  // slugify: 'Prep Label' -> 'prep-label'
  return `/labels/templates/${templateType.toLowerCase().replace(/\s+/g, "-")}`;
}

export default function PickPrintPage() {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [staff, setStaff] = useState<string>(STAFF_INITIALS[0]);
  const [search, setSearch] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("food_db") || "[]");
    setFoodItems(stored);
  }, []);

  // Voice search handler
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Voice search not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      const match = foodItems.find(item => item.name.toLowerCase().includes(transcript));
      if (match) {
        setSelected(match);
        toast.success(`Selected: ${match.name}`);
      } else {
        toast.error(`No match for "${transcript}"`);
      }
    };
    recognition.onerror = () => toast.error("Voice search error");
    recognition.start();
    recognitionRef.current = recognition;
  };

  const filtered = foodItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    (item.allergens || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped = groupByCategory(filtered);

  return (
    <div className="space-y-4">
      <Breadcrumbs items={[{ label: 'Labels', href: '/labels' }, { label: 'Pick & Print Labels' }]} />
      <div className="flex items-center gap-2">
        <Printer size={28} className="text-blue-600" />
        <h1 className="text-2xl font-semibold">Pick & Print</h1>
      </div>
      {/* Search and Voice Search Controls */}
      <div className="mb-4 flex gap-2 items-center flex-wrap">
        <Input
          placeholder="Search by name, category, or allergen..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => { setSearch(""); setSelected(null); }}>Clear</Button>
        <Button size="sm" variant="outline" onClick={handleVoiceSearch}>
          <span role="img" aria-label="mic">🎤</span> Voice Search
        </Button>
      </div>
      {/* Most Popular Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Most Popular</h2>
        <div className="flex flex-wrap gap-2">
          {MOST_POPULAR.map(name => {
            const item = foodItems.find(i => i.name === name);
            return item ? (
              <Button
                key={name}
                variant={selected?.id === item.id ? "default" : "outline"}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${selected?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelected(item)}
                style={{ height: 'auto', minWidth: 0 }}
              >
                {name}
              </Button>
            ) : null;
          })}
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Food Grid */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Food Items</CardTitle>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-2">No food items found.</p>
                  <a href="/labels/foods" className="text-blue-600 underline">Manage Food Database</a>
                </div>
              ) : (
                [...Object.keys(grouped)].sort((a, b) => {
                  const aIdx = CATEGORY_ORDER.indexOf(a);
                  const bIdx = CATEGORY_ORDER.indexOf(b);
                  if (aIdx === -1 && bIdx === -1) return a.localeCompare(b);
                  if (aIdx === -1) return 1;
                  if (bIdx === -1) return -1;
                  return aIdx - bIdx;
                }).map(category => (
                  <div key={category} className="mb-4">
                    <h2 className="text-base font-semibold mb-1 text-muted-foreground">{category}</h2>
                    <div className="flex flex-wrap gap-2">
                      {grouped[category].map(item => (
                        <Button
                          key={item.id}
                          variant={selected?.id === item.id ? "default" : "outline"}
                          className={`inline-flex items-center justify-center text-center text-sm font-medium transition-all px-3 py-1 rounded-full ${selected?.id === item.id ? 'ring-2 ring-blue-500' : ''}`}
                          onClick={() => setSelected(item)}
                          tabIndex={0}
                          aria-selected={selected?.id === item.id}
                          style={{ height: 'auto', minWidth: 0 }}
                        >
                          <span>{item.name}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        {/* Label Preview */}
        <div className="w-full md:w-[350px] lg:w-[400px] flex-shrink-0">
          {selected && (
            <>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Label Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><b>Food:</b> {selected.name}</div>
                  <div><b>Storage:</b> {selected.storage}</div>
                  <div><b>Allergens:</b> {selected.allergens || "None"}</div>
                  <div><b>Open Date:</b> {new Date().toLocaleDateString()}</div>
                  <div><b>Discard Date:</b> {calcDiscardDate(selected.defaultShelfLifeDays)}</div>
                  <div className="flex items-center gap-2">
                    <b>Staff Initials:</b>
                    <select
                      className="border rounded px-2 py-1"
                      value={staff}
                      onChange={e => setStaff(e.target.value)}
                    >
                      {STAFF_INITIALS.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => toast.success("Label sent to printer! (mocked)")}>Print Label</Button>
                </CardFooter>
              </Card>
              {/* Metadata below preview */}
              <div className="mt-2 text-xs text-muted-foreground text-left">
                Template: <a href="/labels/templates" target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">{getTemplateType(selected.category)}</a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 