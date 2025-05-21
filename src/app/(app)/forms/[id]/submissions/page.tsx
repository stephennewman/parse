"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Eye, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';

// File Purpose: This page lists all submissions for a specific form, letting users review and manage collected data.
// Last updated: 2025-05-21

// Types
interface Submission {
    id: string;
    created_at: string;
    form_data: Record<string, string | number | null>;
}
interface FormTemplate {
    id: string;
    name: string;
}
interface FormField {
    id: string;
    label: string;
    internal_key: string;
    display_order: number;
}

// Define SortDirection type
type SortDirection = 'asc' | 'desc';

export default function FormSubmissionsListPage() {
    const params = useParams();
    const router = useRouter();
    const templateId = params?.id as string | undefined;
    if (!templateId) {
        return <div>Error: Form ID is missing.</div>;
    }
    const supabase = createClientComponentClient();

    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Sorting State --- 
    const [sortKey, setSortKey] = useState<string | null>('created_at'); // Default sort
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default direction

    useEffect(() => {
        const fetchSubmissionsAndFields = async () => {
            if (!templateId) return;
            setLoading(true);
            setError(null);
            try {
                // Fetch template name first for breadcrumbs/title
                const { data: tData, error: tError } = await supabase
                    .from('form_templates')
                    .select('id, name')
                    .eq('id', templateId)
                    .single();
                
                if (tError) throw new Error(`Failed to fetch form template: ${tError.message}`);
                if (!tData) throw new Error('Form template not found.');
                setTemplate(tData);

                // Fetch Form Fields for the template
                const { data: fData, error: fError } = await supabase
                    .from('form_fields')
                    .select('id, label, internal_key, display_order')
                    .eq('template_id', templateId)
                    .order('display_order', { ascending: true });
                
                if (fError) throw new Error(`Failed to fetch form fields: ${fError.message}`);
                setFields(fData || []);

                // Fetch submissions including form_data
                const { data: sData, error: sError } = await supabase
                    .from('form_submissions')
                    .select('id, created_at, form_data')
                    .eq('template_id', templateId)
                    .order('created_at', { ascending: false });

                if (sError) throw new Error(`Failed to fetch submissions: ${sError.message}`);
                setSubmissions(sData || []);

            } catch (err) {
                console.error("Error fetching submissions list/fields:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissionsAndFields();
    }, [templateId, supabase]);

    // --- Sorting Logic --- 
    const handleSort = (key: string) => {
        if (sortKey === key) {
            // Toggle direction if same key is clicked
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new key and default to ascending
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    // Sort submissions based on sortKey and sortDirection
    const sortedSubmissions = useMemo(() => {
        if (!submissions) return [];
        if (!sortKey) return submissions;
        
        const sorted = [...submissions].sort((a, b) => {
            let valA, valB;

            if (sortKey === 'created_at') {
                // Explicitly compare dates
                valA = a.created_at ? new Date(a.created_at).getTime() : -Infinity; 
                valB = b.created_at ? new Date(b.created_at).getTime() : -Infinity; 
            } else {
                // Handle dynamic fields, checking for null/undefined
                valA = a.form_data?.[sortKey];
                valB = b.form_data?.[sortKey];

                // Treat null/undefined consistently (e.g., place them at the bottom when ascending)
                if (valA == null && valB == null) return 0;
                if (valA == null) return sortDirection === 'asc' ? -1 : 1; 
                if (valB == null) return sortDirection === 'asc' ? 1 : -1; 

                // Attempt numeric comparison if both are numbers
                const numA = Number(valA);
                const numB = Number(valB);
                if (!isNaN(numA) && !isNaN(numB)) {
                    valA = numA;
                    valB = numB;
                } else {
                     // Fallback to locale-aware string comparison
                    valA = String(valA).toLowerCase(); 
                    valB = String(valB).toLowerCase();
                }
            }

            // Comparison logic
            if (valA < valB) {
                return sortDirection === 'asc' ? -1 : 1;
            } 
            if (valA > valB) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        return sorted;
    }, [submissions, sortKey, sortDirection]);

    const breadcrumbItems = [
        { label: "Forms", href: "/forms" },
        { label: template?.name || "Form", href: `/forms/${templateId}` },
        { label: "Submissions" }
    ];

    if (loading) return <div>Loading submissions...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    // Ensure fields are loaded before rendering table body dependent on them
    const fieldKeys = fields.map(f => f.internal_key); // Get keys for data access

    return (
        <div className="space-y-6">
             <Breadcrumbs items={breadcrumbItems} />
             <h1 className="text-2xl font-semibold">Submissions for: {template?.name || 'Form'}</h1>

            <Table>
                <TableCaption>
                    {submissions.length === 0 ? "No submissions found for this form yet." : `A list of ${submissions.length} submission(s).`}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        {/* Submitted At Header (Sortable) */} 
                        <TableHead 
                            className="w-[200px] cursor-pointer hover:bg-muted/50" 
                            onClick={() => handleSort('created_at')}
                        >
                           <div className="flex items-center space-x-1">
                               <span>Submitted At</span>
                               {sortKey === 'created_at' && <ArrowUpDown className="h-3 w-3" />} 
                           </div>
                        </TableHead>
                        
                        {/* Dynamic Field Headers (Sortable) */} 
                        {fields.map(field => (
                            <TableHead 
                                key={field.id} 
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleSort(field.internal_key)} // Sort by internal_key
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{field.label}</span>
                                    {sortKey === field.internal_key && <ArrowUpDown className="h-3 w-3" />} 
                                </div>
                            </TableHead>
                        ))}
                        
                        {/* Actions Header (Not Sortable) */} 
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {/* Use sortedSubmissions for rendering */}
                    {sortedSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                            {/* Submitted At Cell */} 
                            <TableCell className="font-medium">
                                {format(new Date(submission.created_at), 'PPPpp')}
                            </TableCell>
                            {/* Dynamic Data Cells */} 
                            {fieldKeys.map(key => {
                                const value = submission.form_data?.[key];
                                return (
                                    <TableCell key={`${submission.id}-${key}`}>
                                        {value !== null && value !== undefined && value !== '' ? String(value) : <span className="text-gray-400">(empty)</span>}
                                    </TableCell>
                                );
                            })}
                            {/* Actions Cell */} 
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    title="View Full Submission Details" // Add title for clarity
                                    onClick={() => router.push(`/submissions/${submission.id}`)}
                                >
                                    <Eye className="h-4 w-4" /> 
                                    {/* Optionally remove text if only icon is desired */}
                                    {/* <span className="sr-only">View</span> */}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 