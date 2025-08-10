# Carlens Monorepo

A vehicle analytics dashboard application that processes telemetry data from OBD Fusion, organized as a Bun workspace monorepo.

## Workspace Structure

```
carlens/
├── packages/
│   ├── carlen/          # Vue 3 frontend application
│   ├── server/          # Fastify backend API
│   ├── shared-types/    # Shared TypeScript types
│   └── sync/            # MongoDB sync utility
└── package.json         # Root workspace configuration
```

## Package Overview

### @carlens/carlen (Frontend)
- Vue 3 with Composition API
- Vite build tool
- Shadcn-Vue components
- Vue ECharts for visualization
- CSS Modules for styling

### @carlens/server (Backend)
- Fastify web server
- MongoDB integration
- Time-series API endpoints
- Vehicle telemetry data management

### @carlens/shared-types (Types)
- Shared TypeScript interfaces
- API request/response types
- OBD data structures
- Vehicle and engine metrics

### @carlens/sync (Data Sync)
- MongoDB synchronization utility
- CSV parsing and processing
- OBD-II data ingestion

## Development Scripts

```bash
# Install dependencies for all packages
bun install

# Run the backend server
bun run server

# Build the frontend
bun run build:client

# Run linting across all packages
bun run lint

# Type checking across all packages
bun run type-check
```

## Package Scripts

### Frontend Development
```bash
# From packages/carlen/
bun run dev     # Start development server
bun run build   # Build for production
bun run lint    # Run linting
```

### Backend Development  
```bash
# From packages/server/
bun run start   # Start production server
bun run dev     # Start with file watching
```

### Data Synchronization
```bash
# From packages/sync/
bun run sync    # Sync CSV data to MongoDB
```

## Shared Types Usage

All packages can import shared types:

```typescript
import type { 
  ApiResponse, 
  TimeseriesDataPoint, 
  ObdReading 
} from '@carlens/shared-types';
```

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `DATABASE_NAME`: MongoDB database name  
- `PORT`: Server port (default: 3001)
- `HOST`: Server host (default: 0.0.0.0)