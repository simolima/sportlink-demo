# Sprinta — Social Platform for Athletes & Clubs

**Sprinta** is a dual-platform social networking application for athletes, clubs, agents, and sports professionals. It lets users connect, share career experiences, manage rappresentations, discover opportunities, and message each other — all in one place.

- **Web App**: Next.js 14 (App Router) + React 18 + Tailwind CSS / DaisyUI
- **Mobile App**: Expo + React Native (iOS & Android)
- **Backend**: Supabase PostgreSQL + Supabase Storage + Supabase Auth
- **Deploy**: Vercel (web) + Supabase (backend)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Required for Next.js and Expo CLI |
| pnpm | Latest | `npm install -g pnpm` |
| Supabase account | — | Create a project at [supabase.com](https://supabase.com) |
| Expo Go | Latest | Install on your phone for mobile development |

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # Required for admin API routes
```

---

## Getting Started

### Install Dependencies

```bash
# Web dependencies
pnpm install

# Mobile dependencies (isolated — must be done separately)
cd mobile
pnpm install
cd ..
```

### Start the Web App

```bash
pnpm dev
# → http://localhost:3000
```

### Start the Mobile App

The mobile app requires the web server to be running (it calls the Next.js API routes).

```bash
# Terminal 1 — Web server (API)
pnpm dev

# Terminal 2 — Expo Metro Bundler
pnpm dev:mobile
# → Scan QR code with Expo Go on your phone
```

The mobile app auto-detects the local server IP via Expo SDK (`Constants.expoConfig?.hostUri`) — no manual IP configuration needed.

---

## Available Scripts

```bash
# Development
pnpm dev              # Start Next.js dev server (port 3000)
pnpm dev:mobile       # Start Expo Metro Bundler

# Build & Production
pnpm build            # Build Next.js for production
pnpm start            # Start Next.js production server

# Quality
pnpm lint             # Run ESLint

# Testing
pnpm test             # Run all tests (once)
pnpm test:watch       # Run tests in watch mode
pnpm test:coverage    # Run tests with coverage report
```

---

## Project Structure

```
sprinta/
├── app/
│   ├── (auth)/           # Login, signup
│   ├── (landing)/        # Public landing page
│   ├── (main)/           # Core app (requires auth)
│   ├── (onboarding)/     # New user onboarding
│   └── api/              # Next.js API routes (CORS-enabled, shared with mobile)
├── components/           # React components (all "use client")
├── lib/
│   ├── hooks/useAuth.tsx  # Primary auth hook
│   ├── supabase-server.ts # Server-side Supabase client
│   ├── supabase-browser.ts# Browser-side Supabase client
│   ├── cors.ts            # withCors() + handleOptions() middleware
│   └── types.ts           # Shared TypeScript types
├── mobile/               # Expo app (completely isolated dependencies)
│   ├── screens/
│   ├── lib/
│   └── package.json      # Separate from root package.json
├── supabase/
│   ├── migrations/       # Versioned schema migrations
│   └── scripts/          # Admin/diagnostic SQL scripts
└── CLAUDE.md             # AI agent instructions (see below)
```

---

## Deployment

### Web — Vercel

Push to `main` and Vercel auto-deploys. Set the environment variables in the Vercel dashboard.

### Mobile — EAS Build

```bash
cd mobile
npx eas build --platform android   # Android APK/AAB
npx eas build --platform ios       # iOS IPA (requires Apple Developer account)
npx eas submit --platform all      # Submit to app stores
```

---

## Note per gli Sviluppatori AI

> This repository is **AI-Friendly**.

If you are using an AI coding agent (GitHub Copilot, Cursor, Claude, or similar), **do not write code before reading the architecture documentation**. The source of truth for all conventions and patterns is:

- **[CLAUDE.md](./CLAUDE.md)** — Top-level entry point: rules, checklist, and file index
- **[.claude/rules/](./.claude/rules/)** — Detailed rule files by domain:
  - `01-stack.md` — Tech stack, active libraries, deploy commands
  - `02-database.md` — Supabase schema, snake_case↔camelCase mapping, soft-delete
  - `03-api-patterns.md` — API route templates, CORS, SSE limitations
  - `04-frontend-patterns.md` — Auth system, `useAuth()`, color theme, hydration
  - `05-testing.md` — Test runner, conventions, folder structure

These files are kept up-to-date with every architectural change and take priority over any assumption or external knowledge the AI may have about the codebase.

---

*Built with ❤️ by the Sprinta team.*
