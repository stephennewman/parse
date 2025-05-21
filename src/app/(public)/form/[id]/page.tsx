"use client";

import React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import CaptureForm from '@/components/CaptureForm'; // <<< Import the shared component

// File Purpose: This page allows anyone (even without an account) to fill out a form using their voice, making it easy to collect data from the public.
// Last updated: 2025-05-21

// This page renders the form publicly, without the app layout
export default function PublicCapturePage() {
  const params = useParams();
  const router = useRouter(); // Router is still needed for the CaptureForm component
  const searchParams = useSearchParams();
  const id = params?.id as string | undefined;
  const entryMode = searchParams.get('entryMode') === 'voice' ? 'voice' : undefined;

  if (!id) {
    // Handle case where ID is missing
    return <div>Error: Form ID is missing.</div>;
  }

  return (
    <CaptureForm 
      formId={id} 
      isPublic={true} // This is the public version
      router={router} 
      defaultEntryMode={entryMode}
    />
  );
} 