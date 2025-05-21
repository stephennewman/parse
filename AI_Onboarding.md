# AI Onboarding & Activity Log

## Project Overview

**Product Purpose:**
Parse is a SaaS platform that enables users to define custom forms, capture voice input, transcribe and parse it into structured data using AI, verify/edit, save, and export the data. It is designed for rapid, voice-driven data entry and workflow automation, with a focus on food safety, compliance, and reporting use cases.

**Main Features:**
- User authentication (Supabase)
- Form template creation, editing, and management
- Dynamic form fields (text, radio, multi-checkbox, rating, etc.)
- Voice capture and transcription (OpenAI Whisper)
- AI-powered parsing of transcriptions into structured form data (OpenAI GPT)
- Submission saving and review
- Public and authenticated form capture
- Dashboard with stats and recent activity
- Bulk and individual deletion of forms
- UI/UX enhancements (breadcrumbs, toasts, sidebar, etc.)

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Supabase (DB, Auth, RLS)
- OpenAI (Whisper, GPT)
- shadcn/ui (UI components)
- Vercel (deployment)
- date-fns, lucide-react, sonner, framer-motion, recharts (charts)

**Current Status (as of 2024-09-01):**
- Core features (form creation, voice capture, parsing, submission, dashboard) are implemented and deployed.
- UI/UX is modern and consistent.
- Public form capture and anonymous submissions are supported.
- Build and lint pass on Vercel.
- Next major task: Bluetooth printer integration (scaffolded, not yet implemented).

## Recent Major Changes
- 2024-09-01: Dashboard visual overhaul, chart integration, build compliance.
- 2024-08-29: Labels & food labeling system enhancements, workflow improvements.
- 2024-08-28: Public form login issue resolved, middleware matcher fixed, RLS policies verified, mobile audio recording fix.
- 2024-08-27: Public form submission, dashboard & UI updates, Vercel build debugging.
- 2024-08-26: V1 voice capture complete, DB schema fix, dependency updates.
- 2024-08-23: ESLint fixes, Supabase library standardization, RLS debugging.

## Open TODOs / Next Steps
- Bluetooth printer integration (Printer Integration page)
- Edit form UI/logic (`/forms/[id]/edit`)
- Global submissions view with filtering/search
- Dashboard analytics enhancements
- User management/roles (if needed)
- Error handling, robustness, and testing
- Ongoing UI/UX refinements

## AI Activity Log

### 2024-06-10T[AI] Onboarding & Codebase Indexing (America/New_York)
- Read README.md and parse-doc.md for project context
- Indexed src/app, src/components, src/lib directories
- Summarized product, features, tech stack, and status
- Logged recent changes and open TODOs
- Created this AI_Onboarding.md file for future updates

## Deployment Log

### 2024-05-21 (America/New_York)
- **fix: move submission detail page to correct /forms/submissions/[id] route and update view button**
    - Problem: Clicking the "View" button in the submissions list resulted in a 404 because the detail page was not in the correct route directory.
    - Solution: Moved the detail page to `src/app/(app)/forms/submissions/[id]/page.tsx` and updated the button to link to `/forms/submissions/[id]`. Removed the old route.
    - Result: Users can now view individual submission details from the submissions list as expected.

---
*Continue to update this log with each major AI-driven change, deploy, or analysis.* 