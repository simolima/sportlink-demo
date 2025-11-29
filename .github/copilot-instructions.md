# SportLink AI Agent Instructions

## Project Overview
SportLink is a **dual-platform** social platform for athletes, clubs, and agents:
- **Web App**: Next.js 14 App Router (port 3000)
- **Mobile App**: Expo/React Native (port 8081)
- **Backend**: Shared Next.js API routes with JSON file storage (`data/*.json`)

**Current Status**: MVP/Demo with isolated dependencies. Future migration to Supabase database planned.

## Critical Architecture Patterns

### Dual-Platform Structure (November 2025)
```
sportlink-demo-template/
├── app/              → Web App (Next.js)
├── components/       → Web Components
├── lib/              → Web Utilities
├── data/             → Shared JSON Database
└── mobile/           → Mobile App (Expo) - ISOLATED
    ├── screens/      → Mobile Screens
    ├── lib/          → Mobile Utilities
    └── package.json  → Separate Dependencies
```

**Key Principle**: Dependencies are **completely isolated** - no monorepo workspace.
- Web: `package.json` (root) - React 18
- Mobile: `mobile/package.json` - React 19
- API: Shared via HTTP requests to `http://localhost:3000` (dev) or production URL

### Authentication Model (Demo-Only)
**No real authentication** - uses `localStorage` for session state:
- `currentUserId`, `currentUserName`, `currentUserEmail`, `currentUserAvatar`
- Client-side route protection via `useEffect` redirect checks
- All API routes are **unauthenticated** - they trust client-provided IDs
- **Do NOT implement security features** - this is intentional for demo purposes

### Data Storage Pattern
**Current**: JSON files in `data/` directory (shared by web + mobile)
**Planned**: Migration to Supabase PostgreSQL

```typescript
// Standard pattern in app/api/*/route.ts
export const runtime = 'nodejs'
import { withCors } from '@/lib/cors'  // IMPORTANT: CORS for mobile

const DATA_PATH = path.join(process.cwd(), 'data', 'resource.json')
function ensureFile() { /* creates file if missing */ }
function readData() { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) }
function writeData(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)) }

export async function GET() {
    const data = readData()
    return withCors(NextResponse.json(data))  // CORS wrapper!
}

export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
```

**Key Requirements**:
- Use `export const runtime = 'nodejs'` in API routes
- **Always wrap responses with `withCors()`** for mobile compatibility
- Add `OPTIONS` handler for CORS preflight
- IDs generated with `Date.now()`
- Field normalization: posts have `authorId` → add `userId: post.authorId` for mobile

### Client-Side Rendering Convention
**All pages use `"use client"`** directive:
- App Router pages are client components by default in this project
- Protected pages check `localStorage.currentUserId` in `useEffect` and redirect to `/login`
- Data fetching happens client-side with `fetch('/api/*')` after mount
- Pattern: `useState` for loading/data → `useEffect` for fetch → conditional render

### Component Organization

**Web Components** (`components/` - Tailwind/DaisyUI):
```
components/          → Web-only UI (all use "use client")
  ├── profile-*      → Profile components (header, tabs, actions, stats)
  ├── post-*         → Post components (card, composer, tab)
  ├── navbar.tsx     → Web navigation (green theme)
  └── ...
```

**Mobile Screens** (`mobile/screens/` - React Native StyleSheet):
```
mobile/
  ├── screens/
  │   ├── FeedScreen.tsx      → Home feed with banner + post composer
  │   └── ProfileScreen.tsx   → User profile with stats
  ├── lib/
  │   ├── api.ts             → API client (BASE_URL configuration)
  │   └── services.ts        → Business logic (getPosts, login, etc.)
  └── App.tsx                → Entry point with tab navigation
```

**Shared Backend** (`app/api/` - Next.js API Routes):
```
app/api/            → API endpoints (CORS-enabled for mobile)
  ├── users/
  ├── posts/
  ├── likes/
  └── ...
```

### Styling System
- **Tailwind CSS** with DaisyUI plugin configured
- Custom theme: `sportlink` in `tailwind.config.ts`
- **Color palette (Green Theme)**: Primary (`green-600` #16a34a), Hover (`green-700` #15803d), Light (`green-50` #f0fdf4), Accent (`green-400/500/600`)
- Heroicons for icons (`@heroicons/react/24/{outline,solid}`)
- Responsive-first: design for mobile, extend for desktop
- Logo: `/public/logo.svg` (vector), `/public/logo.jpg` (fallback)

## Development Workflows

### Starting Development

**Web Only**:
```powershell
cd C:\Users\simon\Desktop\sportlink-demo-template
pnpm install
pnpm dev            # http://localhost:3000
```

**Mobile + Web** (both servers needed):
```powershell
# Terminal 1 - Web Server (required for API)
pnpm dev            # http://localhost:3000

# Terminal 2 - Expo Metro Bundler
pnpm dev:mobile     # Scan QR with Expo Go app
```

**Important**: Mobile app calls web APIs at `http://192.168.1.37:3000` (configure in `mobile/lib/api.ts`)

### Database Commands (Note: Prisma not actively used)
```powershell
pnpm run db:migrate  # Creates migration from schema changes
pnpm run db:seed     # Runs prisma/seed.ts (if implemented)
pnpm exec prisma studio  # GUI database viewer
```

### Adding New Features

**New Web Page**:
1. Create `app/[route]/page.tsx` with `"use client"`
2. Add localStorage check if protected
3. Fetch data in `useEffect` hook
4. Update `components/navbar.tsx` for navigation

**New Mobile Screen**:
1. Create `mobile/screens/[Name]Screen.tsx`
2. Use React Native components (`View`, `Text`, `StyleSheet`)
3. Import from `mobile/lib/services.ts` for data
4. Add to tab navigator in `mobile/App.tsx`

**New API Endpoint** (shared by web + mobile):
1. Create `app/api/[resource]/route.ts`
2. Add `export const runtime = 'nodejs'`
3. **Import and use `withCors()` wrapper**:
```typescript
import { withCors } from '@/lib/cors'

export async function GET() {
    const data = readData()
    return withCors(NextResponse.json(data))
}

export async function OPTIONS() {
    return withCors(new NextResponse(null, { status: 204 }))
}
```
4. Test from web: `fetch('/api/resource')`
5. Test from mobile: `apiCall('/api/resource')`

**New Shared Type**:
1. Add to `lib/types.ts` (web)
2. Copy to `mobile/lib/types.ts` if needed (future: extract to shared package)

## Project-Specific Conventions

### API Response Patterns
```typescript
// Success: return data directly
return NextResponse.json(users)

// Error: return with status code
return NextResponse.json({ error: 'email_required' }, { status: 400 })
```

### State Management
- **No global state library** - use React `useState`/`useEffect`
- Refetch data after mutations (simple approach)
- Pass callbacks for child → parent updates: `onAdded={() => setRefreshKey(prev => prev + 1)}`

### Type Safety
- TypeScript enabled but **loosely typed** (`any` used frequently)
- Core types defined in `lib/types.ts`
- Prisma types generated but not actively imported

### File Upload Pattern
- Uses Supabase Storage API (`lib/upload-service.ts`)
- Browser client in `lib/supabase-browser.ts`
- Uploads to `avatars/` bucket
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Navbar Behavior
Dynamic based on `localStorage` state:
- Logged out: "Login" + "Crea Account" buttons
- Logged in: "Feed", "Scopri", "Lavoro", "Messaggi" (with unread badge), "Profilo", "Logout"
- Component loads with `useState(false)` then sets state in `useEffect` to prevent hydration mismatch

## Common Patterns to Follow

### Landing Page Pattern
```tsx
// app/page.tsx - Two column layout with logo and CTAs
"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Page() {
    const router = useRouter()
    
    // Hide navbar on landing page
    useEffect(() => {
        const header = document.querySelector('header')
        if (header) header.classList.add('hidden')
        return () => { if (header) header.classList.remove('hidden') }
    }, [])

    return (
        <div className="min-h-screen bg-white flex items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left: Title, subtitle, CTAs */}
                <section>
                    <h1 className="text-3xl md:text-5xl font-extrabold">
                        Il tuo ecosistema professionale per lo sport.
                    </h1>
                    <button className="bg-green-600 hover:bg-green-700">
                        Accedi
                    </button>
                </section>
                
                {/* Right: Logo with green glow */}
                <aside>
                    <div className="relative isolate">
                        <div className="absolute bg-green-300/25 blur-3xl z-0"></div>
                        <img src="/logo.svg" className="relative z-10" />
                    </div>
                </aside>
            </div>
        </div>
    )
}
```

### Protected Page Template
```tsx
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedPage() {
    const router = useRouter()
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const id = localStorage.getItem('currentUserId')
        if (!id) {
            router.push('/login')
            return
        }
        setUserId(id)
        // fetch data...
        setLoading(false)
    }, [router])

    if (!userId) return null
    // render content
}
```

### API Route Template
```typescript
export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const DATA_PATH = path.join(process.cwd(), 'data', 'resource.json')
// ensureFile, readData, writeData functions...

export async function GET(req: Request) {
    const data = readData()
    return NextResponse.json(data)
}
```

### Component Props Pattern
```tsx
"use client"
interface Props {
    post: any  // loosely typed for demo
    onUpdate?: () => void
}

export default function Component({ post, onUpdate }: Props) {
    // implementation
}
```

### Green Theme Classes (Standardized)
```tsx
// Primary buttons
"bg-green-600 hover:bg-green-700 text-white"

// Outline buttons
"border-2 border-green-600 text-green-600 hover:bg-green-50"

// Input focus states
"focus:border-green-500 focus:outline-none"

// Links and accents
"text-green-600 hover:text-green-700"

// Info boxes
"bg-green-50 border-green-100 text-green-900"

// Gradients (headers, badges)
"bg-gradient-to-br from-green-400 to-green-600"

// Avatar fallback
"bg-gradient-to-br from-green-500 to-emerald-600"
```

## Integration Points

### Data Flow
```
User Action → Component (useState)
  → fetch('/api/resource', { method, body })
    → API Route (app/api/resource/route.ts)
      → Read/Write JSON (data/resource.json)
    → Response
  → Update Component State
→ Re-render UI
```

### Cross-Component Communication
- **Props drilling** for simple parent-child data flow
- **Callback props** for child → parent events: `onAdded`, `onUpdate`
- **URL params** for page-level data: `app/profile/[id]/page.tsx` uses `params.id`
- **localStorage** for global user state (not recommended for production)

## Key Files Reference

### Web App
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with Navbar |
| `components/navbar.tsx` | Web navigation (green theme) |
| `app/page.tsx` | Landing page (logo + CTAs) |
| `app/home/page.tsx` | Main feed (PostCard list) |
| `app/profile/[id]/page.tsx` | User profiles |
| `components/post-card.tsx` | Post display component |
| `lib/types.ts` | Web TypeScript types |
| `lib/cors.ts` | **CORS helpers for mobile** |
| `tailwind.config.ts` | Tailwind theme config |

### Mobile App
| File | Purpose |
|------|---------|
| `mobile/App.tsx` | Entry point + tab navigation |
| `mobile/screens/FeedScreen.tsx` | Home feed with banner + composer |
| `mobile/screens/ProfileScreen.tsx` | User profile with stats |
| `mobile/lib/api.ts` | **API client (configure IP here)** |
| `mobile/lib/services.ts` | Business logic (getPosts, login) |
| `mobile/package.json` | **Mobile dependencies (isolated)** |

### Shared Backend
| File | Purpose |
|------|---------|
| `app/api/users/route.ts` | User CRUD (CORS-enabled) |
| `app/api/posts/route.ts` | Posts API (adds `userId` field) |
| `app/api/likes/route.ts` | Likes API (CORS-enabled) |
| `data/*.json` | JSON database (shared) |

### Documentation
| File | Purpose |
|------|---------|
| `MOBILE_DEV_GUIDE.md` | **Setup guide for developers** |
| `.github/copilot-instructions.md` | This file |

## What NOT to Do

### Web/Mobile Isolation
- ❌ **Don't create `pnpm-workspace.yaml`** (causes dependency conflicts)
- ❌ **Don't install mobile packages from root** (`cd mobile` first!)
- ❌ **Don't use `localhost` in mobile API calls** (use PC IP address)
- ❌ **Don't forget CORS** in API routes (mobile won't work)
- ❌ **Don't mix React versions** (18 web, 19 mobile - isolated OK)

### Demo Limitations (Intentional)
- ❌ Don't add authentication middleware (demo uses localStorage)
- ❌ Don't implement Prisma queries (JSON files for now)
- ❌ Don't add server components (all pages client-side)
- ❌ Don't add input validation (focus on functionality)
- ❌ Don't optimize for production (MVP stage)

## Recent Updates (November 2025)

### Mobile App Added (November 29, 2025)
**Architecture Decision**: Isolated mobile app in `mobile/` folder, no monorepo.

**New Structure**:
- ✅ Expo app with React Native 0.78.6
- ✅ Separate dependencies (`mobile/package.json`)
- ✅ Tab navigation (Feed + Profile)
- ✅ API integration via shared backend
- ✅ CORS-enabled API routes

**Mobile Features**:
- `FeedScreen.tsx`: Home feed with green banner ("SportLink"), create post button, post list
- `ProfileScreen.tsx`: User profile with avatar, stats, logout
- `api.ts`: API client with configurable BASE_URL (dev: IP address, prod: domain)
- `services.ts`: Business logic (getPosts, login, getFollowersCount, etc.)

**API Changes for Mobile**:
- All API routes wrapped with `withCors()` from `lib/cors.ts`
- Added `OPTIONS` handlers for CORS preflight
- Posts API adds `userId` field (normalized from `authorId`)
- Field matching uses `String()` comparison for type safety

**Development Setup**:
- Web: `pnpm dev` (port 3000)
- Mobile: `pnpm dev:mobile` (port 8081)
- Both run simultaneously, mobile calls web APIs

### Green Theme Migration
- Migrated entire UI from blue to green color palette
- Primary: `green-600` (#16a34a), Hover: `green-700` (#15803d)
- Consistent across web + mobile (StyleSheet uses same hex values)
- Avatar fallbacks use `green-500` to `emerald-600` gradient

### Documentation
- `MOBILE_DEV_GUIDE.md`: Complete setup guide for developers
- Team workflow instructions (install Expo, configure IP, troubleshooting)

## Environment Setup

Required `.env.local` variables:
```bash
DATABASE_URL="postgresql://..." # For Prisma (not actively used)
DIRECT_URL="postgresql://..."   # For Prisma (not actively used)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
```

Only Supabase vars are actively used (for file uploads). Database connection is optional.

## When in Doubt

1. **Check existing patterns** in `app/api/users/route.ts` (API) or `app/home/page.tsx` (page)
2. **Use client components** - always add `"use client"` directive
3. **Keep it simple** - this is a demo, prefer working code over perfect architecture
4. **Use localStorage** for user state - don't implement complex auth
5. **Read/write JSON files** - don't use Prisma or database queries

This project prioritizes **rapid prototyping** and **demo functionality** over production best practices.

## Future Roadmap

### Immediate Next Steps
1. **Supabase Integration** (Planned):
   - Migrate from JSON files to PostgreSQL
   - Add Supabase Auth (replace localStorage)
   - Use Supabase Storage for uploads
   - Share database between web + mobile

2. **Mobile Features**:
   - Implement post creation from mobile
   - Add image upload (ImagePicker)
   - Push notifications (Expo Notifications)
   - Offline support (AsyncStorage caching)

3. **API Improvements**:
   - Add input validation
   - Implement rate limiting
   - Add proper error handling
   - JWT authentication

### Long-Term Refactoring (If Scaling)
Consider monorepo with shared packages:
```
packages/
  ├── shared-types/     → TypeScript interfaces
  ├── api-client/       → Fetch wrappers
  ├── design-tokens/    → Colors, spacing
  └── business-logic/   → Validation, formatting
```

Tools: **Turborepo** or **Nx** for workspace management.

**Current Decision**: Keep isolated structure for MVP speed. Refactor when team grows or complexity increases.

### Mobile-Specific Future Work
- React Native UI library (Tamagui, NativeBase, or custom)
- Shared components via platform-specific files (`.web.tsx`, `.native.tsx`)
- NativeWind for Tailwind-like styling on mobile
- Shared navigation constants
- Feature flags for platform-specific features