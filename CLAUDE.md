# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Next.js turbopack (default port 3000)
- `pnpm build` - Build production version with turbopack  
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint for code linting

## Architecture Overview

This is a Next.js 15 application that serves as a SpacetimeDB management interface, built with React 19, TypeScript, and Tailwind CSS.

### Core Architecture

**SpacetimeDB Client Layer** (`src/lib/spacetimedb.ts`):
- `SpacetimeDBClient` class handles all database operations via HTTP API
- Provides methods for connection, querying, CRUD operations, and database management
- Interfaces define data structures for tables, queries, and database info

**Context Management** (`src/contexts/SpacetimeDBContext.tsx`):
- React context provides global connection state and client instance
- Handles connection persistence via localStorage
- Manages table metadata and loading states
- Must wrap the app with `SpacetimeDBProvider`

**Component Structure**:
- `DatabaseConnection` - Connection form for new connections
- `DatabaseManager` - Create databases, publish WASM modules, manage existing databases
- `TableList` - Sidebar listing all tables with selection
- `TableView` - Display and edit table data with pagination
- `QueryRunner` - SQL query interface with result display
- Main app uses tab-based navigation between Tables/Query/Manage modes

### Key Dependencies

- **@tanstack/react-query** - Data fetching and caching
- **lucide-react** - Icon library
- **react-hot-toast** - Toast notifications
- **Tailwind CSS v4** - Styling with dark mode support

### Data Flow

1. User connects via `DatabaseConnection` component
2. Connection details stored in context and localStorage
3. Tables automatically loaded and cached
4. Components access database via `useSpacetimeDB()` hook
5. All operations go through the centralized `SpacetimeDBClient`

The app is designed to work with SpacetimeDB's HTTP API and expects standard endpoints like `/health`, `/database/{name}/schema`, `/database/{name}/sql`, and `/v1/database/{name}`.