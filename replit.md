# replit.md

## Overview

This is a **Couple's Recipe Sharing App** - a mobile-first web application for couples to share and manage personal recipes together. The app prioritizes visual appeal with photo-first recipe cards, warm intimate design, and touch-optimized interfaces suitable for kitchen use. The UI is presented in Traditional Chinese (繁體中文).

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (2026-01-19)

### v1.1.0 - Performance Optimization
- **Thumbnail API**: New `/thumbnails/:objectPath` endpoint with Sharp library for on-the-fly image resizing
  - Streaming processing (GCS → Sharp → Response) to avoid memory issues
  - Parameter validation: width/height 10-800px, quality 10-90%, max file size 15MB
  - 1-year cache headers for optimal performance
- **View Mode Toggle**: Grid view and list view on homepage with localStorage persistence
- **RecipeListItem Component**: Compact list view for browsing more recipes at once

### Previous Changes (2026-01-11)
- **PostgreSQL Database**: Migrated from in-memory storage to PostgreSQL for persistent data
- **Object Storage**: Integrated Replit Object Storage for image uploads (up to 10MB)
- **Delete Recipe**: Added delete functionality with confirmation dialog
- **Edit Recipe**: Enhanced with cloud image upload support
- **Multi-Image Upload**: Support up to 5 images per recipe with unique ID tracking for concurrent uploads
- **Touch Swipe**: Recipe detail page supports swipe gestures for image navigation on mobile
- **Multiple Source URLs**: Recipes can have multiple source URLs (video/blog links) with dynamic add/remove

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite with custom plugins for Replit integration
- **File Upload**: Uppy v5 with presigned URL upload flow

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
- `POST /api/uploads/request-url` - Get presigned upload URL
- `GET /objects/:objectPath` - Serve uploaded files
- `GET /thumbnails/:objectPath` - Generate resized thumbnails (w, h, q params)

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Object Storage**: Replit Object Storage (Google Cloud Storage)
- **Schema Location**: `shared/schema.ts`
- **Validation**: Zod schemas via drizzle-zod
- **Storage Class**: `DatabaseStorage` in `server/storage.ts`

**Data Models**:
- `users`: id, username, password
- `recipes`: id, name, imageUrls (text[]), ingredients (text[]), steps (text[]), servings, cookTime, category, sourceUrls (text[])

### Project Structure
```
├── client/           # React frontend
│   └── src/
│       ├── components/   # UI components
│       ├── pages/        # Route pages
│       ├── hooks/        # Custom React hooks (use-upload.ts)
│       └── lib/          # Utilities
├── server/           # Express backend
│   ├── index.ts      # Entry point
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database storage layer
│   ├── db.ts         # Database connection
│   └── replit_integrations/  # Object storage integration
├── shared/           # Shared types/schemas
└── script/           # Build scripts
```

### Path Aliases
- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`
- `@assets/*` → `attached_assets/*`

## External Dependencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database ORM with type-safe queries
- **Drizzle Kit**: Database migrations via `npm run db:push`

### Object Storage
- **Replit Object Storage**: Cloud file storage for images
- **@google-cloud/storage**: GCS client for object operations
- **Sharp**: High-performance image processing for thumbnail generation
- **Uppy v5**: Frontend file upload component

### UI Libraries
- **Radix UI**: Full suite of accessible primitives (dialog, dropdown, toast, alert-dialog, etc.)
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **React Day Picker**: Calendar/date picker
- **Vaul**: Drawer component
- **CMDK**: Command palette

### Development
- **Vite**: Dev server with HMR
- **Replit Plugins**: Runtime error overlay, cartographer, dev banner
