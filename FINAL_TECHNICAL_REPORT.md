# REBOUND — Final Technical Report

**Date:** 1 October 2026  
**Status:** Evidence-first prototype hardening complete; live Gemini/real-document end-to-end validation is pending real inputs and a server-side key.

## Executive summary

REBOUND's existing React 19, TypeScript, Vite, Express, and browser-local architecture has been retained and hardened. The real workspace starts empty, uses submitted assessment evidence for academic metrics, and shows **Not Enough Data** instead of fabricating scores or diagnoses. Fictional Physics examples are confined to the separately labeled Demo Mode; a source scan found no Physics references in the real-workspace source tree.

Two final correctness/UX fixes were added during acceptance verification: subject-level improvement now compares mark aggregates grouped by actual assessment ID/date instead of comparing a combined subject score with an unrelated topic-history row, and the landing/workspace now explicitly disclose the local-only, no-secure-account hackathon boundary.

**Important validation limit:** no syllabus or marked-test PDF/image was present in the current upload/Downloads directories. The Google Gemini session connector is enabled, but this Express application still needs `GEMINI_API_KEY` in its server environment; the variable is absent. Its AI route correctly returned an explicit `503 AI_UNAVAILABLE`. Therefore a successful real-file OCR/Gemini analysis is not claimed.

## Problems addressed

- Replaced model-supplied mastery percentages with marks-based calculations from earned/possible evidence.
- Consolidated upload/manual assessment intake and normalization through `src/services/testAnalysis.ts`.
- Added validation for question evidence, duplicate question numbers, curriculum references, topic/unit IDs, mark reconciliation, and partial evidence.
- Removed seeded/pretend Physics records from the real workspace; sample data remains in the isolated Demo Mode and is labeled fictional.
- Replaced simulated Google sign-in with a local browser profile; made AI personalization and uploaded-file sharing preferences operational.
- Persisted profile, curriculum, assessment/practice records, recovery plan, coach history, privacy settings, and active navigation in browser storage.
- Kept recovery-plan completion separate from academic mastery: plan checkboxes track completion; mastery changes only with supported practice or assessment evidence.
- Added a premium landing page, clearly labeled sample dashboard illustration, and separate Demo Mode entry.
- Added lazy loading for heavier views and completed the Vite preview-host allowlist/override.
- Fixed subject progress status to compare dated, within-assessment subject mark aggregates, with regression tests for both false and valid improvement.
- Added a prominent workspace banner and landing copy stating that this is a hackathon prototype with browser-only records, no secure accounts/cloud sync, and no use for sensitive student records.

## Evidence and mastery model

### Topic and subject mastery

For sufficient assessment evidence:

`topic mastery = round(100 × sum(earned marks) / sum(possible marks))`

Subject mastery sums eligible marks across evidenced topics rather than averaging topic percentages equally. Untested/insufficiently tested topics display **Not Enough Data**, not `0%`.

Assessment evidence is eligible when it contains at least two question-evidence units or evidence across at least two distinct assessments. Practice contributes only after at least two attempts and ten total questions; its evidence is correct answers over total questions.

Statuses use the centralized thresholds: **Strong ≥80%**, **Developing ≥60%**, **Needs Practice ≥40%**, and **Needs Attention <40%**. **Improving** requires a supported positive comparison. At subject level, entries are first grouped by assessment ID (or date when no ID exists), their earned/possible marks are combined, and the latest dated assessment aggregate is compared to the preceding one. Unrelated topic rows are not treated as successive subject assessments.

Overall mastery is also marks-weighted over sufficiently evidenced topics. Overall improvement compares the latest two dated results *within each subject* and weights those changes by the marks in the compared assessments; subjects with only one result do not contribute a change.

### Assessment integrity

- Numeric results are recalculated from validated question marks, not accepted from model percentages.
- With a confirmed curriculum, evidence must resolve to stable subject/topic/unit IDs; ambiguous name-only matching is rejected.
- A full-test score is shown only when question marks cover the expected evidence and reconcile with overall earned/possible marks. Partial coverage is labeled and does not claim a whole-test score or percentage.
- Invalid, duplicate, unresolvable, or inconsistent rows are excluded or rejected before they can create progress.
- A recovery target must resolve to one validated topic. Recurring mistakes require the same canonical topic/category across distinct assessments.
- Completing a plan step is not mastery evidence.

## Real-file and AI analysis pipeline

`src/services/testAnalysis.ts` is the single frontend normalization/validation path. Upload mode sends actual encoded file bytes and MIME type; a filename alone is not evidence. Supported material includes PDF, JPEG, PNG, WebP, GIF, plain text, and Markdown, subject to an 8 MB file limit. Manual mode requires actual marked feedback or question evidence. Curriculum extraction accepts supported bytes/text and remains a reviewable draft until explicitly confirmed.

The Express/Gemini server validates request sizes/ranges, curriculum structure and unique IDs, historical scores, and model output. PII is stripped from AI profile context; personalized grade/course/history context and uploaded work follow the user's privacy choices. Uploaded work is sent only when the user explicitly runs analysis/extraction with file sharing enabled. Files are not described as local-only once sent to AI.

The browser client bundle was scanned and contains no Gemini/Google API-key references. With no server-side key configured, the coach API returned:

`503 {"error":true,"message":"Gemini AI is not configured on the server.","code":"AI_UNAVAILABLE"}`

This is the intentional unavailable state, not a successful AI result.

## Privacy, persistence, and deployment boundaries

- Workspace records live in this browser's `localStorage`; they survive refresh in the same browser profile but do not sync to another device. This is not secure storage.
- There is no verified login, OAuth identity, server-side student isolation, cloud database, or multi-user account system. The app says so in the landing page, profile view, and workspace banner.
- The privacy controls govern uploaded-file sharing and personalized profile/history context sent to AI. Name/email/school are excluded from the sanitized AI profile context; uploaded assessment content and selected curriculum may still be sent when the user explicitly requests AI analysis.
- Demo Mode contains fictional sample content, makes no AI requests, and saves no demo record to the real workspace.
- The server-side key name is `GEMINI_API_KEY`. The Google Gemini session connector was enabled through the host's connector-authorization flow; that connector does **not** populate this app's server environment. No key is currently present, so the app's AI features remain unavailable until a key is securely configured in a local `.env` or deployment secret manager. Do not paste the key into chat or commit it.
- The server has basic in-memory rate limiting but no authentication or durable abuse controls. **Do not expose Gemini-backed routes to public use for real student records** until access control/API gateway, quotas/monitoring, retention, and education/privacy requirements are reviewed.

## Browser QA and validation

### Completed checks

- `npm install --no-audit --no-fund`: completed, dependencies up to date.
- `npm test`: **15/15 tests passed**, including mark-weighted mastery, insufficient evidence, partial coverage, ID validation, recurring mistakes, and two subject-trend regressions.
- `npm run typecheck`: passed.
- `npm run build`: passed; Vite transformed 2,263 modules.
- Final production preview returned HTTP 200 locally and through the sandbox public route: [Open the temporary REBOUND preview](https://4175-il5p7cyslaq8szg9mu3kg-baa14ec9.us1.manus.computer/). This is a temporary sandbox preview, not a permanent production deployment.
- Production landing page reviewed at desktop width; its Get Started flow opened the profile/curriculum onboarding. Empty optional profile details were left blank; no syllabus or assessment was added.
- Workspace empty states were navigated on Home, Analyze, Analytics, Subjects, Recovery, History, Profile, and AI Coach. The prototype notice remained visible, no horizontal overflow was detected at 1280px, and no runtime errors were observed during the route sweep.
- Empty analysis submission was blocked with **“Choose or enter a subject before analyzing.”** No diagnosis, score, or assessment record was created.
- Refresh preserved the current workspace tab and empty state.
- Final workspace Home and Analyze views were exercised at **390 × 844**. Both had document width equal to viewport width, the prototype notice was visible, and no runtime errors were captured; screenshots were visually reviewed.
- Final Demo Mode was opened on production preview; the dashboard marked content as fictional sample data, stated it does not call AI or save records, and preserved the sample/real-workspace separation.
- The final server-key check returned an explicit 503 without a key. The client `dist/` bundle contained no `GEMINI_API_KEY` or `GOOGLE_API_KEY` references.
- A source scan found Physics only under `src/components/DemoMode/`; no real-workspace Physics seed was found.

### Not claimed / remaining acceptance step

A live uploaded syllabus + marked-test → AI analysis → evidence-linked recovery plan → five-question practice → progress/retest → refresh flow was **not completed**, because no real syllabus/test PDF or image was available in the current attachments and the app's server-side Gemini key was not configured. No assessment data was fabricated to simulate that acceptance path. The regression suite covers deterministic normalization, marks, partial coverage, curriculum IDs, and subject trends, but it does not substitute for a real OCR/model call.

To finish that last check, supply the actual syllabus and marked test and securely configure `GEMINI_API_KEY` for the server. Then confirm the parsed questions/marks/topics against the source pages before using the resulting diagnosis or plan.

## Run and verify locally

Requirements: Node.js 22.12+ (or 20.19+) and npm.

```bash
npm install
cp .env.example .env
# Add GEMINI_API_KEY to .env or a hosting secret manager; never commit or share it in chat.
npm test
npm run typecheck
npm run build
npm start
```

The production server defaults to port `3000` and serves the generated `dist/` assets. For a development preview with a different public hostname:

```bash
PORT=3001 VITE_ALLOWED_HOST='3001-your-preview-host.example' DISABLE_HMR=true npm run dev
```

Keep the Gemini key on the server. Use HTTPS and do not treat browser-local records as a secure account or shared deployment database.

## Key implementation files

- `src/domain/metrics.ts` — marks-based mastery, thresholds, subject trend aggregation, canonical topic matching, practice evidence, and recurring mistakes.
- `src/services/testAnalysis.ts` — unified upload/manual normalization, question validation, mark reconciliation, partial-coverage handling, and validated recovery target selection.
- `server.ts` — Express/Gemini routes, file verification/limits, prompt-context sanitization, model-output validation, and rate limiting.
- `src/context/AppContext.tsx` — browser-local persistence, derived evidence metrics, recovery state, profile, and privacy preferences.
- `src/components/Landing/WelcomeLandingView.tsx` — landing, workspace/demo entry points, illustrative sample label, and prototype disclosure.
- `src/components/DemoMode/DemoMode.tsx` — isolated fictional multi-section demo.
- `src/components/Profile/ProfileView.tsx` — local profile, curriculum workflow, privacy toggles, local-data controls.
- `src/App.tsx` — workspace prototype boundary notice.
- `vite.config.ts` — preview-host allowlist and override.
