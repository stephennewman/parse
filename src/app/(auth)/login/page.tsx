'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
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
// We need the Database type if we want type safety with Supabase
// import type { Database } from '@/lib/database.types'; // Assuming you create this file later

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`Login failed: ${error.message}`);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img
        src="https://s3.ca-central-1.amazonaws.com/logojoy/logos/220875599/noBgColor.png?5663.5999999940395"
        alt="Parse Logo"
        className="h-16 w-auto mx-auto mb-6"
      />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4 mb-6">
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
              />
            </div>
            {message && (
              <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
            )}
          </CardContent>
          <CardFooter className="flex-col items-start">
            <Button type="submit" className="w-full mb-4 cursor-pointer">
              Sign in
            </Button>
             <div className="text-center text-sm w-full">
               Don&apos;t have an account?{' '}
               <Link href="/signup" className="underline cursor-pointer">
                 Sign up
               </Link>
             </div>
          </CardFooter>
        </form>
        {/* Optional: Add link to Sign Up page */}
        {/* <div className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <a href="/signup" className="underline">
            Sign up
          </a>
        </div> */}
      </Card>
    </div>
  );
} 