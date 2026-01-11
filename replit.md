# replit.md

## Overview

This is a **Couple's Recipe Sharing App** - a mobile-first web application for couples to share and manage personal recipes together. The app prioritizes visual appeal with photo-first recipe cards, warm intimate design, and touch-optimized interfaces suitable for kitchen use. The UI is presented in Traditional Chinese (繁體中文).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration

**Design System**:
- Typography: Playfair Display (headings), Inter/DM Sans (body)
- Mobile-first responsive grid (1 → 2 → 3 columns)
- Warm, intimate color palette with orange primary accent
- Touch-optimized with generous spacing

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API at `/api/*` endpoints
- **Build**: esbuild for production bundling with dependency allowlist

**API Endpoints**:
- `GET /api/recipes` - List all recipes
- `GET /api/recipes/:id` - Get single recipe
- `POST /api/recipes` - Create recipe
- `PATCH /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas via drizzle-zod
- **Current State**: In-memory storage (`MemStorage`) with seeded sample recipes; database schema ready for PostgreSQL

**Data Models**:
- `users`: id, username, password
- `recipes`: id, name, imageUrl, ingredients (array), steps (array), servings, cookTime

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── index.ts      # Entry point
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Data layer
│   └── vite.ts       # Dev server integration
├── shared/           # Shared types/schemas
└── script/           # Build scripts
```

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Database
- **PostgreSQL**: Required for production (configured via `DATABASE_URL` environment variable)
- **Drizzle Kit**: Database migrations via `npm run db:push`

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, toast, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **React Day Picker**: Calendar/date picker
- **Vaul**: Drawer component
- **CMDK**: Command palette

### Development
- **Vite**: Dev server with HMR
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner

### Session Management (Prepared)
- **connect-pg-simple**: PostgreSQL session store (dependency installed)
- **express-session**: Session middleware (dependency installed)