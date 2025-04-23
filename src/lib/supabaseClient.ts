// Reverted: Using @supabase/ssr helper for client components
import { createBrowserClient } from '@supabase/ssr';

// Note: This setup utilizes SSR cookie handling provided by @supabase/ssr.
// Different helpers (createServerComponentClient, createRouteHandlerClient, etc.)
// will be used in their respective contexts.

export function createClient() {
  // Basic client setup using public keys
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
} 