# OneWater - Water Quality Monitoring Platform

A production-ready, scalable Next.js application for monitoring and displaying water quality data across Australia. Built with Next.js 14 App Router, TypeScript, and Tailwind CSS.

## 🌊 Features

- **Real-time Monitoring**: Access up-to-date water quality data from government sources
- **Interactive Dashboard**: Filter and visualize data across multiple locations
- **Scientific Data**: Based on enterococci levels and NHMRC guidelines
- **Multi-State Coverage**: NSW and Victoria (with more states planned)
- **API Integration**: Normalized data layer for multiple data sources
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation with strict mode
- **Clean Architecture**: Scalable folder structure with separation of concerns

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx               # Landing page
│   ├── dashboard/             # Dashboard page
│   ├── about/                 # Static pages
│   ├── methodology/
│   ├── data-sources/
│   ├── api/beach-data/        # API endpoint
│   ├── layout.tsx             # Root layout
│   └── globals.css
├── components/
│   ├── landing/               # Landing components
│   ├── dashboard/             # Dashboard components
│   ├── layout/                # Header, Footer
│   └── ui/                    # Reusable components
├── services/                  # API integration
│   ├── nswBeachwatchService.ts
│   └── victoriaEPAService.ts
└── lib/
    ├── types/                 # TypeScript types
    └── utils/                 # Helper functions
```

## 📚 Key Technologies

- **Next.js 14+**: App Router with React Server Components
- **TypeScript**: Strict mode
- **Tailwind CSS**: Utility-first styling
- **API Routes**: Built-in backend

## 🔌 API Usage

**GET /api/beach-data**

Query parameters:
- `state`: Filter by state (NSW, VIC)
- `quality`: Filter by quality rating
- `limit`: Number of results

## 📝 Architecture Highlights

- **Clean Architecture**: Service layer, type definitions, utility functions
- **Server/Client Separation**: RSC by default, client components where needed
- **Data Normalization**: Unified interface for multiple data sources
- **Type Safety**: Strict TypeScript throughout

Built with ❤️ for Australian communities
