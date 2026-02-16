# OneWater - Complete Folder Structure

```
onewater/
├── public/                              # Static assets
├── src/
│   ├── app/                            # Next.js 14 App Router
│   │   ├── layout.tsx                  # Root layout (Header + Footer)
│   │   ├── page.tsx                    # Landing page
│   │   ├── globals.css                 # Global styles + Tailwind
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Dashboard page (client component)
│   │   │
│   │   ├── about/
│   │   │   └── page.tsx                # About page (static)
│   │   │
│   │   ├── methodology/
│   │   │   └── page.tsx                # Methodology page (static)
│   │   │
│   │   ├── data-sources/
│   │   │   └── page.tsx                # Data sources page (static)
│   │   │
│   │   └── api/
│   │       └── beach-data/
│   │           └── route.ts            # GET/POST API endpoint
│   │
│   ├── components/
│   │   ├── landing/                    # Landing page components
│   │   │   ├── Hero.tsx                # Hero section
│   │   │   ├── Features.tsx            # Features grid
│   │   │   └── Stats.tsx               # Statistics section
│   │   │
│   │   ├── dashboard/                  # Dashboard components
│   │   │   ├── FiltersPanel.tsx        # Filters sidebar (client)
│   │   │   ├── SummaryStats.tsx        # Summary statistics cards
│   │   │   ├── LocationCard.tsx        # Beach location card
│   │   │   └── MapView.tsx             # Map placeholder
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── Header.tsx              # Site header + navigation
│   │   │   └── Footer.tsx              # Site footer
│   │   │
│   │   └── ui/                         # Reusable UI components
│   │       └── (to be added as needed)
│   │
│   ├── services/                       # API integration layer
│   │   ├── nswBeachwatchService.ts     # NSW Beachwatch API
│   │   └── victoriaEPAService.ts       # Victoria EPA API
│   │
│   └── lib/
│       ├── types/
│       │   └── index.ts                # TypeScript interfaces:
│       │                               #   - BeachLocation
│       │                               #   - EnterococciRecord
│       │                               #   - NormalizedWaterQualityData
│       │                               #   - WaterQualityFilters
│       │                               #   - API raw types (NSW, VIC)
│       │                               #   - Component props types
│       │
│       └── utils/
│           ├── dataHelpers.ts          # Data transformation utilities:
│           │                           #   - filterWaterQualityData()
│           │                           #   - mergeMultiSourceData()
│           │                           #   - calculateTrend()
│           │                           #   - formatDate()
│           │                           #   - getQualityColor()
│           │                           #   - getSummaryStatistics()
│           │
│           └── cn.ts                   # Tailwind class utilities
│
├── .env.example                        # Environment variables template
├── .gitignore
├── next.config.ts                      # Next.js configuration
├── package.json                        # Dependencies
├── tsconfig.json                       # TypeScript config (strict mode)
├── tailwind.config.ts                  # Tailwind CSS config
├── postcss.config.mjs                  # PostCSS config
├── eslint.config.mjs                   # ESLint config
├── README.md                           # Project documentation
├── ARCHITECTURE.md                     # Architecture decisions
└── FOLDER_STRUCTURE.md                 # This file

```

## Component Breakdown

### Server Components (RSC)
- `app/page.tsx` - Landing page
- `app/about/page.tsx` - About page
- `app/methodology/page.tsx` - Methodology page
- `app/data-sources/page.tsx` - Data sources page
- `components/landing/*` - All landing components
- `components/layout/*` - Header and Footer
- `components/dashboard/SummaryStats.tsx`
- `components/dashboard/LocationCard.tsx`
- `components/dashboard/MapView.tsx`

### Client Components ('use client')
- `app/dashboard/page.tsx` - Interactive dashboard
- `components/dashboard/FiltersPanel.tsx` - Filter controls

### API Routes
- `app/api/beach-data/route.ts` - Water quality data endpoint

## Key Files Explained

### Type Definitions (`src/lib/types/index.ts`)
Central location for all TypeScript interfaces used throughout the app.

### Services (`src/services/*.ts`)
Encapsulate all external API calls with error handling and data normalization.

### Utils (`src/lib/utils/*.ts`)
Pure functions for data transformation, filtering, and formatting.

### Layout (`src/app/layout.tsx`)
Root layout wrapping all pages with Header and Footer.

### API Route (`src/app/api/beach-data/route.ts`)
Server-side endpoint that:
1. Fetches data from multiple sources
2. Normalizes and merges data
3. Applies filters
4. Returns JSON response

## Data Flow

```
External APIs
    ↓
Services Layer (normalize)
    ↓
API Route (merge + filter)
    ↓
Components (display)
```

## Adding New Features

### New Data Source
1. Create `src/services/newSourceService.ts`
2. Add types to `src/lib/types/index.ts`
3. Update `src/app/api/beach-data/route.ts`

### New Component
1. Add to appropriate folder in `src/components/`
2. Import in page where needed

### New Page
1. Create folder in `src/app/`
2. Add `page.tsx`
3. Automatic routing!

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React hooks
- **Data Fetching**: Native fetch with Next.js caching
- **UI Components**: Custom React components
