# 🏗️ SportLink - Architecture Overview

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Layout (app/layout.tsx)                                   │ │
│  │  ├─ Navbar (components/navbar.tsx)                         │ │
│  │  │  ├─ Conditional: loggedIn ? Home/Profile/Logout        │ │
│  │  │  │               : Login/Crea Account                   │ │
│  │  │  └─ Dynamic: ProfileLink, LogoutButton                 │ │
│  │  └─ <main> {children}                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Pages (App Router)                                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │                                                             │ │
│  │  / (Landing)                                               │ │
│  │  └─ LandingHero (full-height blue gradient)               │ │
│  │     ├─ "Crea Account" → /create-profile                   │ │
│  │     └─ "Accedi" → /login                                  │ │
│  │                                                             │ │
│  │  /login (Login Landing)                                    │ │
│  │  └─ LoginCard (email input)                               │ │
│  │     └─ "Login" button → /login/enter                      │ │
│  │                                                             │ │
│  │  /login/enter (Login Form)                                 │ │
│  │  └─ LoginCard (email input, fetch API)                    │ │
│  │     └─ On submit: fetch /api/users, set localStorage      │ │
│  │                                                             │ │
│  │  /home (Feed - Protected)                                  │ │
│  │  └─ Check localStorage.currentUserId                      │ │
│  │     ├─ Not found? → redirect /login                       │ │
│  │     └─ Found: fetch /api/posts → PostCard list            │ │
│  │                                                             │ │
│  │  /profile (My Profile - Protected)                         │ │
│  │  └─ Check localStorage.currentUserId                      │ │
│  │     ├─ Not found? → redirect /login                       │ │
│  │     └─ Found: fetch /api/users, show ProfileHeader        │ │
│  │        ├─ Edit button → /create-profile                   │ │
│  │        └─ Logout button → clear localStorage              │ │
│  │                                                             │ │
│  │  /create-profile (Create/Edit Profile)                     │ │
│  │  └─ Form with validation                                   │ │
│  │     └─ POST to /api/users                                 │ │
│  │        └─ On success: redirect /home                      │ │
│  │                                                             │ │
│  │  /profile/[id] (Public Profile)                            │ │
│  │  └─ Show user by dynamic [id]                             │ │
│  │     └─ Follow button (if currentUser != [id])             │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Components (Reusable)                                     │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  • navbar.tsx              → Navigation with conditions   │ │
│  │  • landing-hero.tsx        → Full-height hero              │ │
│  │  • login-card.tsx          → Email login form              │ │
│  │  • post-card.tsx           → Individual post display      │ │
│  │  • profile-header.tsx      → Profile info display        │ │
│  │  • logout-button.tsx       → Logout handler               │ │
│  │  • profile-link.tsx        → Link to user profile          │ │
│  │  • follow-button.tsx       → Follow/Unfollow logic        │ │
│  │  • feed-client.tsx         → Feed container                │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Browser Storage                                           │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  localStorage:                                              │ │
│  │  ├─ currentUserId: string                                 │ │
│  │  ├─ currentUserName: string                               │ │
│  │  └─ currentUserEmail: string                              │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js Backend)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET  /api/users           → Fetch all users (for login)       │
│  POST /api/users           → Create/update user profile        │
│                                                                  │
│  GET  /api/posts           → Fetch all posts (for feed)        │
│  POST /api/posts           → Create new post                   │
│                                                                  │
│  GET  /api/follows         → Check follow status               │
│  POST /api/follows         → Create follow relation            │
│                                                                  │
│  GET  /api/athletes        → Search athletes                   │
│  POST /api/match           → Match suggestions                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Data Layer (JSON Files)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  data/                                                           │
│  ├─ users.json         → User profiles + experiences           │
│  ├─ posts.json         → Posts with timestamps                 │
│  ├─ follows.json       → Follow relationships                  │
│  └─ athletes.json      → Athlete-specific data                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Flow

```
START
  ↓
[No localStorage.currentUserId?]
  ├─ YES → Show: Landing (hero) or protected page redirects to /login
  └─ NO  → Show: Navbar with Home/Profile/Logout
            ↓
            [User clicks Login]
            ↓
            /login (landing) → /login/enter
            ↓
            [Enter email] → POST /api/users (search)
            ↓
            [Found?]
            ├─ NO  → Error message
            └─ YES → Set localStorage:
                     • currentUserId
                     • currentUserName
                     • currentUserEmail
                     ↓
                     Redirect to / (home)
                     ↓
                     Navbar now shows Home/Profile/Logout
```

---

## 📁 File Structure Detailed

```
sportlink-demo/
│
├── app/
│   ├── layout.tsx                         # Root layout + Navbar
│   ├── page.tsx                           # Landing page (/)
│   ├── globals.css                        # Global styles
│   │
│   ├── login/
│   │   ├── page.tsx                       # Login landing (/login)
│   │   └── enter/
│   │       └── page.tsx                   # Login form (/login/enter)
│   │
│   ├── home/
│   │   └── page.tsx                       # Feed (/home) - PROTECTED
│   │
│   ├── profile/
│   │   ├── page.tsx                       # My profile (/profile) - PROTECTED
│   │   └── [id]/
│   │       └── page.tsx                   # Public profile (/profile/[id])
│   │
│   ├── create-profile/
│   │   └── page.tsx                       # Create/Edit profile
│   │
│   ├── (private)/
│   │   └── matches/
│   │       └── [id]/
│   │           └── page.tsx               # Match details
│   │
│   └── api/
│       ├── users/route.ts                 # GET/POST /api/users
│       ├── posts/route.ts                 # GET/POST /api/posts
│       ├── follows/route.ts               # GET/POST /api/follows
│       ├── athletes/route.ts              # GET /api/athletes
│       ├── match/route.ts                 # GET /api/match
│       └── needs/route.ts                 # GET /api/needs (REMOVED)
│
├── components/
│   ├── navbar.tsx                         # Main navigation
│   ├── landing-hero.tsx                   # Full-height hero
│   ├── login-card.tsx                     # Email login form
│   ├── post-card.tsx                      # Post display
│   ├── profile-header.tsx                 # Profile header
│   ├── logout-button.tsx                  # Logout handler
│   ├── profile-link.tsx                   # Profile link
│   ├── follow-button.tsx                  # Follow logic
│   ├── feed-client.tsx                    # Feed container
│   ├── post-composer.tsx                  # New post form
│   ├── home-body.tsx                      # Home page body
│   ├── athlete-card.tsx                   # Athlete card
│   └── match-table.tsx                    # Match table
│
├── lib/
│   ├── fetcher.ts                         # Fetch helper
│   ├── prisma.ts                          # Prisma client
│   ├── supabase-browser.ts               # Supabase client
│   └── types.ts                           # TypeScript types
│
├── prisma/
│   ├── schema.prisma                      # DB schema (updated)
│   ├── seed.ts                            # Seed script
│   └── migrations/
│       └── 20251108152259_starting_migration/
│           └── migration.sql
│
├── data/
│   ├── users.json                         # User data
│   ├── posts.json                         # Posts data
│   ├── follows.json                       # Follows data
│   └── athletes.json                      # Athletes data
│
├── public/                                # Static files
│
├── package.json                           # Dependencies
├── tsconfig.json                          # TypeScript config
├── tailwind.config.ts                     # Tailwind config
├── next.config.mjs                        # Next.js config
├── postcss.config.js                      # PostCSS config
│
├── REFACTORING_COMPLETE.md               # Refactoring summary ✅
├── DEVELOPER_GUIDE.md                     # Developer guide ✅
├── ARCHITETTURA-E-STRUTTURA.md           # Original docs
└── README.md
```

---

## 🔐 Security Considerations

**Current Implementation (Demo):**
- ❌ No authentication tokens
- ❌ No HTTP-only cookies
- ❌ Credentials stored in localStorage
- ✅ Client-side route protection (redirects)

**Production Recommendations:**
- ✅ Implement JWT with refresh tokens
- ✅ Use HTTP-only, Secure, SameSite cookies
- ✅ Validate all inputs server-side
- ✅ Rate limit API endpoints
- ✅ CORS configuration
- ✅ HTTPS only

---

## 🎯 User Roles & Permissions

**Athlete:**
- Create profile
- View feed (posts)
- Create posts
- View other athletes
- Follow other athletes
- See match suggestions

**Club/Organization:**
- Create profile
- Post job openings (needs)
- View athlete candidates
- Contact athletes

**Agent:**
- Create profile
- Represent athletes
- Negotiate matches

**Current Implementation:** All users treated equally (demo)

---

## 📡 API Endpoints Reference

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| GET | /api/users | - | `User[]` |
| POST | /api/users | `{firstName, lastName, email, ...}` | `User` |
| GET | /api/posts | - | `Post[]` |
| POST | /api/posts | `{authorId, content, imageUrl}` | `Post` |
| GET | /api/follows | - | `Follow[]` |
| POST | /api/follows | `{followerId, followeeId}` | `Follow` |
| GET | /api/athletes | - | `Athlete[]` |
| POST | /api/match | `{athleteId, needId}` | `Match` |

---

## 🎨 Component Dependency Tree

```
Layout
├── Navbar
│   ├── ProfileLink (dynamic)
│   └── LogoutButton (dynamic)
│
pages/
├── / (Landing)
│   └── LandingHero
│
├── /login
│   └── LoginCard
│
├── /login/enter
│   └── LoginCard
│
├── /home (protected)
│   └── FeedClient
│       └── PostCard[]
│
├── /profile (protected)
│   ├── ProfileHeader
│   └── ExperienceList
│
└── /profile/[id] (public)
    ├── ProfileHeader
    ├── FollowButton
    └── PostCard[]
```

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured (.env.production)
- [ ] Database migrations run (Prisma)
- [ ] Build successful (`npm run build`)
- [ ] No console errors in dev tools
- [ ] All pages load without 404
- [ ] Login/Logout flow works
- [ ] Protected routes redirect properly
- [ ] Responsive on mobile/tablet
- [ ] Dark mode (optional)
- [ ] Analytics tracking (optional)

---

**Last Updated:** 15 Nov 2025
**Version:** 0.1.0
**Status:** ✅ Ready for Development
