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
    - `@supabase/auth-helpers-nextjs` (**Currently installed & standardized**)
    - `geist` (Font)
    - `lucide-react` (Icons)
    - `sonner` (Toast notifications)
- [x] **Supabase Setup:**
    - Project created (`vtfogatscubywmphbuok`).
    - Email Authentication provider enabled.
    - Database Tables Created: `form_templates`, `form_fields`, `form_submissions`.
    - RLS policies enabled & configured (including `auth.uid()` default for `user_id`).
    - Basic Row Level Security (RLS) policies applied for user data isolation.
- [x] **Environment Variables:** `.env.local` created in project root.
- [x] **Version Control:** Setup and initial push completed.
- [x] **UI Library:** `shadcn/ui` initialized (components: button, card, input, label, textarea, separator, select).
- [x] **`tsconfig.json`:** Path aliases (`@/*`, `~/*`) configured.
- [x] **`next.config.ts`:** Created/updated for Next.js 15.
- [x] **Basic Layout:** `src/app/layout.tsx`, `src/app/(app)/layout.tsx` and `src/components/layout/AppLayout.tsx` updated and working (sidebar, content area).
- [x] **Authentication UI:**
    - `src/app/(auth)/login/page.tsx` created (structure only).
    - `src/app/(auth)/signup/page.tsx` created and updated to use `auth-helpers`.
- [x] **Login Page Logic:** Updated to use `auth-helpers`.
- [x] **Supabase Middleware:** Added and configured using `auth-helpers`.
- [x] **UI Enhancements:**
    - Added Breadcrumbs (`src/components/ui/breadcrumbs.tsx`) and implemented on forms pages.
    - Implemented Toast notifications (`sonner`) replacing browser alerts.
    - Refined button placement and styling on `/forms` page.

## Phase 2 Progress (Core Form Management - [Date: 2024-08-23])

- [x] **Create Form UI (`/forms/new`):**
    - Built page structure using `shadcn/ui` components (`Card`, `Input`, `Textarea`, `Select`, etc.).
    - Implemented state management for form title, description, and dynamic fields.
    - Added UI for adding, editing (name/type), and removing form fields.
    - Included validation for required fields (title, field names).
- [x] **Save Form Logic:**
    - Implemented `handleSaveTemplate` function in `src/app/(app)/forms/new/page.tsx`.
    - Correctly inserts data into `form_templates` and `form_fields` using appropriate column names (`name`, `template_id`, `field_type`, etc.).
    - Includes generation of `internal_key` for fields.
    - Redirects to the new form's detail page (`/forms/[id]`) upon successful save.
- [x] **List Forms UI (`/forms`):**
    - Fetches and displays a list of user's created form templates from Supabase.
    *   Shows loading/error states and a message if no forms exist.
    *   Links each form card to its detail page.
- [x] **Form Detail UI (`/forms/[id]`):**
    *   Fetches and displays details (name, description) of a specific form template based on URL ID.
    *   Fetches and displays the associated fields for the template.
    *   Refined header and action buttons (Edit button currently hidden).
- [ ] **Edit Form UI/Logic (`/forms/[id]/edit`):** Implement editing functionality.
- [ ] **Capture Page Structure (`/capture/[id]`):** Created basic page structure and data fetching.

## Notes / Troubleshooting

*   **[Update Date: 2024-08-23] ESLint Fixes:** Resolved several ESLint errors (`no-explicit-any`, `no-unused-vars`, `no-unescaped-entities`) that were causing Vercel build failures.
*   **[Update Date: 2024-08-23] Supabase Library Standardization:** Resolved previous inconsistency. Now using `@supabase/auth-helpers-nextjs` (`createClientComponentClient`, `createMiddlewareClient`) for both client-side operations (forms, sign-out) and middleware, removing reliance on `@/lib/supabase/client.ts` and `@supabase/ssr` methods for authentication context. This resolved issues with `getUser()` failing on client-side navigation.
*   Encountered and resolved RLS `INSERT` violation by setting `auth.uid()` as default for `user_id` columns.
*   Encountered and resolved `NOT NULL` violation for `internal_key` by implementing key generation.
*   Addressed layout issues (sidebar overlap, page content alignment).
*   Addressed routing/layout application bugs related to file placement and missing layout files (`src/app/(app)/layout.tsx`, extra `src/app/(app)/forms/new/layout.tsx`).
*   **[Previous Notes remain below]**
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