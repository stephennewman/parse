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
    - `date-fns` (For date formatting)
- [x] **Supabase Setup:**
    - Project created (`vtfogatscubywmphbuok`).
    - Email Authentication provider enabled.
    - Database Tables Created: `form_templates`, `form_fields`, `form_submissions`.
    - RLS policies enabled & configured (including `auth.uid()` default for `user_id`).
    - Basic Row Level Security (RLS) policies applied for user data isolation.
- [x] **Environment Variables:** `.env.local` created in project root (Requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `OPENAI_API_KEY`).
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
- [x] **Capture Page Structure (`/capture/[id]`):** Created basic page structure and data fetching. *(Completed as part of Phase 3)*

## Phase 3 Progress (Voice Capture & Processing - [Date: 2024-08-26])

- [x] **Microphone Access & Recording (`/capture/[id]`):**
    - Implemented microphone permission request using `navigator.mediaDevices.getUserMedia`.
    - Added recording logic using `MediaRecorder` API.
    - Handled recording states (idle, requesting, recording, stopped, denied, error).
    - Added state management using `useState` and `useRef`.
    - Implemented cleanup logic.
- [x] **Transcription API Route (`/api/transcribe`):**
    - Created API route to handle audio blob uploads.
    - Integrated `openai` library to call Whisper API (`whisper-1`).
    - Handled temporary file storage and cleanup for API interaction.
    - Added error handling and environment variable checks.
- [x] **Parsing API Route (`/api/parse`):**
    - Created API route to handle transcription + field definition uploads.
    - Integrated `openai` library to call Chat Completions API (`gpt-4o-mini`).
    - Constructed dynamic prompts based on form fields.
    - Enabled JSON mode for structured output.
    - Added error handling.
- [x] **Capture Page Integration (`/capture/[id]`):**
    - Added state management for transcription and parsing processes (`ProcessingState` enum).
    - Implemented logic to call `/api/transcribe` and `/api/parse`.
    - Updated UI to display results (populating form fields with parsed data).
    - Made form fields editable after parsing.
    - Implemented dynamic loading messages and icon (`BrainCircuit`) during processing.
- [x] **Workflow Streamlining:**
    - Automated transcription and parsing steps upon clicking "Stop Recording".
    - Removed intermediate "Transcribe" and "Parse" buttons.
- [x] **Save Submission Logic (`/capture/[id]`):**
    - Implemented `handleSaveSubmission` function.
    - Fetched user session using Supabase auth helpers.
    - Inserted results (`user_id`, `template_id`, `form_data`) into `form_submissions` table.
    - Handled success/error states with toasts.
- [x] **View Submission Page (`/submissions/[id]`):**
    - Created dynamic route to display details of a saved submission.
    - Fetched submission data, template name, and field definitions from Supabase.
    - Displayed saved data in a read-only format using field labels.
    - Added breadcrumbs for navigation.
    - Added `date-fns` dependency for timestamp formatting.
- [x] **Post-Save Redirect:**
    - Modified `handleSaveSubmission` to retrieve the new submission ID.
    - Redirected user to the `/submissions/[id]` page upon successful save.

## Notes / Troubleshooting

*   **[Update Date: 2024-08-26] V1 Voice Capture Complete:** Implemented end-to-end flow for recording voice, transcribing with Whisper, parsing with GPT, reviewing/editing results, saving to DB, and viewing the saved submission. Streamlined the processing steps after recording stop. Added dynamic loading indicators.
*   **[Update Date: 2024-08-26] Dependency Added:** Installed `date-fns` for formatting submission timestamps.
*   **[Update Date: 2024-08-26] DB Schema Fix:** Corrected Supabase insert call in `handleSaveSubmission` to use `form_data` column name instead of `data`.
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