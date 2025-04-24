"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import CaptureForm from '@/components/CaptureForm'; // <<< Import the shared component

// This page renders the form publicly, without the app layout
export default function PublicCapturePage() {
  const params = useParams();
  const router = useRouter(); // Router is still needed for the CaptureForm component
  const id = params.id as string;

  if (!id) {
    // Handle case where ID is missing
    return <div>Error: Form ID is missing.</div>;
  }

  return (
    <CaptureForm 
      formId={id} 
      isPublic={true} // This is the public version
      router={router} 
    />
  );
} 