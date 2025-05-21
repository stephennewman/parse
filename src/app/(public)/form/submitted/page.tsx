"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// File Purpose: This page thanks users after they submit a public form, confirming their submission was received.
// Last updated: 2025-05-21

export default function SubmissionSuccessPage() {
  const searchParams = useSearchParams();
  const formId = searchParams?.get('form') ?? '';
  return (
    <div className="text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h1 className="text-2xl font-semibold">Submission Received!</h1>
      <p className="text-muted-foreground">
        Thank you for submitting the form.
      </p>
      {formId && (
        <p>
          To submit another one,{' '}
          <Link href={`/form/${formId}`} className="text-blue-600 underline">click here</Link>.
        </p>
      )}
    </div>
  );
} 