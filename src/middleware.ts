import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import type { Database } from '@/lib/database.types'; // Optional: If you have database types

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  // Optional: Pass Database type if defined
  const supabase = createMiddlewareClient({ req, res });
  // const supabase = createMiddlewareClient<Database>({ req, res });

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const { data: { session } } = await supabase.auth.getSession(); // Get session data

  const { pathname } = req.nextUrl;

  // Log session status for debugging
  console.log(`Middleware accessed path: ${pathname}, Session found: ${!!session}`);

  // === Protect the home route ===
  // If user is not logged in and tries to access the root path, redirect to login
  if (!session && req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    return NextResponse.redirect(redirectUrl);
  }
  // ============================

  // If no session and trying to access protected routes (e.g., /forms/**)
  // Adjust the path check as needed (e.g., if all routes in (app) are protected)
  if (!session && pathname.startsWith('/forms')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set(`redirectedFrom`, pathname); // Optional: add redirect info
    console.log(`Redirecting unauthenticated user from ${pathname} to /login`);
    return NextResponse.redirect(redirectUrl);
  }

  // Optional: Redirect logged-in users away from auth pages
  if (session && (pathname === '/login' || pathname === '/signup')) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/'; // Redirect to home/dashboard
      console.log(`Redirecting authenticated user from ${pathname} to /`);
      return NextResponse.redirect(redirectUrl);
  }

  // Optional: Redirect logic can be added here later
  // e.g., redirect to /login if user is not logged in and trying to access protected routes
  // e.g., redirect to /dashboard if user is logged in and trying to access /login or /signup

  return res;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /* Match only paths that require session checking or redirection logic */
    '/',             // Check root path for redirection if not logged in
    '/forms/:path*', // Protect the authenticated /forms section
    '/login',        // Run on login to redirect if already logged in
    '/signup',       // Run on signup to redirect if already logged in (if you have signup)
    // Add any other specific authenticated paths here
    // DO NOT include '/form/:path*'
  ],
}; 