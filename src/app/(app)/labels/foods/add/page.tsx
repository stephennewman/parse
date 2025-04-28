"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function AddFoodItemPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<any>({ name: "", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "" });
  const [loading, setLoading] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim() || !draft.category.trim()) {
      toast.error("Name and category required");
      return;
    }
    setLoading(true);
    const stored = JSON.parse(localStorage.getItem("food_db") || "[]");
    const newItem = { ...draft, id: genId() };
    localStorage.setItem("food_db", JSON.stringify([...stored, newItem]));
    toast.success("Food item added");
    setTimeout(() => {
      router.push("/labels/foods");
    }, 500);
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Food Item</CardTitle>
        </CardHeader>
        <form onSubmit={handleAdd}>
          <CardContent className="space-y-4">
            <Input placeholder="Name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required />
            <select className="border rounded px-2 py-1 w-full" value={draft.storage} onChange={e => setDraft({ ...draft, storage: e.target.value })}>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Frozen">Frozen</option>
              <option value="Ambient">Ambient</option>
            </select>
            <Input type="number" min={1} placeholder="Shelf Life (days)" value={draft.defaultShelfLifeDays} onChange={e => setDraft({ ...draft, defaultShelfLifeDays: Number(e.target.value) })} required />
            <Input placeholder="Allergens" value={draft.allergens} onChange={e => setDraft({ ...draft, allergens: e.target.value })} />
            <Input placeholder="Category" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} required />
          </CardContent>
          <CardFooter className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/labels/foods")}>Cancel</Button>
            <Button type="submit" disabled={loading}>Add</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 