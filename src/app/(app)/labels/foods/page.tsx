"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { toast } from "sonner";
import { ChevronRight } from 'lucide-react';

const SEED_ITEMS = [
  // Breakfast
  { name: "Scrambled Eggs", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Egg", category: "Breakfast" },
  { name: "Oatmeal", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "", category: "Breakfast" },
  { name: "Pancakes", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Wheat, Egg, Milk", category: "Breakfast" },
  { name: "Sausage Links", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Breakfast" },
  { name: "French Toast", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Wheat, Egg, Milk", category: "Breakfast" },
  { name: "Bacon", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Breakfast" },
  { name: "Bagel", storage: "Ambient", defaultShelfLifeDays: 5, allergens: "Wheat", category: "Breakfast" },
  { name: "Cream Cheese", storage: "Refrigerated", defaultShelfLifeDays: 7, allergens: "Milk", category: "Breakfast" },
  { name: "Fruit Yogurt", storage: "Refrigerated", defaultShelfLifeDays: 7, allergens: "Milk", category: "Breakfast" },
  { name: "Hash Browns", storage: "Frozen", defaultShelfLifeDays: 30, allergens: "", category: "Breakfast" },
  // Lunch
  { name: "Chicken Salad", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Egg", category: "Lunch" },
  { name: "Tuna Sandwich", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Fish, Wheat, Egg", category: "Lunch" },
  { name: "Turkey Pot Pie", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Wheat, Milk", category: "Lunch" },
  { name: "Vegetable Soup", storage: "Refrigerated", defaultShelfLifeDays: 4, allergens: "", category: "Lunch" },
  { name: "Grilled Cheese", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Wheat, Milk", category: "Lunch" },
  { name: "BLT Sandwich", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Wheat", category: "Lunch" },
  { name: "Caesar Salad", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Egg, Fish, Milk, Wheat", category: "Lunch" },
  { name: "Chicken Noodle Soup", storage: "Refrigerated", defaultShelfLifeDays: 4, allergens: "Wheat, Egg", category: "Lunch" },
  { name: "Egg Salad", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Egg", category: "Lunch" },
  { name: "Ham & Cheese Sandwich", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Wheat, Milk", category: "Lunch" },
  // Dinner
  { name: "Beef Stew", storage: "Refrigerated", defaultShelfLifeDays: 4, allergens: "", category: "Dinner" },
  { name: "Mac & Cheese", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Milk, Wheat", category: "Dinner" },
  { name: "Baked Salmon", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "Fish", category: "Dinner" },
  { name: "Roast Chicken", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Dinner" },
  { name: "Meatloaf", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Egg, Wheat", category: "Dinner" },
  { name: "Mashed Potatoes", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Milk", category: "Dinner" },
  { name: "Steamed Broccoli", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Dinner" },
  { name: "Spaghetti & Meatballs", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Wheat, Egg", category: "Dinner" },
  { name: "Pork Chops", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Dinner" },
  { name: "Stuffed Peppers", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Dinner" },
  // Snacks
  { name: "Fruit Cup", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "Snack" },
  { name: "Yogurt Parfait", storage: "Refrigerated", defaultShelfLifeDays: 5, allergens: "Milk", category: "Snack" },
  { name: "Granola Bar", storage: "Ambient", defaultShelfLifeDays: 30, allergens: "Wheat, Tree Nuts", category: "Snack" },
  { name: "Cheese Sticks", storage: "Refrigerated", defaultShelfLifeDays: 7, allergens: "Milk", category: "Snack" },
  { name: "Apple Slices", storage: "Refrigerated", defaultShelfLifeDays: 2, allergens: "", category: "Snack" },
  { name: "Peanut Butter Crackers", storage: "Ambient", defaultShelfLifeDays: 30, allergens: "Peanut, Wheat", category: "Snack" },
  { name: "Rice Pudding", storage: "Refrigerated", defaultShelfLifeDays: 4, allergens: "Milk", category: "Snack" },
  { name: "Trail Mix", storage: "Ambient", defaultShelfLifeDays: 60, allergens: "Tree Nuts, Peanut", category: "Snack" },
  { name: "Banana", storage: "Ambient", defaultShelfLifeDays: 5, allergens: "", category: "Snack" },
  { name: "Graham Crackers", storage: "Ambient", defaultShelfLifeDays: 60, allergens: "Wheat", category: "Snack" },
  // Misc/Dessert
  { name: "Apple Pie", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "Wheat", category: "Misc" },
  { name: "Chocolate Pudding", storage: "Refrigerated", defaultShelfLifeDays: 4, allergens: "Milk", category: "Misc" },
  { name: "Mixed Nuts", storage: "Ambient", defaultShelfLifeDays: 60, allergens: "Tree Nuts", category: "Misc" },
  { name: "Crackers", storage: "Ambient", defaultShelfLifeDays: 60, allergens: "Wheat", category: "Misc" },
  { name: "Ice Cream", storage: "Frozen", defaultShelfLifeDays: 30, allergens: "Milk", category: "Misc" },
  { name: "Brownie", storage: "Ambient", defaultShelfLifeDays: 7, allergens: "Wheat, Egg, Milk", category: "Misc" },
  { name: "Lemon Bar", storage: "Ambient", defaultShelfLifeDays: 7, allergens: "Wheat, Egg, Milk", category: "Misc" },
  { name: "Jello", storage: "Refrigerated", defaultShelfLifeDays: 7, allergens: "", category: "Misc" },
  { name: "Shortbread Cookie", storage: "Ambient", defaultShelfLifeDays: 30, allergens: "Wheat, Milk", category: "Misc" },
  { name: "Rice Krispie Treat", storage: "Ambient", defaultShelfLifeDays: 14, allergens: "Milk", category: "Misc" },
];

const MOST_POPULAR = [
  "Scrambled Eggs",
  "Chicken Salad",
  "Mac & Cheese",
  "Fruit Cup",
  "Pancakes",
  "Beef Stew",
  "Apple Pie"
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function FoodDatabasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<any>({ name: "", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "" });

  // Easter egg: reset database
  const handleEasterEgg = () => {
    const seeded = SEED_ITEMS.map(i => ({ ...i, id: genId() }));
    setItems(seeded);
    localStorage.setItem("food_db", JSON.stringify(seeded));
    toast.success("Food database reset!");
  };

  // Load from localStorage or seed
  useEffect(() => {
    const storedRaw = localStorage.getItem("food_db");
    let stored = null;
    try {
      stored = storedRaw ? JSON.parse(storedRaw) : null;
    } catch {
      stored = null;
    }
    if (stored && Array.isArray(stored) && stored.length > 0) {
      setItems(stored);
    } else {
      const seeded = SEED_ITEMS.map(i => ({ ...i, id: genId() }));
      setItems(seeded);
      localStorage.setItem("food_db", JSON.stringify(seeded));
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem("food_db", JSON.stringify(items));
  }, [items]);

  const handleAdd = () => {
    if (!draft.name.trim() || !draft.category.trim()) {
      toast.error("Name and category required");
      return;
    }
    setItems([...items, { ...draft, id: genId() }]);
    setDraft({ name: "", storage: "Refrigerated", defaultShelfLifeDays: 3, allergens: "", category: "" });
    toast.success("Food item added");
  };

  const handleEdit = (item: any) => setEditing({ ...item });
  const handleSaveEdit = () => {
    setItems(items.map(i => i.id === editing.id ? editing : i));
    setEditing(null);
    toast.success("Food item updated");
  };
  const handleDelete = (id: string) => {
    setItems(items.filter(i => i.id !== id));
    toast.success("Food item deleted");
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center text-sm text-muted-foreground mb-2 select-none">
        <a href="/labels" className="hover:underline">Labels</a>
        <span
          className="mx-1 cursor-pointer"
          title="Easter Egg"
          onClick={handleEasterEgg}
          tabIndex={-1}
          aria-label="Reset Database"
        >
          <ChevronRight size={18} />
        </span>
        <span>Food Database</span>
      </nav>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Food Database</h1>
        <Button asChild>
          <a href="/labels/foods/add">+ Add Food Item</a>
        </Button>
      </div>
      {/* Most Popular Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Most Popular</h2>
        <div className="flex flex-wrap gap-2">
          {MOST_POPULAR.map(name => (
            <span key={name} className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
              {name}
            </span>
          ))}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Food Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Name</th>
                <th className="text-left py-2 px-3">Storage</th>
                <th className="text-left py-2 px-3">Shelf Life (days)</th>
                <th className="text-left py-2 px-3">Allergens</th>
                <th className="text-left py-2 px-3">Category</th>
                <th className="text-left py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{item.name}</td>
                  <td className="py-2 px-3">{item.storage}</td>
                  <td className="py-2 px-3">{item.defaultShelfLifeDays}</td>
                  <td className="py-2 px-3">{item.allergens}</td>
                  <td className="py-2 px-3">{item.category}</td>
                  <td className="py-2 px-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {/* Edit modal (inline for demo) */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Edit Food Item</h2>
            <div className="flex gap-2 flex-wrap mb-4">
              <Input placeholder="Name" value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <select className="border rounded px-2 py-1" value={editing.storage} onChange={e => setEditing({ ...editing, storage: e.target.value })}>
                <option value="Refrigerated">Refrigerated</option>
                <option value="Frozen">Frozen</option>
                <option value="Ambient">Ambient</option>
              </select>
              <Input type="number" min={1} placeholder="Shelf Life" value={editing.defaultShelfLifeDays} onChange={e => setEditing({ ...editing, defaultShelfLifeDays: Number(e.target.value) })} />
              <Input placeholder="Allergens" value={editing.allergens} onChange={e => setEditing({ ...editing, allergens: e.target.value })} />
              <Input placeholder="Category" value={editing.category} onChange={e => setEditing({ ...editing, category: e.target.value })} />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSaveEdit}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 