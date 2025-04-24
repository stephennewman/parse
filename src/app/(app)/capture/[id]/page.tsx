"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import CaptureForm from '@/components/CaptureForm'; // <<< Import the new component

// This page now acts as a wrapper for the authenticated view
export default function AuthenticatedCapturePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  if (!id) {
    // Handle case where ID is missing, maybe redirect or show error
    return <div>Error: Form ID is missing.</div>;
  }

  return (
    <CaptureForm 
      formId={id} 
      isPublic={false} // This is the authenticated version
      router={router} 
    />
  );
}