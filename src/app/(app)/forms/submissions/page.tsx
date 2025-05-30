"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, ListChecks } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface Submission {
  id: string;
  created_at: string;
  template_id: string;
  user_id: string | null;
  form_templates: {
    name: string;
  } | null;
}

export default function AllSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.user) {
            throw new Error("User not authenticated.");
        }

        const { data, error: fetchError } = await supabase
          .from('form_submissions')
          .select(`
            id,
            created_at,
            template_id,
            user_id,
            form_templates!inner ( name )
          `)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setSubmissions((data as unknown as Submission[]) || []);
      } catch (err) {
        console.error("Error fetching submissions:", err);
        setError("Failed to load submissions. Please try again later.");
        toast.error("Failed to load submissions. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Forms', href: '/forms' },
        { label: 'Submissions' }
      ]} />
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-4"><ListChecks className="text-blue-600" size={28} /> Submissions</h1>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2">Loading submissions...</span>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 py-10">
          <p>Error loading submissions: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <Table>
          <TableCaption>A list of all your form submissions.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Template Name</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.length > 0 ? (
              submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.form_templates?.name ?? 'Unknown Template'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(submission.created_at), 'PPpp')} 
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/forms/submissions/${submission.id}`}>
                         <FileText className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 py-10">
                  No submissions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 