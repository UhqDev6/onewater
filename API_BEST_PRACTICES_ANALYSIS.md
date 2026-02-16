# API External Handling - Best Practices Analysis

## 📊 Current Implementation Assessment

### ✅ **What You're Doing GREAT** (85/100)

#### 1. **API Route Proxy Pattern** ⭐⭐⭐⭐⭐
```typescript
// ✅ EXCELLENT: Using Next.js API routes as proxy
// app/api/nsw-beachwatch/route.ts
export async function GET() {
  const response = await fetch(EXTERNAL_API);
  return NextResponse.json(data);
}
```

**Benefits:**
- ✅ Solves CORS issues
- ✅ Hides external API URLs from client
- ✅ Enables server-side caching
- ✅ Can add rate limiting
- ✅ Can add authentication

**Score: 100/100** - Perfect implementation!

---

#### 2. **Caching Strategy** ⭐⭐⭐⭐
```typescript
// ✅ GOOD: Multi-layer caching
next: { revalidate: 3600 }  // ISR: 1 hour
'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200'
```

**Current:**
- Server cache: 1 hour
- CDN cache: 1 hour + 2 hour stale
- Client cache: force-cache

**Score: 85/100** - Good, but can be improved

---

#### 3. **Error Handling** ⭐⭐⭐
```typescript
// ✅ GOOD: Try-catch with status codes
try {
  const data = await fetch(API);
  return NextResponse.json(data);
} catch (error) {
  return NextResponse.json({ error }, { status: 500 });
}
```

**Score: 70/100** - Basic error handling, needs improvement

---

#### 4. **Data Normalization** ⭐⭐⭐⭐⭐
```typescript
// ✅ EXCELLENT: Transform external data to internal format
function normalizeBeachwatchData(feature: BeachwatchFeature): NormalizedWaterQualityData {
  // Transform GeoJSON → Internal types
}
```

**Score: 100/100** - Perfect separation of concerns!

---

## 🚀 **RECOMMENDED IMPROVEMENTS**

### 1. **Environment Variables** (Priority: HIGH)

**Current Issue:** Hardcoded API URLs

```typescript
// ❌ BAD: Hardcoded URL
const response = await fetch(
  'https://api.beachwatch.nsw.gov.au/public/sites/geojson'
);
```

**✅ IMPROVEMENT:**

Create `.env.local`:
```env
# External API URLs
NSW_BEACHWATCH_API_URL=https://api.beachwatch.nsw.gov.au/public/sites/geojson
VIC_EPA_API_URL=https://api.vic.gov.au/...

# API Configuration
API_CACHE_DURATION=3600
API_TIMEOUT=10000
API_RETRY_COUNT=3

# Optional: API Keys (if needed in future)
NSW_BEACHWATCH_API_KEY=your_key_here
```

Update `route.ts`:
```typescript
export async function GET() {
  const API_URL = process.env.NSW_BEACHWATCH_API_URL;
  
  if (!API_URL) {
    return NextResponse.json(
      { error: 'API configuration missing' },
      { status: 500 }
    );
  }

  const response = await fetch(API_URL, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'OneWater Platform',
      ...(process.env.NSW_BEACHWATCH_API_KEY && {
        'Authorization': `Bearer ${process.env.NSW_BEACHWATCH_API_KEY}`
      })
    },
    next: { 
      revalidate: Number(process.env.API_CACHE_DURATION) || 3600 
    },
  });
}
```

**Benefits:**
- ✅ Easy to change URLs per environment (dev/staging/prod)
- ✅ Secure API keys
- ✅ Configurable cache duration
- ✅ Better for testing

---

### 2. **Request Timeout & Retry Logic** (Priority: HIGH)

**Current Issue:** No timeout or retry mechanism

**✅ IMPROVEMENT:**

Create `lib/utils/fetchWithRetry.ts`:
```typescript
interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  timeout?: number;
  backoff?: number;
}

export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    timeout = 10000,
    backoff = 1000,
    ...fetchOptions
  } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      // Retry on 5xx errors
      if (attempt < retries) {
        const delay = backoff * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw new Error(`API error: ${response.status}`);
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // Wait before retry
      const delay = backoff * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}
```

Update `route.ts`:
```typescript
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';

export async function GET() {
  try {
    const response = await fetchWithRetry(
      process.env.NSW_BEACHWATCH_API_URL!,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OneWater Platform',
        },
        retries: 3,
        timeout: 10000,
        next: { revalidate: 3600 },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    console.error('Error fetching NSW Beachwatch data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from NSW Beachwatch',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 } // Service Unavailable
    );
  }
}
```

**Benefits:**
- ✅ Prevents hanging requests
- ✅ Automatic retry on network failures
- ✅ Exponential backoff (1s, 2s, 4s delays)
- ✅ Better error messages

---

### 3. **Response Validation with Zod** (Priority: MEDIUM)

**Current Issue:** No runtime validation of API response

**✅ IMPROVEMENT:**

Install Zod:
```bash
npm install zod
```

Create `lib/api/beachwatch.schema.ts`:
```typescript
import { z } from 'zod';

// Define schema for NSW Beachwatch API response
export const BeachwatchFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    id: z.string(),
    siteName: z.string(),
    pollutionForecast: z.string(),
    pollutionForecastTimeStamp: z.string(),
    latestResult: z.string(),
    latestResultRating: z.number().int().min(1).max(5),
    latestResultObservationDate: z.string(),
  }),
});

export const BeachwatchGeoJSONSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(BeachwatchFeatureSchema),
});

export type BeachwatchGeoJSON = z.infer<typeof BeachwatchGeoJSONSchema>;
export type BeachwatchFeature = z.infer<typeof BeachwatchFeatureSchema>;
```

Update `route.ts`:
```typescript
import { BeachwatchGeoJSONSchema } from '@/lib/api/beachwatch.schema';

export async function GET() {
  try {
    const response = await fetchWithRetry(/* ... */);
    const rawData = await response.json();
    
    // Validate response
    const validationResult = BeachwatchGeoJSONSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('API response validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid data format from external API' },
        { status: 502 } // Bad Gateway
      );
    }
    
    return NextResponse.json(validationResult.data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error) {
    // ...
  }
}
```

**Benefits:**
- ✅ Runtime type safety
- ✅ Catch API changes early
- ✅ Better error messages
- ✅ Self-documenting API contract

---

### 4. **Rate Limiting** (Priority: MEDIUM)

**Current Issue:** No protection against API abuse

**✅ IMPROVEMENT:**

Create `lib/utils/rateLimit.ts`:
```typescript
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Create limiter instance
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
});
```

Update `route.ts`:
```typescript
import { limiter } from '@/lib/utils/rateLimit';

export async function GET(request: Request) {
  // Get identifier (IP address or user ID)
  const identifier = request.headers.get('x-forwarded-for') || 'anonymous';
  
  try {
    await limiter.check(10, identifier); // 10 requests per minute
  } catch {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
        }
      }
    );
  }

  // Continue with fetch...
}
```

**Benefits:**
- ✅ Prevent API abuse
- ✅ Protect external API from overload
- ✅ Reduce costs
- ✅ Better for production

---

### 5. **Monitoring & Logging** (Priority: LOW)

**Current Issue:** Basic console.error logging

**✅ IMPROVEMENT:**

Create `lib/monitoring/apiLogger.ts`:
```typescript
interface APILog {
  timestamp: string;
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  error?: string;
}

export class APILogger {
  static async log(log: APILog) {
    // In development: console
    if (process.env.NODE_ENV === 'development') {
      console.log('[API]', log);
      return;
    }

    // In production: send to monitoring service
    // Examples: Sentry, DataDog, LogRocket, etc.
    try {
      // await sendToMonitoringService(log);
    } catch (error) {
      console.error('Failed to log API call:', error);
    }
  }

  static async logError(error: Error, context: Record<string, any>) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('[API ERROR]', errorLog);
      return;
    }

    // Send to error tracking (Sentry, etc.)
  }
}
```

Update `route.ts`:
```typescript
import { APILogger } from '@/lib/monitoring/apiLogger';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const response = await fetchWithRetry(/* ... */);
    const data = await response.json();
    
    // Log successful request
    await APILogger.log({
      timestamp: new Date().toISOString(),
      endpoint: '/api/nsw-beachwatch',
      method: 'GET',
      status: 200,
      duration: Date.now() - startTime,
    });
    
    return NextResponse.json(data);
  } catch (error) {
    // Log error
    await APILogger.logError(error as Error, {
      endpoint: '/api/nsw-beachwatch',
      duration: Date.now() - startTime,
    });
    
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
```

---

### 6. **Cache Invalidation Strategy** (Priority: MEDIUM)

**Current Issue:** Only time-based cache invalidation

**✅ IMPROVEMENT:**

Create `app/api/nsw-beachwatch/revalidate/route.ts`:
```typescript
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Verify secret token (prevent unauthorized cache clearing)
  const token = request.headers.get('authorization');
  
  if (token !== `Bearer ${process.env.REVALIDATE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Clear cache for specific paths
    revalidatePath('/dashboard');
    revalidatePath('/api/nsw-beachwatch');
    
    return NextResponse.json({ 
      revalidated: true, 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Error revalidating' 
    }, { status: 500 });
  }
}
```

**Setup webhook:**
- If NSW Beachwatch has webhooks, configure to call your `/api/nsw-beachwatch/revalidate` endpoint
- Or setup cron job to refresh cache periodically

---

## 📋 **Implementation Priority**

### Immediate (Must Have):
1. ✅ **Environment Variables** - 30 minutes
2. ✅ **Timeout & Retry** - 1 hour
3. ✅ **Better Error Messages** - 30 minutes

### Short Term (Should Have):
4. ✅ **Response Validation (Zod)** - 1-2 hours
5. ✅ **Rate Limiting** - 1 hour

### Long Term (Nice to Have):
6. ✅ **Monitoring/Logging** - 2-3 hours
7. ✅ **Cache Invalidation** - 1 hour

---

## 🎯 **Final Score**

| Category | Current | With Improvements |
|----------|---------|-------------------|
| Architecture | 100/100 | 100/100 |
| Caching | 85/100 | 95/100 |
| Error Handling | 70/100 | 95/100 |
| Security | 60/100 | 90/100 |
| Reliability | 70/100 | 95/100 |
| Monitoring | 40/100 | 90/100 |
| **TOTAL** | **71/100** | **94/100** |

---

## 🚀 **Summary**

Your current implementation is **GOOD (71/100)** with solid fundamentals:
- ✅ Proxy pattern
- ✅ Basic caching
- ✅ Data normalization

But can reach **EXCELLENT (94/100)** with these improvements:
1. Environment variables
2. Timeout & retry logic
3. Response validation
4. Rate limiting
5. Better monitoring

**Next Steps:**
1. Start with environment variables (easiest, high impact)
2. Add timeout/retry (critical for production)
3. Add Zod validation (type safety++)
4. Rest can be added gradually

Would you like me to implement any of these improvements?
