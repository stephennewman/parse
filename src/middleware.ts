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
  await supabase.auth.getSession();

  // Optional: Redirect logic can be added here later
  // e.g., redirect to /login if user is not logged in and trying to access protected routes
  // e.g., redirect to /dashboard if user is logged in and trying to access /login or /signup

  return res;
}

// Ensure the middleware is only called for relevant paths.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 