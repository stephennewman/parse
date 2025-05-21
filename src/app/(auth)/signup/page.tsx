'use client';

import React, { useState } from 'react';
import Link from 'next/link'; // Import Link for navigation
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; // Import from auth-helpers
// import { createClient } from '@/lib/supabaseClient'; // Revert to using ssr helper directly
import { Button } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import Image from 'next/image';
// import type { Database } from '@/lib/database.types';

// File Purpose: This page lets new users create an account to start using the platform.
// Last updated: 2025-05-21

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  // Initialize using the imported function (which is now from auth-helpers)
  const supabase = createClientComponentClient();

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {},
    });

    if (error) {
      setMessage(`Signup failed: ${error.message}`);
    } else {
      // You might want to show a message asking the user to check their email
      // if email confirmation is enabled in Supabase settings.
      setMessage('Signup successful! Check your email for confirmation link (if enabled).');
      // Optionally redirect to login or a confirmation page
      // router.push('/login');
      router.refresh(); // Refresh might still be useful
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img
        src="https://blog.krezzo.com/hs-fs/hubfs/Krezzo-Logo-2023-Light.png?width=3248&height=800&name=Krezzo-Logo-2023-Light.png"
        alt="Parse Logo"
        className="h-16 w-auto mx-auto mb-6"
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your email and password to create an account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Consider adding minLength requirement
              />
            </div>
            {message && (
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start">
            <Button type="submit" className="w-full mb-4">
              Create account
            </Button>
            <div className="text-center text-sm w-full">
              Already have an account?{' '}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 