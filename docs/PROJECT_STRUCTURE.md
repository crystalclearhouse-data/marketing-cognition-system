# Project Structure & File Organization

This document explains the structure of the marketing-cognition-system repository and how to prevent file mixing between projects.

## Repository Structure

This repository contains **two separate Next.js applications**:

### 1. Root Project: marketing-cognition-system (API)
- **Location**: Root directory (`/`)
- **Purpose**: Marketing cognition API with scan engine
- **Main Files**: 
  - `src/app/api/scan/route.ts` - API endpoint
  - `src/app/scanEngine/index.ts` - Core scan logic
  - `src/contracts/verdict.ts` - Type definitions
- **Path Alias**: `@/*` → `./src/*`
- **Dependencies**: Minimal (Next.js, React, Octokit)

### 2. disco-agent-saas (Full SaaS Application)
- **Location**: `Documents/disco-agent-saas/`
- **Purpose**: Discovery agent SaaS platform with UI
- **Main Files**: Full Next.js app with Prisma, components, auth
- **Path Alias**: `@/*` → `./*`
- **Dependencies**: Full stack (Prisma, Radix UI, etc.)

## Safeguards to Prevent File Mixing

### 1. Separate Configuration Files

Each project maintains its own configuration:

```
Root Project:
├── tsconfig.json          # Root TS config
├── package.json           # Root dependencies
├── next.config.js         # Root Next.js config
└── .env.local            # Root environment variables

disco-agent-saas:
├── Documents/disco-agent-saas/tsconfig.json      # Separate TS config
├── Documents/disco-agent-saas/package.json       # Separate dependencies
├── Documents/disco-agent-saas/next.config.js     # Separate Next.js config
└── Documents/disco-agent-saas/.env.local        # Separate environment variables
```

### 2. Build Output Isolation

The `.gitignore` file explicitly separates build outputs:

```gitignore
# Root project build
.next
out
dist

# disco-agent-saas build  
Documents/disco-agent-saas/.next
Documents/disco-agent-saas/out
Documents/disco-agent-saas/dist
```

### 3. Dependency Separation

- Each project has its own `node_modules` directory
- The `.npmrc` file ensures proper local module resolution
- Never run `npm install` from the root for disco-agent-saas dependencies

### 4. Path Alias Differentiation

**Root Project** uses:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**disco-agent-saas** uses:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

This prevents import path conflicts.

## Best Practices

### Working with the Root Project

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build

# Run tests
npm test
```

### Working with disco-agent-saas

```bash
# Always cd first!
cd Documents/disco-agent-saas

# Install dependencies
npm install

# Run dev server (different port recommended)
npm run dev

# Build
npm run build
```

### Validation

Run the validation script to check for conflicts:

```bash
node scripts/validate-file-separation.js
```

This script checks:
- ✅ All config files exist and are separate
- ✅ Path aliases are different
- ✅ Build outputs are properly gitignored
- ✅ Dependencies are separated

## Common Pitfalls to Avoid

❌ **Don't do this:**
```bash
# Running commands from wrong directory
npm run dev  # Which project?!

# Importing across projects
import { something } from '../../src/contracts/verdict'  # From disco-agent-saas
```

✅ **Do this instead:**
```bash
# Be explicit about which project
cd Documents/disco-agent-saas && npm run dev

# Keep projects independent
# Duplicate shared code or publish as package
```

## File Flow & Data Flow

### Root Project (Marketing Cognition System)
```
┌─────────────────────────────────────────────────────────┐
│  Marketing Cognition System (Root)                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Sense → Decide → Act → Measure → Remember → Evolve     │
│                                                           │
│  ┌─────────────┐      ┌──────────────┐                  │
│  │  API        │      │  Scan Engine │                  │
│  │  /api/scan  │─────▶│  Security    │                  │
│  └─────────────┘      └──────────────┘                  │
│                              │                            │
│                              ▼                            │
│                       ┌──────────────┐                   │
│                       │  n8n         │                   │
│                       │  Workflows   │                   │
│                       └──────────────┘                   │
└─────────────────────────────────────────────────────────┘
```

### disco-agent-saas (Separate Application)
```
┌─────────────────────────────────────────────────────────┐
│  disco-agent-saas (Documents/disco-agent-saas)          │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  UI ← → API ← → Database (Prisma)                       │
│                                                           │
│  Independent SaaS platform                               │
│  No direct connection to root project                    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Issue: TypeScript can't find imports
**Solution**: Check which project you're in and verify the path alias matches:
- Root: `@/lib/something` → `src/lib/something`
- disco-agent-saas: `@/lib/something` → `Documents/disco-agent-saas/lib/something`

### Issue: npm install installs packages in wrong place
**Solution**: Always `cd` into the correct project directory before running npm commands

### Issue: Build outputs conflict
**Solution**: Run the validation script and ensure both `.next` directories are gitignored

### Issue: Environment variables not loading
**Solution**: Each project needs its own `.env.local` file in its root directory

## Questions?

See `Documents/disco-agent-saas/README.md` for more details about the disco-agent-saas project.

For the main marketing cognition system, see the root `README.md`.
