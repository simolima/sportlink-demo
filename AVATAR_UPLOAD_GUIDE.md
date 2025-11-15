# Avatar Upload System - Migration Guide

## Current Implementation (Local Storage)

The avatar upload system is currently using local file storage in `/public/avatars/`. This works perfectly for development and testing, and all team members will see the images after pulling from git.

### Architecture

The system uses an **abstraction layer** that makes migrating to Supabase Storage trivial:

```
┌─────────────────────────────────────────┐
│  UI Components (create-profile, etc.)  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│    lib/upload-service.ts (Interface)    │  ← Abstraction Layer
│  - uploadFile(file): Promise<url>       │
│  - deleteFile(url): Promise<bool>       │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐  ┌────────────────────┐
│    Local     │  │    Supabase        │
│   Storage    │  │    Storage         │
│  (current)   │  │  (future/ready)    │
└──────────────┘  └────────────────────┘
```

### Files Structure

```
/lib/upload-service.ts          ← Service layer with interface
/app/api/upload/route.ts        ← API endpoint (local implementation)
/components/avatar.tsx          ← Reusable Avatar component
/public/avatars/                ← Local storage folder (gitignored in production)
```

### Current Flow

1. User selects image in `create-profile` form
2. Form calls `uploadService.uploadFile(file)`
3. Service sends file to `/api/upload` endpoint
4. API saves file to `/public/avatars/[timestamp]-[random].jpg`
5. Returns public URL: `/avatars/[filename]`
6. URL saved in user JSON as `avatarUrl`
7. `Avatar` component displays image from `/avatars/...`

---

## Migration to Supabase Storage (Production)

When you're ready to deploy to production with Supabase, follow these steps:

### Step 1: Setup Supabase Storage

1. Go to your Supabase project dashboard
2. Navigate to **Storage** section
3. Create a new bucket: `public-assets` (or any name you prefer)
4. Set bucket to **public** (or configure RLS policies)
5. Add environment variables to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Step 2: Uncomment Supabase Service

In `lib/upload-service.ts`:

1. Install Supabase client:
   ```bash
   pnpm add @supabase/supabase-js
   ```

2. Uncomment the `SupabaseUploadService` class (lines ~70-130)

3. Update the factory function:
   ```typescript
   export function getUploadService(): IUploadService {
     return new SupabaseUploadService()  // ← Change this line
     // return new LocalUploadService()   // ← Comment this out
   }
   ```

### Step 3: That's It! 🎉

**No changes needed in**:
- ✅ UI components (`create-profile`, `post-card`, etc.)
- ✅ Avatar component
- ✅ API routes (they won't be used anymore)
- ✅ Database schema

The abstraction layer ensures all components continue working with zero modifications!

### Step 4: Migrate Existing Images (Optional)

If you have existing images in `/public/avatars/`, you can migrate them:

```bash
# Install Supabase CLI
npm install -g supabase

# Upload existing avatars
supabase storage upload public-assets/avatars ./public/avatars/*

# Update user JSONs with new URLs (manual or script)
```

Or create a migration script:

```typescript
// scripts/migrate-avatars-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
)

async function migrateAvatars() {
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars')
  const users = JSON.parse(fs.readFileSync('data/users.json', 'utf8'))
  
  for (const user of users) {
    if (user.avatarUrl && user.avatarUrl.startsWith('/avatars/')) {
      const filename = user.avatarUrl.split('/').pop()
      const localPath = path.join(avatarsDir, filename)
      
      if (fs.existsSync(localPath)) {
        const file = fs.readFileSync(localPath)
        const { data, error } = await supabase.storage
          .from('public-assets')
          .upload(`avatars/${filename}`, file)
        
        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('public-assets')
            .getPublicUrl(`avatars/${filename}`)
          
          user.avatarUrl = publicUrl
          console.log(`Migrated avatar for ${user.email}`)
        }
      }
    }
  }
  
  fs.writeFileSync('data/users.json', JSON.stringify(users, null, 2))
  console.log('Migration complete!')
}

migrateAvatars()
```

---

## Benefits of This Architecture

### 🚀 Easy Migration
- Change **1 line** of code to switch from local to Supabase
- No refactoring needed in components

### 🔒 Type Safety
- Interface ensures both implementations have same API
- TypeScript catches errors at compile time

### 🧪 Testable
- Can mock `IUploadService` in tests
- Easy to create test implementations

### 🔄 Reversible
- Can switch back to local if needed
- Or run both in parallel (local for dev, Supabase for prod)

### 📦 Reusable
- Same pattern can be used for other services
- Database, Auth, Analytics, etc.

---

## Environment-Based Configuration (Advanced)

You can auto-switch based on environment:

```typescript
export function getUploadService(): IUploadService {
  // Use Supabase in production, local in development
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return new SupabaseUploadService()
  }
  return new LocalUploadService()
}
```

Or use feature flags:

```typescript
export function getUploadService(): IUploadService {
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE_STORAGE === 'true'
  return useSupabase ? new SupabaseUploadService() : new LocalUploadService()
}
```

---

## Testing

### Local Testing
```bash
# Everything works locally
pnpm dev

# Images saved to public/avatars/
# Visible after git pull
```

### Supabase Testing
```bash
# Set env vars
export NEXT_PUBLIC_SUPABASE_URL=...
export NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Uncomment SupabaseUploadService
# Change getUploadService() return

pnpm dev

# Images now upload to Supabase Storage
```

---

## Troubleshooting

### Images not showing after pull
- Ensure `/public/avatars/` is committed to git
- Check `.gitignore` doesn't exclude `/public/avatars/*`
- Verify image paths are correct in user JSONs

### Supabase upload fails
- Check bucket exists and is public
- Verify CORS settings in Supabase dashboard
- Ensure anon key has upload permissions
- Check file size limits (default 50MB)

### CORS errors
Add allowed origins in Supabase dashboard:
- Storage → Settings → CORS
- Add `http://localhost:3000` and your production domain

---

## Summary

✅ **Current**: Local storage in `/public/avatars/`  
✅ **Future**: Supabase Storage (ready to switch with 1 line change)  
✅ **Architecture**: Clean abstraction layer  
✅ **Migration**: Trivial (uncomment + 1 line)

**You can develop locally with full confidence that migrating to production will be seamless!** 🎉
