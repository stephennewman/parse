"use client"; // Needs to be a client component for hooks (useState, useEffect)

import React, { useState, useEffect } from 'react'; // Import hooks
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import Supabase client
import { Breadcrumbs } from '@/components/ui/breadcrumbs'; // Import Breadcrumbs
// Import Card components for better layout (optional)
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import type { Database } from '@/lib/database.types'; // If you have types

// Define a type for the form template structure (based on your schema)
interface FormTemplate {
  id: string; // or number, depending on your ID type
  name: string;
  description: string | null; // Assuming description can be null
  created_at: string;
  // user_id: string; // Include if needed
}

export default function FormsPage() {
  const [forms, setForms] = useState<FormTemplate[]>([]); // State for forms
  const [loading, setLoading] = useState(true);          // Loading state
  const [error, setError] = useState<string | null>(null); // Error state
  const supabase = createClientComponentClient();          // Initialize Supabase client

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      setError(null);

      // Fetch only forms belonging to the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("User not found. Please log in.");
        setLoading(false);
        // Optional: redirect to login?
        return;
      }

      // Fetch from Supabase, ordering by creation date descending
      const { data, error: fetchError } = await supabase
        .from('form_templates')
        .select('*') // Select all columns for now
        // Filter by user_id explicitly if RLS doesn't handle it automatically for SELECT
        // .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error("Error fetching forms:", fetchError);
        setError(fetchError.message);
      } else {
        setForms(data || []); // Set fetched data or empty array
      }
      setLoading(false);
    };

    fetchForms();
    // Run effect only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means run once on mount

  // --- Define breadcrumb items ---
  const breadcrumbItems = [
    { label: "Forms" }, // Current page, no href
  ];

  return (
    <div className="space-y-4">
      {/* --- Add Breadcrumbs --- */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Adjust the flex container: add justify-between, remove space-x-3 */}
      <div className="flex justify-between items-baseline"> {/* Changed classes */}
        <h1 className="text-2xl font-semibold">My Forms</h1>

        {/* Style the button: default solid variant, black background, white text */}
        <Button
          className="bg-black text-white hover:bg-gray-800" // Black background, white text, dark hover
          size="sm" // CHANGED: Set size to small
          asChild
        >
          <Link href="/forms/new">Create New Form</Link>
        </Button>
      </div>

      {/* Loading State */}
      {loading && <p>Loading forms...</p>}

      {/* Error State */}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Data Display */}
      {!loading && !error && (
        forms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"> {/* Grid layout */}
            {forms.map((form) => (
              // Make each form a link to a future detail page
              <Link href={`/forms/${form.id}`} key={form.id} className="block hover:shadow-md transition-shadow rounded-lg">
                 <Card>
                  <CardHeader>
                    <CardTitle>{form.name}</CardTitle>
                    {form.description && (
                      <CardDescription>{form.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500">
                      Created: {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                 </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
             <CardContent className="p-6 text-center text-muted-foreground">
                You haven't created any form templates yet.
             </CardContent>
          </Card>
        )
      )}
    </div>
  );
}