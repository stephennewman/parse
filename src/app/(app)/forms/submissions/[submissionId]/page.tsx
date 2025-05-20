"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Submission {
  id: string;
  created_at: string;
  template_id: string;
  user_id: string | null;
  form_templates: {
    name: string;
  } | null;
}

export default function SubmissionPage() {
  const params = useParams() as Record<string, string>;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('form_submissions')
          .select(`
            id,
            created_at,
            template_id,
            user_id,
            form_templates!inner ( name )
          `)
          .eq('id', params.submissionId)
          .single();
        if (fetchError) throw fetchError;
        // If form_templates is an array, take the first element
        let fixedData = data as unknown as Submission;
        if (fixedData && Array.isArray((fixedData as any).form_templates)) {
          fixedData = {
            ...fixedData,
            form_templates: (fixedData as any).form_templates[0] || null,
          };
        }
        setSubmission(fixedData);
      } catch (err: any) {
        setError(err.message || 'Failed to load submission.');
      } finally {
        setLoading(false);
      }
    };
    if (params.submissionId) fetchSubmission();
  }, [params.submissionId, supabase]);

  if (loading) return <div>Loading submission...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!submission) return <div>No submission found.</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Submission Details</h1>
      <div><strong>ID:</strong> {submission.id}</div>
      <div><strong>Created At:</strong> {submission.created_at}</div>
      <div><strong>Template ID:</strong> {submission.template_id}</div>
      <div><strong>User ID:</strong> {submission.user_id ?? 'N/A'}</div>
      <div><strong>Template Name:</strong> {submission.form_templates?.name ?? 'Unknown'}</div>
    </div>
  );
} 