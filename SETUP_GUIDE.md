# 🚀 SportLink - Setup & Development Guide

## Quick Start

### 1. Installation
```bash
# Install dependencies
npm install

# (Optional) Generate Prisma client
npm run generate
```

### 2. Database Setup (First Time)
```bash
# Create and run migrations
npm run db:migrate

# (Optional) Seed with demo data
npm run db:seed
```

### 3. Start Development
```bash
# On Windows (if PowerShell execution policy issue):
node node_modules/next/dist/bin/next dev

# On Mac/Linux or normal npm:
npm run dev
```

**App will be available at:** http://localhost:3000

---

## 📱 User Flow

### 1. Landing Page (`/`)
- **Access:** No login required
- **Actions:** 
  - Click "Crea Account" → go to `/create-profile`
  - Click "Accedi" → go to `/login`

### 2. Create Profile (`/create-profile`)
- **Access:** No login required
- **Fields:**
  - Nome *
  - Cognome *
  - Email *
  - Data di nascita
  - Ruolo attuale
  - Bio
  - Esperienze passate
- **Action:** Submit → Save to database → Can now login

### 3. Login (`/login`)
- **Access:** No login required
- **Fields:** Email
- **Action:** Enter email → System finds user → Sets localStorage → Redirect to `/home`

### 4. Home (`/home`)
- **Access:** Requires login (has localStorage.currentUserId)
- **Content:**
  - Welcome banner with username
  - Feed of posts from all users
  - Each post shows: author, date, content, image (if any)
- **NavBar:** Shows "Feed" | "Profilo" | "Logout"

### 5. Profile (`/profile`)
- **Access:** Requires login
- **Content:**
  - Avatar (placeholder)
  - Name, role, email, bio
  - List of past experiences
- **Actions:**
  - "Modifica profilo" → go to `/create-profile` (can edit existing data)
  - "Logout" → Clear localStorage → Redirect to `/`

---

## 🛠 Project Structure

```
sportlink-demo/
├── app/
│   ├── page.tsx                 # Landing hero
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── login/
│   │   ├── page.tsx             # Login page
│   │   └── enter/
│   │       └── page.tsx         # Alternative login
│   ├── create-profile/
│   │   └── page.tsx             # Profile creation
│   ├── home/
│   │   └── page.tsx             # Authenticated home
│   ├── profile/
│   │   ├── page.tsx             # Current user profile
│   │   └── [id]/
│   │       └── page.tsx         # Public profile
│   ├── (private)/
│   │   └── matches/
│   │       └── [id]/
│   │           └── page.tsx     # Match details
│   └── api/
│       ├── users/               # User endpoints
│       ├── posts/               # Posts endpoints
│       ├── follows/             # Follow endpoints
│       ├── match/               # Match endpoints
│       └── athletes/            # Athlete endpoints
│
├── components/
│   ├── navbar.tsx               # Dynamic navigation bar
│   ├── landing-hero.tsx         # Landing page hero
│   ├── login-card.tsx           # Login form
│   ├── logout-button.tsx        # Logout button
│   ├── profile-link.tsx         # Profile link
│   ├── post-card.tsx            # Post display
│   ├── profile-header.tsx       # Profile header
│   └── [other components]
│
├── lib/
│   ├── types.ts                 # TypeScript types
│   ├── prisma.ts                # Prisma client
│   └── [utilities]
│
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Seed script
│   └── migrations/              # Database migrations
│
├── data/
│   ├── users.json               # Demo users (if using file-based)
│   ├── posts.json               # Demo posts
│   └── follows.json             # Follow relationships
│
├── public/
│   └── [static assets]
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
└── REFACTORING_SUMMARY.md       # This file (architecture docs)
```

---

## 🔑 Key Features

### ✅ Authentication
- Email-based login (no password required for demo)
- localStorage session management
- Automatic redirect for protected routes

### ✅ User Profile
- Create and edit profile
- Store experiences
- View other users' profiles

### ✅ Post Feed
- View posts from all users
- Post metadata (author, date, content)
- Image support

### ✅ Responsive Design
- Mobile-first Tailwind CSS
- DaisyUI components
- Professional color scheme

---

## 🎨 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Next.js 14 |
| **Styling** | Tailwind CSS + DaisyUI |
| **Icons** | Heroicons |
| **Forms** | React Hook Form |
| **Validation** | Zod |
| **State Management** | React Query (ready) |
| **Database** | PostgreSQL + Prisma ORM |
| **Database** | SQLite (demo, can switch) |

---

## 📋 Environment Variables

Create a `.env.local` file in the root:

```env
# Database (SQLite for demo)
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="your_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
```

---

## 🧪 Testing the App

### Manual Test Scenario

1. **Create User**
   - Go to http://localhost:3000
   - Click "Crea Account"
   - Fill form: Name=Marco, LastName=Rossi, Email=marco@test.it
   - Submit

2. **Login**
   - Go to http://localhost:3000
   - Click "Accedi"
   - Enter: marco@test.it
   - ✅ Should redirect to /home

3. **View Home**
   - Should see posts feed
   - Navbar shows "Feed | Profilo | Logout"

4. **View Profile**
   - Click "Profilo" in navbar
   - Should see your profile data
   - Can click "Modifica profilo"

5. **Logout**
   - Click "Logout" button
   - Should redirect to landing
   - Navbar shows "Login | Crea Account"

---

## 🚨 Troubleshooting

### PowerShell Execution Policy Error
```powershell
# Set execution policy for current session only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then run:
npm run dev
```

### Port 3000 Already in Use
```bash
# Use different port
node node_modules/next/dist/bin/next dev -p 3001
```

### Database Connection Error
```bash
# Reset database
rm -rf prisma/dev.db

# Create new database
npm run db:migrate
npm run db:seed
```

### Build Errors
```bash
# Clear build cache
rm -rf .next

# Rebuild
npm run build
```

---

## 📞 Useful Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm start                # Run production build

# Database
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database
npm run generate         # Generate Prisma client

# Code Quality
npm run lint             # Run ESLint
```

---

## 📚 Documentation

- **[Next.js Docs](https://nextjs.org/docs)** - Framework documentation
- **[Prisma Docs](https://www.prisma.io/docs/)** - Database ORM
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling
- **[DaisyUI](https://daisyui.com/)** - Component library
- **[Heroicons](https://heroicons.com/)** - Icon library

---

## 🎯 Next Steps

1. **Deploy to Production**
   - Use Vercel, Netlify, or any Node.js hosting
   - Set environment variables

2. **Database Upgrade**
   - Switch from SQLite to PostgreSQL
   - Update DATABASE_URL in .env

3. **Add More Features**
   - Athlete search/filtering
   - Match creation and management
   - Notification system
   - Direct messaging

4. **Performance Optimization**
   - Implement React Query caching
   - Add image optimization
   - Implement lazy loading

---

**Status:** ✅ Ready for development and testing

**Last Updated:** November 15, 2025
