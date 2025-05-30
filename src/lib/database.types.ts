// File Purpose: This file defines the types and structure of the database, helping the app and Supabase work together safely and correctly.
// Last updated: 2025-05-21

// --- CMS MVP Types ---
export interface Site {
  id: string;
  user_id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
  theme?: string;
  published_at?: string;
}

export interface Page {
  id: string;
  site_id: string;
  title: string;
  slug: string;
  content_blocks: any; // JSON structure for sections/blocks
  order: number;
}
