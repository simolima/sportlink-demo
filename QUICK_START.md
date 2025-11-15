# 🚀 Quick Start Commands - SportLink

## ⚡ Avvio Rapido (5 minuti)

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Database (First Time Only)
```bash
npm run db:migrate
npm run db:seed
```

### 3️⃣ Start Development Server
```bash
# Windows (PowerShell issue workaround):
node node_modules/next/dist/bin/next dev

# Mac/Linux or if npm works:
npm run dev
```

✅ **App ready at:** http://localhost:3000

---

## 🧪 Test the App (Manual Walkthrough)

### Step 1: Create a User
```
1. Open http://localhost:3000
2. Click "Crea Account"
3. Fill the form:
   - Nome: Marco
   - Cognome: Rossi
   - Email: marco@test.it
   - Bio: Appassionato di calcio
   - Role: Giocatore
4. Click "Salva"
```

### Step 2: Login
```
1. From landing page, click "Accedi"
2. Enter: marco@test.it
3. Click "Accedi"
4. ✅ Should redirect to /home feed
```

### Step 3: View Profile
```
1. Click "Profilo" in navbar
2. See profile info and experiences
3. Click "Modifica profilo" to edit
4. Click "Logout" to return to landing
```

---

## 📚 Full Commands Reference

### Development
```bash
# Start dev server (Windows workaround)
node node_modules/next/dist/bin/next dev

# Start dev server (Mac/Linux)
npm run dev

# Start dev server on custom port
npm run dev -- -p 3001

# Build for production
npm run build

# Run production build
npm start
```

### Database
```bash
# Create and run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Generate Prisma client
npm run generate
```

### Code Quality
```bash
# Run linter
npm run lint

# Run linter with fix
npm run lint -- --fix
```

---

## 🔧 Troubleshooting

### Problem: PowerShell Execution Policy Error
```powershell
# Fix for current session only
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run dev
```

### Problem: Port 3000 Already in Use
```bash
# Use different port
npm run dev -- -p 3001
```

### Problem: Database Connection Error
```bash
# Reset and recreate database
rm -rf prisma/dev.db
npm run db:migrate
npm run db:seed
```

### Problem: Build Fails
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Try building again
npm run build
```

---

## 📱 Routes Overview

| Route | Status | Notes |
|-------|--------|-------|
| `/` | ✅ Public | Landing page (full-height hero) |
| `/login` | ✅ Public | Login form |
| `/create-profile` | ✅ Public | Create new user profile |
| `/home` | ✅ Protected | Feed page (requires login) |
| `/profile` | ✅ Protected | Current user profile |
| `/profile/[id]` | ✅ Protected | Public profile view |

---

## 🎯 Authentication Flow

```
Landing (/)
   ↓ [Click Login]
Login (/login)
   ↓ [Enter email]
API Call → /api/users (find user)
   ↓ [Success]
localStorage.set(currentUserId, currentUserName, currentUserEmail)
   ↓
Home (/home)
   ↓ [Click Profilo]
Profile (/profile)
   ↓ [Click Logout]
localStorage.clear()
   ↓
Landing (/)
```

---

## 💾 Environment Variables

Create `.env.local` in project root:

```env
# Database (SQLite demo)
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL="your_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
```

---

## 🎨 Customization Tips

### Change Primary Color (Blue → Other)
Edit `tailwind.config.ts` and replace blue with your color:
```tsx
// From: text-blue-600, bg-blue-600
// To: text-green-600, bg-green-600
```

### Change Landing Background Gradient
Edit `components/landing-hero.tsx`:
```tsx
// From: from-blue-600 via-blue-500 to-indigo-600
// To: from-purple-600 via-pink-500 to-red-600
```

### Change Navbar Color
Edit `components/navbar.tsx`:
```tsx
// Update colors in className: text-blue-600 → your-color-600
```

---

## 📊 Project Statistics

```
Total Routes: 15
- Static: 10
- Dynamic: 5
- API: 6

Components: 7 core
- Pages: 6
- Components: 7

Database Models: 4
- User, Profile, Athlete, Club, Agent

File Size:
- Build: ~87-97 kB (with JS)
- Pages: 1-2 kB (individual)
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Deploy to Other Platforms
1. Build locally: `npm run build`
2. Upload `.next` folder
3. Set environment variables
4. Start server: `npm start`

---

## 📞 Need Help?

### Check Documentation
- `REFACTORING_SUMMARY.md` - Full architecture
- `SETUP_GUIDE.md` - Detailed setup guide
- `IMPLEMENTATION_STATUS.md` - Implementation details

### Check Logs
```bash
# Dev server logs (watch for errors)
npm run dev

# Build logs (detailed errors)
npm run build
```

### Common Issues
- **Login doesn't work** → Check if user exists in database
- **Page shows blank** → Check browser console for JS errors
- **Styling looks wrong** → Clear browser cache (Ctrl+Shift+R)

---

## ✨ What's Working

✅ Landing page with full-height hero  
✅ Authentication (email-based)  
✅ User profile creation and editing  
✅ Home feed with posts  
✅ User profile view  
✅ Logout functionality  
✅ Navbar with conditional links  
✅ Professional design  

---

**Happy coding! 🎉**

For more info, see `SETUP_GUIDE.md` or `REFACTORING_SUMMARY.md`
