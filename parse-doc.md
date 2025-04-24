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

## Phase 4 Progress (Feature Enhancements - [Current Date])

- [x] **Delete Form Template:** 
    - Added a "Delete" button to the form detail page (`/forms/[id]`).
    - Implemented `handleDeleteTemplate` function to delete the template and its associated fields from Supabase after confirmation.
    - Added user feedback (toasts) and redirects upon success/failure.
    - Styled the delete button with a red outline.
- [x] **Bulk Delete Forms:**
    - Added checkboxes to form cards on the main forms list page (`/forms`).
    - Implemented state management for selected forms.
    - Added a "Delete Selected" button that appears when forms are selected.
    - Implemented `handleBulkDelete` function to delete selected templates and their fields after confirmation, using toasts for feedback.
    - Added `Checkbox` component using `shadcn/ui`.
- [x] **New Field Types:**
    - Added support for **Radio Button Group** (`radio`).
        - Updated form editor pages (`new`, `edit`) to manage options.
        - Updated capture page (`renderFieldInput`, `renderFieldHints`) to display radio groups.
        - Updated parsing API prompt (`/api/parse`).
    - Added support for **Multi-Select Checkbox Group** (`multicheckbox`).
        - Updated form editor pages to manage options.
        - Updated `ParsedResults` type to support `string[]`.
        - Updated capture page (`renderFieldInput`, `renderFieldHints`, `handleMultiCheckboxChange`).
        - Updated parsing API prompt.
    - Added support for **Rating Scale** (`rating`).
        - Added `rating_min`, `rating_max` columns to `form_fields` table (User action required).
        - Updated form editor pages to manage min/max values.
        - Updated capture page (`renderFieldInput`, `renderFieldHints`) to display a `Slider` component (`shadcn/ui`).
        - Updated parsing API prompt.
- [x] **Capture Page UI Enhancements:**
    - ~~Separated Review Fields and Transcription into Tabs using `Tabs` component (`shadcn/ui`) during the `Reviewing` phase.~~ (Temporarily removed due to Vercel build issue)
    - Updated the `Prompting` phase instructions to show field hints (options, range, format) alongside labels, similar to the `Recording` phase.

## Notes / Troubleshooting

*   **[Recent Update - Date] Vercel Build Debugging:** Encountered persistent `File ... is not a module` errors for newly added `shadcn/ui` components (`slider.tsx`, `tabs.tsx`) only during Vercel builds, despite correct local code and dependencies. Tried renaming files, clearing cache, and reinstalling dependencies. Temporarily commented out the Tabs UI in the capture page to achieve a successful deployment.
*   **[Recent Update - Date] Capture UI Enhancements:** Added Tabs to the review phase to separate fields and transcription. Updated the prompting phase to show field hints (options, ranges) before recording starts.
*   **[Recent Update - Date] New Field Types:** Implemented Radio Buttons, Multi-Select Checkboxes, and Rating Scale (using `Slider` component).
*   **[Recent Update - Date] Component Dependencies:** Added `Checkbox`, `RadioGroup`, `Slider`, `Tabs`, `Card` components from `shadcn/ui`.
*   **[Recent Update - Date] Backend:** Updated `/api/parse` prompt logic to handle new field types and provide appropriate instructions to the AI.
*   **[Recent Update - Date] Database:** Required adding `rating_min` and `rating_max` (nullable integer) columns to the `form_fields` table.
*   **[Recent Update - Date] RLS Debugging:** Investigated and discussed RLS policy issues related to `INSERT` on `form_submissions` owned by `postgres`. Recommended using Supabase Dashboard UI for policy management.
*   **[Recent Update - Date] Feature Added:** Implemented bulk deletion of form templates from the main forms list page.
*   **[Recent Update - Date] Feature Added:** Implemented functionality to delete form templates from the form detail page, including associated fields.
*   **[Recent Update] UI Fix:** Ensured outline buttons (e.g., Edit, View Submissions on form detail page) display a pointer cursor on hover for better UX by adding `cursor-pointer` class.
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
*   **Form Fields:** Basic text field support within templates, storing label, type, and display order. **Updated to include Radio, Multi-Checkbox, and Rating.**
*   **Submission Tracking:**
    *   Viewing a list of submissions for a specific form template (`/forms/[id]/submissions`).
*   **Capture Page Functionality:**
    *   Implement voice recording using the browser's MediaRecorder API.
    *   Integrate with a transcription service (e.g., Deepgram, AssemblyAI, OpenAI Whisper).
    *   Display the final transcript.
    *   Develop the UI/UX for associating spoken words/phrases with specific form fields.
    *   Implement the logic to save the structured `form_data` along with the transcript/audio link to the `form_submissions` table.
*   **Enhanced Form Fields:** Support for more field types (e.g., dropdown, checkbox, date, number) in the template editor and capture page. **(Radio, Multi-Checkbox, Rating added)**
*   **Global Submissions View:** Create a page (`/submissions`) to view and potentially filter/search *all* submissions across different forms. Consider server-side pagination/sorting for scalability.
*   **Dashboard/Analytics:** An overview page showing usage statistics, recent submissions, etc.

## AI Development Guidelines

- Before writing or modifying code, please ensure you have an up-to-date understanding of the codebase structure. If necessary, index or review key folders (like `src/components`, `src/app`, `src/lib`) to gain context.

## Project Status Summary

### Completed Features:

*   **Core Application Layout:** Implemented a standard SaaS layout (`AppLayout`) with a sidebar and header using Next.js.
*   **Authentication:** Integrated Supabase for user authentication (login, signup, session management).
*   **Form Template Management:**
    *   Creation of new form templates (`/forms/new`) with name and description.
    *   Listing existing form templates (`/forms`).
    *   Detailed view of individual form templates (`/forms/[id]`) showing name, description, and associated fields.
    *   Editing existing form templates (`/forms/[id]/edit`), including adding, removing, and reordering fields.
*   **Form Fields:** Basic text field support within templates, storing label, type, and display order. **Updated to include Radio, Multi-Checkbox, and Rating.**
*   **Submission Tracking:**
    *   Viewing a list of submissions for a specific form template (`/forms/[id]/submissions`).
    *   The submissions list displays data dynamically based on the template's fields.
    *   Client-side sorting implemented for the submissions table by clicking column headers.
    *   Viewing details of an individual submission (`/submissions/[id]`).
*   **Capture Page Access:**
    *   Generated a unique capture URL for each form template.
    *   Added a "View Form" button on the form detail page to open the capture link in a new tab.
*   **UI/UX:**
    *   Utilized `shadcn/ui` for components (Cards, Buttons, Tables, Input, Label, Toasts, etc.).
    *   Implemented Breadcrumbs for better navigation.
    *   Added toast notifications for user feedback (e.g., link copied).
*   **Basic Capture Page:** Set up the route and basic structure for the voice capture page (`/capture/[id]`).

### Potential Next Steps / Areas for Development:

*   **Core Parsing Logic:** Implement the primary feature: processing transcribed voice input and mapping it to the structured fields defined in the form template. This likely involves AI/NLP integration.
*   **Capture Page Functionality:**
    *   Implement voice recording using the browser's MediaRecorder API.
    *   Integrate with a transcription service (e.g., Deepgram, AssemblyAI, OpenAI Whisper).
    *   Display the final transcript.
    *   Develop the UI/UX for associating spoken words/phrases with specific form fields.
    *   Implement the logic to save the structured `form_data` along with the transcript/audio link to the `form_submissions` table.
*   **Enhanced Form Fields:** Support for more field types (e.g., dropdown, checkbox, date, number) in the template editor and capture page. **(Radio, Multi-Checkbox, Rating added)**
*   **Global Submissions View:** Create a page (`/submissions`) to view and potentially filter/search *all* submissions across different forms. Consider server-side pagination/sorting for scalability.
*   **Dashboard/Analytics:** An overview page showing usage statistics, recent submissions, etc.
*   **Template/Submission Management:** Add functionality to delete form templates and individual submissions.
*   **User Management:** Implement roles or permissions if required for multi-user scenarios.
*   **Error Handling & Robustness:** Improve error handling across the application and add more comprehensive loading states.
*   **Testing:** Implement unit and integration tests.
*   **Deployment:** Configure deployment pipelines (e.g., to Vercel).
*   **UI Refinements:** Continue polishing the user interface and experience.
*   **`/forms` Page Enhancements:** Implement sorting/filtering or a table view for the main forms list page, as previously discussed.

---
*(This document will be updated frequently)* 