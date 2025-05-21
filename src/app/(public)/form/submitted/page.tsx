"use client";

import React from 'react';
// import Link from 'next/link'; // Remove unused import
import { CheckCircle } from 'lucide-react';
// import { Button } from '@/components/ui/button'; // Remove unused import

// File Purpose: This page thanks users after they submit a public form, confirming their submission was received.
// Last updated: 2025-05-21

export default function SubmissionSuccessPage() {
  return (
    <div className="text-center space-y-6">
      <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
      <h1 className="text-2xl font-semibold">Submission Received!</h1>
      <p className="text-muted-foreground">
        Thank you for submitting the form.
      </p>
      {/* Optional: Add a link back to a homepage or another action */}
      {/* 
      <Button variant="outline" asChild>
        <Link href="/">Back to Home</Link> 
      </Button>
      */}
    </div>
  );
} 