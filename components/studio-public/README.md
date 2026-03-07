# Studio Public Components

Rich UI components for professional studio public pages (physio, nutritionist, athletic trainer).

## Architecture

- **Real data**: Fetched from `/api/studios/[id]` (name, owner, contact info, services)
- **Mock enrichment**: Role-specific content via `getStudioMockDataByRole()` from `lib/studio-mock-data.ts`
- **10-section layout**: Modular components for hero, trust, about, specializations, services, methodology, reviews, location, FAQ, CTA

## Components

### StudioPublicHero
- Logo/avatar with verified badge
- Role label, experience years, languages, remote mode badges
- Contact quick links (phone, location, website)
- Primary CTA: "Prenota Visita" + secondary "Chiama ora"

### StudioTrustBar
- Stats bar: years of experience, review count/rating, languages, work modes

### StudioAboutSection
- Studio description (from DB)
- Owner info card with avatar

### StudioSpecializations
- 4-column grid of specializations with icons and descriptions
- Role-specific content (e.g., physio: Terapia Manuale, Riabilitazione Sportiva)

### StudioServicesSection
- 2-column checklist of services offered (from DB)

### StudioMethodology
- "Come Lavoro" narrative section
- Certifications badges

### StudioReviewsSection
- 3-column grid of client reviews with stars and verified badges
- Average rating display

### StudioLocationContact
- Contact cards grid: address, phone, website
- Styled with brand colors

### StudioFaqSection
- Accordion-style FAQ list (role-specific questions)

### StudioFinalCta
- Full-width gradient CTA section for booking

## Usage

```tsx
import { getStudioMockDataByRole } from '@/lib/studio-mock-data'
import { StudioPublicHero, StudioTrustBar, ... } from '@/components/studio-public'

const studio = await fetch(`/api/studios/${id}`).then(r => r.json())
const mockData = studio.owner?.roleId ? getStudioMockDataByRole(studio.owner.roleId) : null

<StudioPublicHero studio={studio} mockData={mockData} onBookingClick={...} />
<StudioTrustBar mockData={mockData} />
// ... other sections
```

## Color Scheme

All components use Sprinta brand colors:
- Primary: `brand-600` (#2341F0)
- Hover: `brand-700` (#1c37cf)
- Backgrounds: `brand-50/100` (light blues)
- NO green colors (deprecated)

## Mobile-First

All components are responsive with Tailwind breakpoints (md:, lg:).

## Future DB Migration

Currently uses mock data for reviews, specializations, FAQ. When migrating to real tables:
1. Create `studio_reviews`, `studio_specializations`, `studio_faq` in Supabase
2. Update API to fetch real data
3. Remove `mockData` prop, pass DB data directly
