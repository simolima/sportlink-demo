# ✅ Testing Checklist - SportLink

## 🧪 Test Scenarios

### A. Landing Page (/)
- [ ] Page loads without errors
- [ ] Full-height hero covers entire viewport
- [ ] Blue gradient displays correctly
- [ ] "Crea Account" button navigates to /create-profile
- [ ] "Accedi" button navigates to /login
- [ ] Header (navbar) is hidden on landing
- [ ] Responsive on mobile (text readable)
- [ ] No console errors (F12)

### B. Login Flow (/login → /login/enter)

**Step 1: /login**
- [ ] Page loads with LoginCard
- [ ] Background gradient visible
- [ ] Email input field present
- [ ] Form is centered on page
- [ ] Header hidden

**Step 2: /login/enter (same as /login currently)**
- [ ] Can enter email address
- [ ] Can click "Login" button
- [ ] On invalid email: shows error message
- [ ] On valid email: 
  - [ ] localStorage is set with currentUserId, currentUserName, currentUserEmail
  - [ ] Redirects to / (home)
  - [ ] Page reloads automatically
  - [ ] Navbar now shows: Feed, Profilo, Logout

### C. Create Profile (/create-profile)
- [ ] Page loads successfully
- [ ] Form fields display:
  - [ ] Nome (required)
  - [ ] Cognome (required)
  - [ ] Data di nascita (date picker)
  - [ ] Ruolo attuale (dropdown/input)
  - [ ] Email (required)
  - [ ] Bio (textarea)
  - [ ] Esperienze (add/remove buttons)
- [ ] Can fill all fields
- [ ] Can add multiple experiences
- [ ] "Crea Profilo" button submits form
- [ ] On success: redirects to /home
- [ ] User data appears in /api/users endpoint
- [ ] localStorage is updated after creation

### D. Home Page (/home) - PROTECTED
- [ ] Requires authentication (redirect to /login if not logged in)
- [ ] Displays "Benvenuto [UserName]" banner
- [ ] Loads posts from /api/posts
- [ ] Posts display in reverse chronological order (newest first)
- [ ] Each post shows:
  - [ ] Author name
  - [ ] Post date/time
  - [ ] Post content
  - [ ] Like count (with heart icon)
  - [ ] Comment count (with chat icon)
  - [ ] Post image (if available)
- [ ] Can click heart icon (shows hover state, even if no action)
- [ ] Can click chat icon (shows hover state, even if no action)
- [ ] No console errors

### E. Profile Page (/profile) - PROTECTED
- [ ] Requires authentication (redirect to /login if not logged in)
- [ ] Displays user avatar placeholder
- [ ] Shows user name and role
- [ ] Shows email address
- [ ] Shows bio
- [ ] Lists all experiences:
  - [ ] Each experience shows: Title - Company
  - [ ] Each experience shows: From year — To year
- [ ] "Modifica profilo" button exists and is clickable
- [ ] "Logout" button exists and is clickable
- [ ] Can click "Modifica profilo" → redirects to /create-profile
- [ ] Can click "Logout" → clears localStorage and redirects to /

### F. Public Profile (/profile/[id])
- [ ] Can navigate to /profile/1 (or any valid user ID)
- [ ] Displays that user's profile info
- [ ] Shows posts by that user
- [ ] Can view other user profiles

### G. Navbar Navigation
**When NOT logged in:**
- [ ] Navbar shows: "SportLink" logo, Home link, "Login" link, "Crea account" button
- [ ] Can click "Login" → goes to /login
- [ ] Can click "Crea account" → goes to /create-profile

**When logged in:**
- [ ] Navbar shows: "SportLink" logo, "Feed" link, "Profilo" link, "Logout" button
- [ ] Can click "Feed" → goes to /home
- [ ] Can click "Profilo" → goes to /profile
- [ ] Can click "Logout" → clears data and goes to /
- [ ] Logout actually clears localStorage (verify in DevTools)

### H. Logout Flow
- [ ] Click "Logout" button (from any page)
- [ ] Browser redirects to /
- [ ] localStorage is empty:
  - [ ] currentUserId: removed ✓
  - [ ] currentUserName: removed ✓
  - [ ] currentUserEmail: removed ✓
- [ ] Navbar now shows Login/Crea Account (not authenticated)
- [ ] Can log in again with different user

---

## 🔧 Technical Tests

### Build & Compilation
- [ ] `npm run build` completes without errors
- [ ] No TypeScript errors shown
- [ ] `.next` folder created
- [ ] Build output shows all routes (/, /login, /home, /profile, etc.)

### Dev Server
- [ ] `npm run dev` starts without errors
- [ ] Server listens on http://localhost:3000
- [ ] Hot reload works (save a file, page updates)
- [ ] No console warnings about unused imports

### API Endpoints
- [ ] `GET /api/users` returns valid JSON array
- [ ] `GET /api/posts` returns valid JSON array
- [ ] `GET /api/follows` returns valid JSON array
- [ ] All endpoints respond within 100ms

### Data Persistence
- [ ] Create profile → data stored in data/users.json
- [ ] Create post → data stored in data/posts.json
- [ ] Follow user → data stored in data/follows.json
- [ ] Create another user → doesn't overwrite first user

### localStorage
- [ ] After login: `localStorage.currentUserId` is non-empty
- [ ] After login: `localStorage.currentUserName` is "FirstName LastName"
- [ ] After login: `localStorage.currentUserEmail` is valid email
- [ ] After logout: all three keys are removed
- [ ] Values persist across page reloads (while logged in)

---

## 📱 Responsive Design

### Mobile (375px - iPhone SE)
- [ ] Landing page: text readable, buttons fit screen
- [ ] Login form: input field is full width, button is touchable
- [ ] Feed: posts stack vertically, images scale down
- [ ] Profile: avatar, name, bio all centered
- [ ] Navbar: hamburger menu or collapsible (if implemented)

### Tablet (768px - iPad)
- [ ] All content centered
- [ ] Forms have max-width constraints
- [ ] No horizontal scrolling
- [ ] Navbar has proper spacing

### Desktop (1024px+)
- [ ] Container max-widths applied (max-w-4xl)
- [ ] Proper spacing around content
- [ ] Navbar well distributed

---

## 🐛 Error Handling

### Network Errors
- [ ] Invalid email in login: shows error message
- [ ] Network timeout: page doesn't crash
- [ ] Missing data: graceful fallback (e.g., "Nessun post")

### Route Protection
- [ ] Direct URL to /home without auth: redirects to /login
- [ ] Direct URL to /profile without auth: redirects to /login
- [ ] After logout: /home and /profile both redirect to /login

### Browser Console (F12)
- [ ] No red error messages
- [ ] No orange warnings (minimize)
- [ ] No undefined variables
- [ ] No failed fetch requests

---

## 🎯 User Stories to Test

### Story 1: New User
```
1. User arrives at landing page (/)
2. Sees "Crea Account" button
3. Clicks it → goes to /create-profile
4. Fills form: Marco Rossi, marco@example.com, Atleta, etc.
5. Clicks "Crea Profilo"
6. ✅ Redirected to /home
7. ✅ Navbar shows: Feed, Profilo, Logout
```

### Story 2: Return User
```
1. User arrives at landing page (/)
2. Sees "Accedi" button
3. Clicks it → goes to /login
4. Enters: marco@example.com
5. Clicks "Login"
6. ✅ Redirected to /
7. ✅ Navbar shows: Feed, Profilo, Logout
```

### Story 3: View Feed
```
1. User is logged in
2. Clicks "Feed" in navbar → /home
3. ✅ Sees list of posts
4. ✅ Each post shows: author, date, content, likes, comments
```

### Story 4: View Profile
```
1. User is logged in
2. Clicks "Profilo" in navbar → /profile
3. ✅ Sees own profile info
4. ✅ Can see "Modifica profilo" button
5. ✅ Can see "Logout" button
```

### Story 5: Logout
```
1. User is logged in
2. Clicks "Logout" button
3. ✅ Redirected to /
4. ✅ localStorage cleared
5. ✅ Navbar shows: Login, Crea Account
```

---

## 📝 Test Report Template

```
Test Date: ___/___/2025
Tester: ___________________
Environment: Development / Production

Total Tests: ____ / ____
Passed: ____
Failed: ____
Blocked: ____

Critical Issues:
[ ] None

Major Issues:
[ ] None

Minor Issues:
[ ] None

Notes:
_________________________________
_________________________________
_________________________________

Signed: ___________________
```

---

## 🚀 Pre-Release Checklist

Before deploying to production:

- [ ] All tests in this checklist passed ✅
- [ ] No console errors or warnings
- [ ] Build size acceptable (check `.next/` folder)
- [ ] Performance: pages load in < 2 seconds
- [ ] SEO: meta tags present (next/head)
- [ ] Analytics: tracking configured (optional)
- [ ] Security: no sensitive data in console logs
- [ ] Accessibility: keyboard navigation works
- [ ] Browser compatibility: tested on Chrome, Firefox, Safari, Edge

---

**Last Updated:** 15 Nov 2025
**Version:** 0.1.0
**Test Suite:** Comprehensive
