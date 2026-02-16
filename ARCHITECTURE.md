# Architecture Documentation

## Overview

OneWater is a production-ready water quality monitoring platform built with Next.js 14 App Router, TypeScript, and Tailwind CSS. This document explains the architectural decisions and design patterns used throughout the application.

## Core Principles

### 1. Clean Architecture
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data access
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each module has one reason to change

### 2. Scalability
- **Modular Structure**: Easy to add new data sources, states, or features
- **Type Safety**: TypeScript prevents runtime errors and improves maintainability
- **Performance**: Server Components by default, client components only when needed

### 3. Developer Experience
- **Clear Naming**: Intuitive file and function names
- **Type Definitions**: Comprehensive TypeScript interfaces
- **Documentation**: Comments and clear code structure

---

## Folder Structure Explanation

### `/src/app` - Next.js App Router

**Why App Router?**
- Better performance with React Server Components
- Simplified data fetching (async/await in components)
- Built-in loading, error, and not-found states
- File-system based routing

**Structure:**
```
app/
├── page.tsx              # Landing page (RSC)
├── layout.tsx            # Root layout with Header/Footer
├── dashboard/
│   └── page.tsx          # Dashboard (Client Component for interactivity)
├── about/                # Static pages (RSC)
├── methodology/
├── data-sources/
└── api/
    └── beach-data/
        └── route.ts      # API endpoint
```

### `/src/components` - UI Components

**Separation by Feature:**

**`/landing`** - Landing page specific components
- Hero, Features, Stats
- Presentational only, no business logic

**`/dashboard`** - Dashboard specific components
- LocationCard, MapView, FiltersPanel, SummaryStats
- Mix of presentational and container components

**`/layout`** - App-wide layout components
- Header, Footer
- Used in root layout

**`/ui`** - Reusable UI primitives
- Buttons, Cards, Inputs (to be added as needed)
- Generic, no business logic

**Why This Structure?**
- Easy to locate components by feature
- Promotes reusability
- Clear ownership and responsibility

### `/src/services` - Data Access Layer

**Purpose:** Encapsulate all external API calls

**Files:**
- `nswBeachwatchService.ts` - NSW Beachwatch API integration
- `victoriaEPAService.ts` - Victoria EPA API integration

**Benefits:**
- **Testability**: Mock services easily in tests
- **Consistency**: Single source of truth for API logic
- **Error Handling**: Centralized error handling
- **Caching**: Next.js fetch caching configured here
- **Isolation**: API changes don't affect UI directly

**Example Pattern:**
```typescript
// Fetch raw data
export async function fetchNSWBeachLocations(): Promise<BeachLocation[]> {
  const response = await fetch(API_URL, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });
  const rawData = await response.json();
  return rawData.map(normalizeNSWLocation); // Normalize to our format
}
```

### `/src/lib/types` - Type Definitions

**Purpose:** Central type definitions for the entire application

**Key Types:**
- `BeachLocation` - Geographic and metadata
- `EnterococciRecord` - Water quality measurements
- `NormalizedWaterQualityData` - Complete location + data
- `WaterQualityFilters` - Filter options
- API-specific raw types (NSW, VIC)

**Why TypeScript Interfaces?**
- Self-documenting code
- IDE autocomplete and IntelliSense
- Catch errors at compile time
- Easier refactoring
- Contract between layers

### `/src/lib/utils` - Utility Functions

**`dataHelpers.ts`** - Data transformation and manipulation
- Filtering, sorting, merging
- Statistical calculations
- Format conversions
- Pure functions (no side effects)

**`cn.ts`** - Tailwind class utilities
- Class merging with proper precedence
- Using `clsx` and `tailwind-merge`

**Benefits:**
- **Reusability**: Use across multiple components
- **Testability**: Pure functions are easy to test
- **Maintainability**: Business logic separate from UI

---

## Data Flow Architecture

### 1. Data Sources → Services → Normalization

```
NSW Beachwatch API → nswBeachwatchService.ts → BeachLocation
Victoria EPA API   → victoriaEPAService.ts   → BeachLocation
                                              ↓
                                    NormalizedWaterQualityData
```

**Why Normalization?**
- Different APIs have different structures
- Consistent interface for UI components
- Easier to add new data sources
- Type safety across application

### 2. API Routes as Integration Layer

```
Client Request
    ↓
/api/beach-data (route.ts)
    ↓
Services (fetch from multiple sources)
    ↓
Data Helpers (merge, filter, normalize)
    ↓
JSON Response
```

**Benefits:**
- Abstraction over multiple data sources
- Server-side data processing
- Caching and rate limiting
- Single endpoint for clients

### 3. Server vs Client Components

**Server Components (Default):**
- Landing page
- Static pages (About, Methodology)
- Initial data fetching
- No JavaScript sent to client

**Client Components ('use client'):**
- Dashboard with filters
- Interactive map
- User inputs
- Real-time updates

**Why This Split?**
- Performance: Less JavaScript to browser
- SEO: Content rendered on server
- Security: API keys stay on server
- UX: Interactivity where needed

---

## Key Design Patterns

### 1. Service Layer Pattern

**Problem:** Direct API calls in components lead to:
- Duplication
- Hard to test
- Tight coupling
- Difficult to change APIs

**Solution:** Service layer abstracts data access

```typescript
// ✅ Good: Using service
import { fetchNSWBeachLocations } from '@/services/nswBeachwatchService';

const locations = await fetchNSWBeachLocations();

// ❌ Bad: Direct fetch in component
const response = await fetch('https://api.nsw.gov.au/...');
```

### 2. Data Normalization Pattern

**Problem:** Each API returns different formats

**Solution:** Transform to unified interface

```typescript
// Raw NSW format
interface NSWBeachwatchRawData {
  SiteID: string;
  SiteName: string;
  // ... NSW specific fields
}

// Normalized format
interface BeachLocation {
  id: string;
  name: string;
  // ... standard fields
}

// Normalization function
function normalizeNSWLocation(raw: NSWBeachwatchRawData): BeachLocation {
  return {
    id: `nsw-${raw.SiteID}`,
    name: raw.SiteName,
    // ...
  };
}
```

### 3. Compound Component Pattern

**Example:** Dashboard with filters

```typescript
// Dashboard composes multiple components
<DashboardPage>
  <SummaryStats data={data} />
  <FiltersPanel filters={filters} onFiltersChange={setFilters} />
  <LocationCard data={locationData} />
</DashboardPage>
```

**Benefits:**
- Composability
- Single Responsibility
- Easy to test each component
- Flexible layouts

### 4. Props Interface Pattern

**Every component has typed props:**

```typescript
interface LocationCardProps {
  data: NormalizedWaterQualityData;
  onSelect?: () => void;
}

export default function LocationCard({ data, onSelect }: LocationCardProps) {
  // ...
}
```

**Benefits:**
- Type checking
- Documentation
- IDE support

---

## TypeScript Configuration

**Strict Mode Enabled:**

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

**Why Strict?**
- Catch more bugs at compile time
- Better code quality
- Explicit about nullability
- Forces proper typing

---

## Performance Considerations

### 1. Next.js Caching

```typescript
fetch(url, {
  next: { revalidate: 3600 } // Cache for 1 hour
});
```

### 2. Server Components

- Data fetching on server
- No client-side JavaScript for static content
- Faster initial page load

### 3. Image Optimization

- Use Next.js `<Image>` component
- Automatic optimization and lazy loading

### 4. Code Splitting

- Automatic with App Router
- Each route is a separate bundle

---

## Scalability Considerations

### Adding a New Data Source

1. Create service file: `src/services/newSourceService.ts`
2. Define raw API types in `src/lib/types/index.ts`
3. Implement normalization functions
4. Update API route to include new source
5. No changes needed in UI components!

### Adding a New Feature

1. Create component in appropriate folder
2. Add types if needed
3. Add utility functions if needed
4. Import and use in pages

### Adding a New Page

1. Create folder in `src/app`
2. Add `page.tsx`
3. Optional: `loading.tsx`, `error.tsx`
4. Automatic routing!

---

## Error Handling Strategy

### Service Layer
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return await response.json();
} catch (error) {
  console.error('Error fetching data:', error);
  throw error; // Let caller handle
}
```

### API Routes
```typescript
try {
  const data = await fetchData();
  return NextResponse.json({ success: true, data });
} catch (error) {
  return NextResponse.json(
    { success: false, error: 'Failed to fetch' },
    { status: 500 }
  );
}
```

### Components
- Use React Error Boundaries
- Provide fallback UI
- Show user-friendly messages

---

## Testing Strategy (Future Implementation)

### Unit Tests
- Utility functions (`dataHelpers.ts`)
- Normalization functions
- Pure functions with no side effects

### Integration Tests
- Service layer (mock fetch)
- API routes
- Data flow end-to-end

### Component Tests
- React Testing Library
- Test user interactions
- Test with mock data

### E2E Tests
- Playwright or Cypress
- Critical user flows
- Dashboard filtering, navigation

---

## Environment Configuration

```env
# .env.local
NSW_BEACHWATCH_API_URL=https://api.nsw.gov.au/beachwatch
VIC_EPA_API_URL=https://api.epa.vic.gov.au

# Optional API keys
NSW_API_KEY=your_key_here
VIC_API_KEY=your_key_here
```

**Why Environment Variables?**
- Keep secrets out of code
- Different configs for dev/prod
- Easy to change without code changes

---

## Future Enhancements

### Map Integration
- Add Mapbox or Leaflet
- Cluster markers for performance
- Interactive popup on click

### Charts
- Time series with Recharts or Chart.js
- Historical trends
- Comparative analysis

### Notifications
- Email alerts for poor water quality
- Webhook integrations
- PWA push notifications

### Mobile App
- React Native with shared types
- Use same API endpoints
- Offline support

---

## Security Considerations

### API Keys
- Never expose in client-side code
- Use environment variables
- Server-side only (API routes, Server Components)

### Data Validation
- Validate API responses
- Type checking with TypeScript
- Sanitize user inputs

### Rate Limiting
- Implement in API routes
- Protect against abuse
- Cache responses

---

## Conclusion

This architecture prioritizes:
- **Maintainability**: Clear structure, separation of concerns
- **Scalability**: Easy to add features and data sources
- **Performance**: Server components, caching, optimization
- **Developer Experience**: TypeScript, clear patterns, good tooling
- **Type Safety**: Strict TypeScript throughout

The modular design ensures the platform can grow from a proof-of-concept to a production system serving millions of users while maintaining code quality and developer velocity.
