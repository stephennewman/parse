"use client"; // Needs to be a client component for hooks (useState, useEffect)

import React, { useState, useEffect, useCallback } from 'react'; // Import useCallback
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
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import { toast } from "sonner"; // Import toast
import { Trash2 } from 'lucide-react'; // Import Trash icon
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
  const [selectedFormIds, setSelectedFormIds] = useState<Set<string>>(new Set()); // State for selected IDs
  const [isDeleting, setIsDeleting] = useState(false); // State for deletion process
  const supabase = createClientComponentClient();          // Initialize Supabase client

  // Wrap fetchForms in useCallback to stabilize its identity
  const fetchForms = useCallback(async () => {
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
      setForms([]); // Ensure forms is empty on error
    } else {
      setForms(data || []); // Set fetched data or empty array
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]); // Use the memoized fetchForms

  const handleCheckboxChange = (formId: string, checked: boolean | 'indeterminate') => {
    setSelectedFormIds(prevSelectedIds => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (checked === true) {
        newSelectedIds.add(formId);
      } else {
        newSelectedIds.delete(formId);
      }
      return newSelectedIds;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedFormIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedFormIds.size} selected form(s)? This cannot be undone.`
    );

    if (confirmed) {
      setIsDeleting(true);
      let deletedCount = 0;
      const errors: string[] = [];

      // Convert Set to Array to iterate with Promise.all
      const idsToDelete = Array.from(selectedFormIds);

      await Promise.all(idsToDelete.map(async (id) => {
        try {
          // Delete associated fields first
          const { error: fieldsError } = await supabase
            .from('form_fields')
            .delete()
            .eq('template_id', id);
          if (fieldsError) throw new Error(`Fields (ID: ${id}): ${fieldsError.message}`);

          // Delete the template
          const { error: templateError } = await supabase
            .from('form_templates')
            .delete()
            .eq('id', id);
          if (templateError) throw new Error(`Template (ID: ${id}): ${templateError.message}`);

          deletedCount++;
        } catch (err) {
          console.error("Deletion error for ID:", id, err);
          errors.push(err instanceof Error ? err.message : `Unknown error for ID: ${id}`);
        }
      }));

      if (errors.length > 0) {
        toast.error(`Failed to delete ${errors.length} form(s). See console for details.`);
        // Optionally show more details from the errors array
      }
      if (deletedCount > 0) {
        toast.success(`${deletedCount} form(s) deleted successfully.`);
        setSelectedFormIds(new Set()); // Clear selection
        await fetchForms(); // Refresh the list
      }
      setIsDeleting(false);
    }
  };

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

        <div className="flex items-center space-x-2"> {/* Container for buttons */}
          {/* Delete Selected Button */}
          {selectedFormIds.size > 0 && (
             <Button
               variant="destructive"
               size="sm"
               onClick={handleBulkDelete}
               disabled={isDeleting || selectedFormIds.size === 0}
               className="bg-red-600 hover:bg-red-700 text-white" // Example styling
             >
               <Trash2 className="mr-2 h-4 w-4" />
               {isDeleting ? 'Deleting...' : `Delete Selected (${selectedFormIds.size})`}
            </Button>
          )}

          {/* Create New Form Button */}
          <Button
            className="bg-black text-white hover:bg-gray-800"
            size="sm"
            asChild
            disabled={isDeleting} // Disable while deleting
          >
            <Link href="/forms/new">Create New Form</Link>
          </Button>
        </div>
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
              // Use a div wrapper to handle checkbox click propagation
              <div key={form.id} className="relative">
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col"> {/* Ensure card takes full height */}
                  <CardHeader className="flex flex-row items-start space-x-3 pb-2"> {/* Align checkbox and title */}
                     <Checkbox
                       id={`select-${form.id}`}
                       checked={selectedFormIds.has(form.id)}
                       onCheckedChange={(checked: boolean | 'indeterminate') => handleCheckboxChange(form.id, checked)}
                       onClick={(e: React.MouseEvent) => e.stopPropagation()} // Prevent Link navigation
                       aria-label={`Select form ${form.name}`}
                       className="mt-1" // Align checkbox slightly better
                       disabled={isDeleting} // Disable checkbox during delete
                     />
                     <div className="flex-1"> {/* Allow title/desc to take remaining space */}
                       <Link href={`/forms/${form.id}`} className="block" onClick={(e: React.MouseEvent) => { if (isDeleting) e.preventDefault(); }}> {/* Prevent link click during delete */}
                         <CardTitle className="text-lg hover:underline">{form.name}</CardTitle>
                       </Link>
                       {form.description && (
                         <CardDescription className="mt-1">{form.description}</CardDescription>
                       )}
                     </div>
                  </CardHeader>
                  <CardContent className="pt-0 flex-grow"> {/* Content fills remaining space */}
                    <Link href={`/forms/${form.id}`} className="block text-xs text-gray-500 hover:underline" onClick={(e: React.MouseEvent) => { if (isDeleting) e.preventDefault(); }}>
                      Created: {new Date(form.created_at).toLocaleDateString()}
                    </Link>
                  </CardContent>
                 </Card>
              </div>
            ))}
          </div>
        ) : (
          <Card>
             <CardContent className="p-6 text-center text-muted-foreground">
                You haven&apos;t created any form templates yet.
             </CardContent>
          </Card>
        )
      )}
    </div>
  );
}