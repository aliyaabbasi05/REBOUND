# REBOUND — Academic Recovery & Progress Coach

REBOUND turns a student's **confirmed course map and marked assessments** into an evidence-based recovery workflow: upload → diagnose → map to topics → practise → track progress. It uses the existing React/Vite/Express architecture and Gemini API integration; it is not an authentication or cloud-sync service.

## Run locally

**Requirements:** Node.js 22.12+ (or 20.19+), npm.

```bash
npm install
cp .env.example .env
# Add your Gemini API key to .env; keep the file private and out of version control.
npm run dev
```

The app runs on the port printed by the server (the default is `3000`). AI-backed analysis, curriculum extraction, practice generation, and coaching require `GEMINI_API_KEY`. Without a key, the app should show a transparent unavailable state and must not generate mock academic conclusions.

## Verify and build

```bash
npm test          # domain-level evidence/status regression tests
npm run typecheck # TypeScript
npm run build     # production assets in dist/
npm start         # serve the production build after building
```

## Student data and privacy

This version keeps profile and learning records in the current browser's `localStorage`; it does **not** provide verified Google login, cloud synchronization, multi-user isolation, or a server database. AI features send the explicitly submitted course/test evidence to Gemini through the server. Use only records you are authorized to process, avoid unnecessary identifying information, and do not use sensitive student data until your hosting, provider, access-control, retention, and education-privacy requirements have been reviewed.

In **Profile → AI & Privacy Controls**, personalized context can be disabled; this omits profile grade/course and prior academic/chat context from AI requests (the assessment's selected curriculum remains necessary for topic mapping). Uploaded-file sharing can separately be disabled. With personalization off, coaching sends only the latest user question, not earlier chat turns. Pasted text remains a separate, explicit submission. The optional profile email is not included in AI prompts.

Inline uploads are limited to 8 MB and support PDF, JPEG, PNG, WebP, GIF, plain text, and Markdown. Text is submitted as text; PDF/image bytes are sent only when the user explicitly runs an AI action and file sharing is allowed. A filename alone is never treated as test evidence. Insufficiently legible or incomplete content should produce “Not Enough Data,” not a guessed diagnosis.

**Before public hosting:** the AI endpoints have a basic in-memory IP rate limit but no user authentication, durable abuse controls, or multi-user boundary. Do not expose the Gemini-backed server publicly until you add an appropriate authentication/API gateway and deployment-level quotas and monitoring.

## Configuration

- `GEMINI_API_KEY` — server-side Gemini key required for AI features.
- `PORT` — optional server port (default `3000`).
- `.env.example` documents the local environment file; never commit `.env` or share API keys.
