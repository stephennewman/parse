"use client";
import { useParams } from 'next/navigation';

export default function SubmissionPage() {
  const params = useParams() as Record<string, string>;
  if (!params) throw new Error('Missing route params');

  return (
    <div>
      Submission ID: {params.submissionId}
    </div>
  );
} 