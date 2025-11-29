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

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with Navbar, wraps all pages |
| `components/navbar.tsx` | Dynamic navigation based on auth state (green theme) |
| `app/page.tsx` | Landing page with logo.svg, two-column layout, green CTAs |
| `app/home/page.tsx` | Main feed (protected), shows PostCard list |
| `app/profile/page.tsx` | User's own profile with green header gradient |
| `app/profile/[id]/page.tsx` | View other user profiles |
| `components/login-card.tsx` | Email-based login component (green focus, buttons, links) |
| `components/profile-*` | Profile modular components (tabs, stats, actions, cover, experiences) |
| `components/post-card.tsx` | Post display with likes, comments, share (green hover states) |
| `components/post-composer.tsx` | Create new posts (green focus, publish button) |
| `components/follow-button.tsx` | Follow/unfollow toggle (green primary/outline) |
| `components/share-post-modal.tsx` | Share posts dialog (green selection, share button) |
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

## Recent Updates (November 2025)

### Green Theme Migration
- Migrated entire UI from blue to green color palette
- Primary: `green-600` (#16a34a), Hover: `green-700` (#15803d)
- All buttons, links, focus states, gradients now use green theme
- Avatar fallbacks use `green-500` to `emerald-600` gradient
- Maintained consistency across 20+ components

### New Profile Components
Created modular profile system with dedicated components:
- `profile-header.tsx` - User header with avatar, name, role
- `profile-tabs.tsx` - Tabbed navigation (Posts, Info, Updates)
- `profile-content.tsx` - Content area based on active tab
- `profile-actions.tsx` - Follow/Message buttons
- `profile-stats.tsx` - Follower/following counts with badges
- `profile-cover.tsx` - Cover image with upload capability
- `professional-experiences.tsx` - Career history display
- `professional-seasons.tsx` - Seasonal stats/achievements
- `informazioni-tab.tsx` - Info tab content
- `aggiornamenti-tab.tsx` - Updates/news tab
- `post-tab.tsx` - Posts display in profile

### Landing Page Redesign
- Two-column responsive layout (title/CTAs left, logo right)
- Logo.svg with green circular glow effect (via blur + z-index)
- Green primary CTAs ("Accedi", "Crea un profilo")
- Navbar hidden on landing page for clean splash screen
- Italian copy: "Il tuo ecosistema professionale per lo sport"

### Enhanced Components
- `login-card.tsx` - Card-based login (not fullscreen), green accents
- `share-post-modal.tsx` - Share posts with user selection
- `message-bubble.tsx` - Green background for own messages
- `comment-list.tsx` - Green hover ring on avatars
- `post-card.tsx` - Green hover states on interaction icons

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

## Future: Mobile App Strategy

When extending to mobile app (React Native/Expo), follow this approach:

### Monorepo Architecture
Structure the codebase to share logic while keeping platform-specific UI separate:
```
sportlink/
  apps/
    web/              → Current Next.js app
    mobile/           → Future Expo app
  packages/
    core/             → Shared hooks, types, API client (no UI)
    ui/               → Cross-platform components (Button, Avatar)
    theme/            → Design tokens (colors, spacing)
```

### Sharing Strategy
**Share:**
- Types (`lib/types.ts`)
- API client patterns (fetch wrappers)
- Hooks (useFeed, useProfile, useMessages)
- Business logic (validation, formatting)
- Design tokens (green palette: #16a34a, spacing, radius)

**Adapt per platform:**
- Navigation: Web (Navbar) vs Mobile (Bottom Tabs)
- Storage: localStorage vs AsyncStorage
- File upload: file input vs ImagePicker/Camera
- Styling: Tailwind classes vs NativeWind/StyleSheet

### Screen Pattern
Extract screens from pages to enable reuse:
```tsx
// packages/core/src/screens/HomeScreen.tsx
export function HomeScreen() {
  const { posts } = useFeed()  // shared hook
  return <PostList posts={posts} />  // shared component
}

// apps/web/app/home/page.tsx
import { HomeScreen } from 'core/screens/HomeScreen'
export default function Page() {
  return <WebLayout><HomeScreen /></WebLayout>
}

// apps/mobile/App.tsx
import { HomeScreen } from 'core/screens/HomeScreen'
<Tab.Screen name="Home" component={HomeScreen} />
```

### UI Components Approach
Use platform-specific variants:
```tsx
// packages/ui/Button.web.tsx
export function Button({ variant, children, ...props }) {
  return (
    <button className="bg-green-600 hover:bg-green-700" {...props}>
      {children}
    </button>
  )
}

// packages/ui/Button.native.tsx
import { Pressable, Text } from 'react-native'
export function Button({ variant, children, ...props }) {
  return (
    <Pressable className="bg-green-600" {...props}>  {/* NativeWind */}
      <Text className="text-white">{children}</Text>
    </Pressable>
  )
}
```

### NativeWind for Mobile
Consider NativeWind to maintain Tailwind utility classes on mobile:
- Same mental model as web
- className prop on React Native components
- Shared design tokens via tailwind.config.js
- Subset of Tailwind features (no grid, limited pseudo-states)

### Migration Path
1. Extract types and API client to `packages/core`
2. Create shared hooks (useFeed, useProfile, useMessages)
3. Define `routes.ts` for navigation constants
4. Refactor pages into Screen components
5. Bootstrap Expo app with Bottom Tabs
6. Create cross-platform UI primitives
7. Extract green theme tokens
8. Implement mobile-specific features (push notifications, camera)

This keeps web development fast while preparing for seamless mobile integration.