# Parse Project Documentation

**AI Assistant Instructions:**
*   **Read Newest First:** Please review this document starting from the most recent entries (usually at the top of sections like "Notes / Troubleshooting") to get the latest context before proceeding.
*   **Use Dates:** Pay attention to the dates associated with notes to understand the timeline of decisions and issues.
*   **Update Frequently:** This document should be updated regularly as development progresses.

---

This document serves as a running log for the voice-to-form SaaS project. It provides context for ongoing development and future conversations.

**Project Goal:** Build a SaaS platform enabling users to define forms, capture voice input, parse it into structured data using AI, verify, save, and potentially export the data.

**User Preference:** Aim for frequent deployments to Vercel as features are completed.

## Phase 1 Progress (Foundation & Setup)

- [x] **Project Initialization:** Next.js project created (initially nested in `voice-parser-app`, then moved to root `parse` directory).
- [x] **Dependencies Installed:**
    - `@supabase/supabase-js`
    - `openai`
    - `react@latest` (v19)
    - `next@latest` (v15)
    - `@supabase/ssr` (Initially installed, caused runtime errors - `TypeError: createClientComponentClient is not a function` - likely due to Next.js 15/React 19 incompatibility. Uninstalled.)
    - `@supabase/auth-helpers-nextjs` (**Currently installed** as a temporary workaround for auth.)
    - `geist` (Font)
- [x] **Supabase Setup:**
    - Project created (`vtfogatscubywmphbuok`).
    - Email Authentication provider enabled.
    - Database Tables Created: `form_templates`, `form_fields`, `form_submissions`.
    - Basic Row Level Security (RLS) policies applied for user data isolation.
- [x] **Environment Variables:** `.env.local` created in project root.
- [x] **Version Control:** Setup and initial push completed.
- [x] **UI Library:** `shadcn/ui` initialized (components: button, card, input, label).
- [x] **`tsconfig.json`:** Path aliases (`@/*`, `~/*`) configured.
- [x] **`next.config.ts`:** Created/updated for Next.js 15.
- [x] **Basic Layout:** `src/app/layout.tsx` updated (using Geist font).
- [x] **Authentication UI:**
    - `src/app/(auth)/login/page.tsx` created (structure only).
    - `src/app/(auth)/signup/page.tsx` created and updated to use `auth-helpers`.
- [ ] **Login Page Logic:** Update login page to use `auth-helpers`.
- [ ] **Supabase Middleware:** Add middleware for session management.

## Notes / Troubleshooting

*   **[2024-08-23] Supabase Library Inconsistency:** Currently, the Sign Out button (`src/components/layout/AppLayout.tsx`) uses the `createClient` utility (`src/lib/supabase/client.ts`) which relies on `@supabase/ssr`. However, the Login page (`src/app/(auth)/login/page.tsx`) and Middleware (`src/middleware.ts`) use functions from `@supabase/auth-helpers-nextjs` as a workaround for `@supabase/ssr` compatibility issues with Next.js 15/React 19. This mix works for now but should ideally be consolidated later.
*   Encountered significant compatibility issues attempting to use the recommended `@supabase/ssr` package with Next.js 15 and React 19. Errors included failed module resolution and runtime TypeErrors (`createClientComponentClient is not a function`).
*   Troubleshooting included: clean installs, cache clearing, downgrading Next.js/React, downgrading `@supabase/ssr`, switching bundlers (Webpack/Turbopack).
*   **Current Workaround:** Using the deprecated `@supabase/auth-helpers-nextjs` package for client-side auth initialization.
*   Need to update `src/app/(auth)/login/page.tsx` to use `auth-helpers`. (Completed 2024-08-23)
*   Need to implement middleware using `auth-helpers` functions. (Completed 2024-08-23)

## AI Development Guidelines

- Before writing or modifying code, please ensure you have an up-to-date understanding of the codebase structure. If necessary, index or review key folders (like `src/components`, `src/app`, `src/lib`) to gain context.

---
*(This document will be updated frequently)* 