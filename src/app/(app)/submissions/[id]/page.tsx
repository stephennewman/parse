"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { format } from 'date-fns'; // For formatting timestamp

// File Purpose: This page shows the details of a specific form submission, including all the data that was captured and saved.
// Last updated: 2025-05-21

// Define types (can be moved to a shared types file later)
interface Submission {
    id: string;
    template_id: string;
    form_data: Record<string, string | number | null>;
    created_at: string;
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

export default function SubmissionDetailPage() {
    const params = useParams();
    const submissionId = params?.id as string | undefined;

    // All hooks must be called unconditionally at the top
    const supabase = createClientComponentClient();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [template, setTemplate] = useState<FormTemplate | null>(null);
    const [fields, setFields] = useState<FormField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubmissionDetails = async () => {
            if (!submissionId) return;
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch the submission data
                const { data: subData, error: subError } = await supabase
                    .from('form_submissions')
                    .select('id, template_id, form_data, created_at')
                    .eq('id', submissionId)
                    .single();

                if (subError) throw new Error(`Failed to fetch submission: ${subError.message}`);
                if (!subData) throw new Error('Submission not found.');
                setSubmission(subData);

                const templateId = subData.template_id;

                // 2. Fetch the template name
                const { data: tData, error: tError } = await supabase
                    .from('form_templates')
                    .select('id, name')
                    .eq('id', templateId)
                    .single();
                
                if (tError) throw new Error(`Failed to fetch form template: ${tError.message}`);
                if (!tData) throw new Error('Associated form template not found.');
                setTemplate(tData);

                // 3. Fetch the ordered fields for the template
                const { data: fData, error: fError } = await supabase
                    .from('form_fields')
                    .select('id, label, internal_key, display_order')
                    .eq('template_id', templateId)
                    .order('display_order', { ascending: true });

                if (fError) throw new Error(`Failed to fetch form fields: ${fError.message}`);
                setFields(fData || []);

            } catch (err) {
                console.error("Error fetching submission details:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchSubmissionDetails();
    }, [submissionId, supabase]);

    const breadcrumbLinks = [
        { label: 'Home', href: '/' },
        { label: 'Forms', href: '/forms' },
        { label: 'Submissions', href: '/forms/submissions' },
        { label: "Details", isCurrent: true },
    ];

    // Only do conditional rendering after all hooks
    if (!submissionId) {
        return <div>Error: Submission ID is missing.</div>;
    }

    if (loading) return <div>Loading submission details...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;
    if (!submission || !template) return <div>Submission data could not be fully loaded.</div>;

    return (
        <div className="space-y-6">
            <Breadcrumbs items={breadcrumbLinks} />
            <Card>
                <CardHeader>
                    <CardTitle>Submission for: {template.name}</CardTitle>
                    <CardDescription>
                        Captured on: {format(new Date(submission.created_at), 'PPPpp')} 
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h3 className="text-lg font-medium">Submitted Data</h3>
                    {fields.length > 0 ? (
                        fields.map(field => {
                            const value = submission.form_data[field.internal_key];
                            return (
                                <div key={field.id} className="grid grid-cols-3 gap-4 items-start">
                                    <span className="text-sm font-medium text-gray-600 col-span-1">{field.label}:</span>
                                    <span className="text-sm text-gray-900 col-span-2 whitespace-pre-wrap">
                                        {value !== null && value !== undefined && value !== '' ? String(value) : <span className="text-gray-400">(empty)</span>}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500">No fields were defined for this form template at the time of submission (or fields couldn&apos;t be loaded).</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 