# SportLink AI Agent Instructions

## Project Overview
SportLink is a **Next.js 14 App Router** social platform demo for athletes, clubs, and agents. This is a **prototype/demo** using JSON file storage (`data/*.json`) instead of a database for simplicity. Prisma schema exists but is not actively used in the current implementation.

## Critical Architecture Patterns

### Authentication Model (Demo-Only)
**No real authentication** - uses `localStorage` for session state:
- `currentUserId`, `currentUserName`, `currentUserEmail`, `currentUserAvatar`
- Client-side route protection via `useEffect` redirect checks
- All API routes are **unauthenticated** - they trust client-provided IDs
- **Do NOT implement security features** - this is intentional for demo purposes

### Data Storage Pattern
All data persists to JSON files in `data/` directory:
```typescript
// Standard pattern in app/api/*/route.ts
const DATA_PATH = path.join(process.cwd(), 'data', 'resource.json')
function ensureFile() { /* creates file if missing */ }
function readData() { return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) }
function writeData(data) { fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2)) }
```
- Use `export const runtime = 'nodejs'` in API routes to enable Node.js APIs
- Always call `ensureFile()` before read/write operations
- IDs are generated with `Date.now()` for simplicity
- No database queries - all operations are in-memory array manipulations

### Client-Side Rendering Convention
**All pages use `"use client"`** directive:
- App Router pages are client components by default in this project
- Protected pages check `localStorage.currentUserId` in `useEffect` and redirect to `/login`
- Data fetching happens client-side with `fetch('/api/*')` after mount
- Pattern: `useState` for loading/data → `useEffect` for fetch → conditional render

### Component Organization
```
components/          → Reusable UI components (all use "use client")
  ├── profile-*      → Profile page components (header, tabs, content, actions, stats, cover)
  ├── post-*         → Post-related (card, composer, tab)
  ├── comment-*      → Comments (composer, list)
  ├── message-*      → Messages (bubble)
  ├── follow-*       → Follow system (button, stats)
  ├── navbar.tsx     → Global navigation (green logo, dynamic menu)
  ├── avatar.tsx     → User avatar with fallback gradient (green-500 to emerald-600)
  ├── share-post-modal.tsx → Share posts with users
  └── login-card.tsx → Email-based login (green theme)
app/(auth)/          → Auth-related pages (login flows)
app/(private)/       → Protected routes (requires localStorage check)
app/api/            → API route handlers (Node.js runtime)
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
```powershell
# Standard workflow (Windows PowerShell)
cd C:\Users\simon\Desktop\sportlink-demo-template
pnpm install        # or pnpm.cmd if execution policy blocked
pnpm dev            # Starts on http://localhost:3000
```

### Database Commands (Note: Prisma not actively used)
```powershell
pnpm run db:migrate  # Creates migration from schema changes
pnpm run db:seed     # Runs prisma/seed.ts (if implemented)
pnpm exec prisma studio  # GUI database viewer
```

### Adding New Features

**New Page:**
1. Create `app/[route]/page.tsx` with `"use client"` directive
2. Add localStorage check if protected: `if (!localStorage.getItem('currentUserId')) router.push('/login')`
3. Fetch data in `useEffect` hook
4. Update `components/navbar.tsx` if navigation link needed

**New API Endpoint:**
1. Create `app/api/[resource]/route.ts`
2. Add `export const runtime = 'nodejs'` at top
3. Implement file-based storage pattern (see `app/api/users/route.ts` as reference)
4. Export async functions: `GET`, `POST`, `PATCH`, `DELETE`

**New Component:**
1. Create in `components/[name].tsx` with `"use client"` if interactive
2. Use TypeScript props interface
3. Import shared utilities from `lib/` if needed

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

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with Navbar, wraps all pages |
| `components/navbar.tsx` | Dynamic navigation based on auth state |
| `app/home/page.tsx` | Main feed (protected), shows PostCard list |
| `app/api/users/route.ts` | User CRUD operations, reference implementation |
| `lib/types.ts` | Shared TypeScript type definitions |
| `tailwind.config.ts` | Theme configuration with DaisyUI |
| `data/*.json` | All application data storage |

## What NOT to Do

- ❌ Don't add authentication middleware or JWT tokens (intentionally excluded)
- ❌ Don't implement Prisma queries (schema exists but not used)
- ❌ Don't add server components for data fetching (all pages are client components)
- ❌ Don't use cookies or session storage (only localStorage)
- ❌ Don't add input validation or rate limiting (demo project)
- ❌ Don't optimize for production (focus on functionality, not performance)

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