# OneWater Landing Page Scientific Components

This directory contains 5 new scientific components that showcase OneWater's platform capabilities to the public as an executive summary.

## Components Overview

### 1. ScienceInsight.tsx
**Purpose:** Genomic Analysis Showcase  
**Features:**
- Displays "5,000+ Microorganisms Tracked"
- Highlights "Deep DNA Sequencing" capability
- Shows taxonomic hierarchy from Level 1 (Domain) to Level 6 (Genus)
- Interactive taxonomic tree visualization
- Scientific credibility building

### 2. PollutionSourceOverview.tsx
**Purpose:** MST (Microbial Source Tracking) Summary  
**Features:**
- Global MST summary with median-based calculations
- Progress bars showing pollution source contributions
- Categories: Human Sources, Animal Sources, Natural & Other
- Label: "Source Identification: Tracking the footprints of contamination"
- Color-coded source visualization

### 3. StatsOverview.tsx
**Purpose:** Water Quality Statistics  
**Features:**
- "Locations Monitored" (NSW + Victoria total)
- "Current Water Safety" (percentage with 'Good' status)
- "Latest Sample Date" (most recent sample)
- "Data Points Collected" (total samples since 2018)
- Scientific design matching existing Stats.tsx

### 4. PollutionAlert.tsx
**Purpose:** Water Quality Alerts  
**Features:**
- Top 3 locations with "Poor" or "Polluted" status
- Real-time alert cards with warning colors
- Enterococci levels and threshold exceedance
- Direct links to detailed dashboard analysis
- Immediate public awareness system

### 5. BeachCameraPreview.tsx
**Purpose:** Beach Camera Gallery  
**Features:**
- Grid of beach camera previews
- Active links for available cameras
- "Preview Unavailable" state for offline cameras
- Live/Offline status indicators
- External camera feed integration

## Technical Implementation

### TypeScript Types
All components use strongly-typed interfaces from `@/lib/types/landing.ts`:
- `ScienceInsightData` - Genomic insight data structure
- `MSTCategoryData` - MST source tracking data
- `StatData` - Statistics card data
- `PollutionAlertData` - Alert system data
- `BeachCameraData` - Camera feed data

### Mock Data Structure
Mock data structures match real dashboard data:
- MST data matches `src/services/mstService.ts`
- Location data matches `src/lib/types/index.ts` BeachLocation
- Taxonomy data matches dashboard taxonomy structure

### Design System
- **Framework:** Tailwind CSS exclusively
- **Style:** Scientific/research paper aesthetic
- **Colors:** Modern blue/teal palette
- **Responsive:** Mobile-first grid layouts
- **Animations:** Fade-in effects with staggered delays

### Integration
Components are integrated in `src/app/page.tsx` in logical order:
1. Hero (existing)
2. StatsOverview (new)
3. PollutionAlert (new)
4. LivePreview (existing)
5. ScienceInsight (new)
6. PollutionSourceOverview (new)
7. BeachCameraPreview (new)
8. Features (existing)
9. Stats (existing)

## Data Flow

### Current State (Mock Data)
All components use mock data with structures identical to real dashboard data, enabling seamless future integration.

### Future Integration
To connect with real data:
1. Replace mock data with API calls to existing services
2. Use existing hooks (`useMSTData`, `useLocations`, etc.)
3. Maintain same component interfaces and props
4. Update data refresh intervals as needed

## Performance Considerations

- **Client-side rendering:** Components marked with `'use client'` where needed
- **Optimized animations:** CSS-based animations with hardware acceleration
- **Responsive images:** Proper image optimization for camera previews
- **Lazy loading:** Components load progressively with animation delays

## Accessibility

- **Color contrast:** Colorblind-safe palettes available
- **Screen readers:** Proper ARIA labels and semantic HTML
- **Keyboard navigation:** Focus management for interactive elements
- **Mobile responsive:** Touch-friendly interface design

## Maintenance

### Adding New Components
1. Create component in `/src/components/landing/`
2. Add TypeScript interfaces to `/src/lib/types/landing.ts`
3. Import and integrate in `/src/app/page.tsx`
4. Follow existing design patterns and naming conventions

### Updating Mock Data
1. Ensure structure matches real dashboard data
2. Update TypeScript interfaces if needed
3. Test responsive design across screen sizes
4. Verify accessibility compliance

### Future Enhancements
- Real-time data integration
- Interactive data filtering
- Advanced visualizations
- Performance monitoring
- A/B testing capabilities