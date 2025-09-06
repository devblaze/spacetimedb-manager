# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Development
- `pnpm dev` - Start development server with Next.js turbopack (default port 3000)
- `pnpm build` - Build production version with turbopack  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code linting

### Docker Commands
- `docker build -t spacetimedb-manager .` - Build Docker image
- `docker run -p 3000:3000 spacetimedb-manager` - Run container
- `docker-compose up` - Start with Docker Compose
- `docker-compose up -d` - Start in detached mode
- `docker-compose down` - Stop and remove containers

## Architecture Overview

This is a Next.js 15 application that serves as a SpacetimeDB management interface, built with React 19, TypeScript, and Tailwind CSS.

### Core Architecture

**SpacetimeDB Client Layer** (`src/lib/spacetimedb.ts`):
- `SpacetimeDBClient` class handles all database operations via HTTP API
- Supports both URL-based and host/port-based connections
- Supports server-level connections (database name optional in config)
- Auto-detects protocol (http for localhost, https for remote hosts)
- All data operation methods (`getTables`, `query`, `insertData`, etc`) accept optional `databaseName` parameter
- Provides methods for connection, querying, CRUD operations, and database management
- Interfaces define data structures for tables, queries, and database info

**Context Management** (`src/contexts/SpacetimeDBContext.tsx`):
- React context provides global connection state and client instance
- Supports both server-level and database-specific connections
- Handles connection persistence via localStorage
- Manages multiple databases, current database selection, and table metadata
- Provides `switchDatabase()` for dynamic database switching
- Must wrap the app with `SpacetimeDBProvider`

**Component Structure**:
- `DatabaseConnection` - Connection form with URL or host/port options, optional database name
- `DatabaseManager` - Create databases, publish WASM modules, manage existing databases
- `TableList` - Sidebar listing all tables with selection
- `TableView` - Display and edit table data with pagination
- `QueryRunner` - SQL query interface with result display
- Main app uses tab-based navigation between Tables/Query/Manage modes
- Tables/Query tabs disabled until database selected; Manage tab always available

### Key Dependencies

- **@tanstack/react-query** - Data fetching and caching
- **lucide-react** - Icon library
- **react-hot-toast** - Toast notifications
- **Tailwind CSS v4** - Styling with dark mode support

### Data Flow

**Connection Options:**
- **URL Mode**: Direct URL to SpacetimeDB instance (e.g., `https://api.example.com`)
- **Host/Port Mode**: Separate host and port fields (e.g., `localhost:3000`)

**Server-Level Connection:**
1. User connects without specifying database name (either via URL or host/port)
2. App loads list of available databases from server
3. User can create/delete databases or select existing ones
4. Database selection triggers table loading for that database

**Database-Specific Connection:**
1. User connects with specific database name (either via URL or host/port)
2. Connection details stored in context and localStorage
3. Tables automatically loaded and cached for selected database
4. Components access database via `useSpacetimeDB()` hook
5. All operations go through the centralized `SpacetimeDBClient`

**Key Context Properties:**
- `currentDatabase` - Currently selected database (null for server-level)
- `availableDatabases` - List of all databases on server
- `switchDatabase(name)` - Change active database without reconnecting

The app is designed to work with SpacetimeDB's HTTP API and expects standard endpoints like `/health`, `/database/{name}/schema`, `/database/{name}/sql`, and `/v1/database/{name}`.

## Containerization

The app is containerized using Docker with multi-stage builds for optimization:

- **Dockerfile**: Multi-stage build using Node.js 18 Alpine, produces standalone output via Next.js
- **docker-compose.yml**: Includes the manager app, with optional SpacetimeDB server configuration
- **next.config.ts**: Configured with `output: 'standalone'` for minimal container size
- **.dockerignore**: Excludes development files and dependencies from build context

The container runs on port 3000 and can connect to any SpacetimeDB instance via the connection form.