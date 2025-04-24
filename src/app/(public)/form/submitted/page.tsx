"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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