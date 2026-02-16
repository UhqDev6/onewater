# Adding New API Endpoints - Architecture Guide

## 📁 **Current Architecture**

```
src/
├── app/
│   └── api/                          # Next.js API Routes (Backend)
│       ├── nsw-beachwatch/
│       │   └── route.ts              # NSW API proxy
│       └── revalidate/
│           └── route.ts              # Cache management
│
├── lib/
│   ├── api/                          # API Integration Layer (Client-side)
│   │   ├── beachwatch.ts             # NSW API client functions
│   │   └── beachwatch.schema.ts      # Zod validation schemas
│   │
│   ├── utils/
│   │   └── fetchWithRetry.ts         # Shared utilities
│   │
│   └── config.ts                     # Environment config
```

---

## 🎯 **Where to Add New Endpoints**

### **Scenario 1: New External API (e.g., Victoria EPA)**

#### **Step 1: Add to Next.js API Routes** (Backend Proxy)
**Location:** `src/app/api/victoria-epa/route.ts`

```typescript
/**
 * API Route: Proxy for Victoria EPA API
 */

import { NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { safeValidateVictoriaEPAResponse } from '@/lib/api/victoria-epa.schema';

export async function GET() {
  try {
    const response = await fetchWithRetry(
      config.api.victoriaEPA, // Add to config
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OneWater Platform',
        },
        retries: config.request.retryCount,
        timeout: config.request.timeout,
        next: { revalidate: config.cache.duration },
      }
    );

    const rawData = await response.json();
    const validationResult = safeValidateVictoriaEPAResponse(rawData);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 502 }
      );
    }

    return NextResponse.json(validationResult.data, {
      headers: {
        'Cache-Control': `public, s-maxage=${config.cache.duration}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch Victoria EPA data' },
      { status: 503 }
    );
  }
}
```

#### **Step 2: Create Zod Schema**
**Location:** `src/lib/api/victoria-epa.schema.ts`

```typescript
import { z } from 'zod';

export const VictoriaEPAResponseSchema = z.object({
  // Define schema based on Victoria EPA API structure
  data: z.array(z.object({
    siteId: z.string(),
    siteName: z.string(),
    // ... other fields
  })),
});

export type VictoriaEPAResponse = z.infer<typeof VictoriaEPAResponseSchema>;

export function safeValidateVictoriaEPAResponse(data: unknown) {
  return VictoriaEPAResponseSchema.safeParse(data);
}
```

#### **Step 3: Create Client Integration Layer**
**Location:** `src/lib/api/victoria-epa.ts`

```typescript
import { NormalizedWaterQualityData } from '@/lib/types';
import type { VictoriaEPAResponse } from './victoria-epa.schema';

/**
 * Fetch Victoria EPA data via Next.js API route
 */
export async function fetchVictoriaEPAData(): Promise<NormalizedWaterQualityData[]> {
  try {
    const response = await fetch('/api/victoria-epa', {
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: VictoriaEPAResponse = await response.json();
    
    // Normalize to internal format
    return data.data.map(normalizeVictoriaEPAData);
  } catch (error) {
    console.error('Error fetching Victoria EPA data:', error);
    throw error;
  }
}

function normalizeVictoriaEPAData(item: any): NormalizedWaterQualityData {
  // Transform Victoria EPA format → Internal format
  return {
    location: { /* ... */ },
    latestReading: { /* ... */ },
    // ...
  };
}
```

#### **Step 4: Update Config**
**Location:** `src/lib/config.ts`

```typescript
export const config = {
  api: {
    nswBeachwatch: process.env.NSW_BEACHWATCH_API_URL || '...',
    victoriaEPA: process.env.VIC_EPA_API_URL || '...', // ← ADD THIS
  },
  // ...
};
```

#### **Step 5: Update Environment Variables**
**Location:** `.env.local`

```env
NSW_BEACHWATCH_API_URL=https://api.beachwatch.nsw.gov.au/public/sites/geojson
VIC_EPA_API_URL=https://api.epa.vic.gov.au/... # ← ADD THIS
```

---

### **Scenario 2: New Internal Endpoint (e.g., User Favorites)**

#### **Example: Save User Favorites**
**Location:** `src/app/api/favorites/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

// GET - Retrieve favorites
export async function GET(request: NextRequest) {
  // Get user favorites from database/storage
  return NextResponse.json({ favorites: [] });
}

// POST - Save new favorite
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate and save to database
  return NextResponse.json({ success: true });
}

// DELETE - Remove favorite
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  // Delete from database
  return NextResponse.json({ success: true });
}
```

---

## 📋 **Complete Checklist for New External API**

### ✅ **Backend (API Route)**
- [ ] Create `src/app/api/[api-name]/route.ts`
- [ ] Import `fetchWithRetry` utility
- [ ] Import config and schema
- [ ] Add error handling (try-catch)
- [ ] Return proper status codes (502, 503)
- [ ] Add caching headers

### ✅ **Validation**
- [ ] Create `src/lib/api/[api-name].schema.ts`
- [ ] Define Zod schemas
- [ ] Export TypeScript types
- [ ] Create validation function

### ✅ **Client Integration**
- [ ] Create `src/lib/api/[api-name].ts`
- [ ] Create fetch function
- [ ] Create normalize function
- [ ] Export safe wrapper

### ✅ **Configuration**
- [ ] Add URL to `src/lib/config.ts`
- [ ] Add to `.env.local`
- [ ] Add to `.env.example`
- [ ] Update validation in config

### ✅ **Documentation**
- [ ] Add API documentation
- [ ] Update README if needed

---

## 🌟 **Best Practices**

### 1. **Consistent Naming**
```
API Route:      src/app/api/victoria-epa/route.ts
Schema:         src/lib/api/victoria-epa.schema.ts
Client:         src/lib/api/victoria-epa.ts
Config Key:     config.api.victoriaEPA
Env Variable:   VIC_EPA_API_URL
```

### 2. **Always Use Proxy Pattern**
❌ **DON'T:** Fetch external API directly from client
```typescript
// In component - BAD!
fetch('https://external-api.com/data')
```

✅ **DO:** Use Next.js API route as proxy
```typescript
// In component - GOOD!
fetch('/api/victoria-epa')
```

### 3. **Always Validate Responses**
```typescript
const validationResult = safeValidateResponse(data);
if (!validationResult.success) {
  // Handle error
}
```

### 4. **Normalize to Internal Format**
```typescript
// External format might differ
// Always convert to NormalizedWaterQualityData
function normalize(external: ExternalType): NormalizedWaterQualityData {
  return {
    location: { /* ... */ },
    latestReading: { /* ... */ },
  };
}
```

---

## 🗂️ **File Structure Example**

```
src/
├── app/api/
│   ├── nsw-beachwatch/
│   │   └── route.ts                  ✅ Existing
│   ├── victoria-epa/                 🆕 New External API
│   │   └── route.ts
│   ├── favorites/                    🆕 New Internal Feature
│   │   └── route.ts
│   ├── analytics/                    🆕 New Internal Feature
│   │   └── route.ts
│   └── revalidate/
│       └── route.ts                  ✅ Existing
│
├── lib/api/
│   ├── beachwatch.ts                 ✅ Existing
│   ├── beachwatch.schema.ts          ✅ Existing
│   ├── victoria-epa.ts               🆕 New
│   └── victoria-epa.schema.ts        🆕 New
```

---

## 💡 **Quick Reference**

### **For External APIs (like Victoria EPA):**
1. `app/api/[name]/route.ts` - Proxy endpoint
2. `lib/api/[name].schema.ts` - Validation
3. `lib/api/[name].ts` - Client functions
4. Update `lib/config.ts`
5. Update `.env.local`

### **For Internal Features (like favorites):**
1. `app/api/[feature]/route.ts` - API endpoint
2. Optional: Create types in `lib/types/index.ts`
3. Optional: Create hooks in `hooks/use[Feature].ts`

---

## 🚀 **Example: Adding Multiple Related Endpoints**

```
src/app/api/
├── beach-data/
│   ├── route.ts              # GET all beaches
│   └── [id]/
│       └── route.ts          # GET single beach
│
├── user/
│   ├── favorites/
│   │   └── route.ts          # GET/POST/DELETE favorites
│   └── preferences/
│       └── route.ts          # GET/PUT preferences
```

---

**Summary:**
- **External APIs** → Proxy through `/app/api/[name]/route.ts`
- **Internal features** → Direct endpoints in `/app/api/[feature]/route.ts`
- **Always validate** with Zod schemas
- **Always normalize** to internal types
- **Keep consistent** naming and structure
