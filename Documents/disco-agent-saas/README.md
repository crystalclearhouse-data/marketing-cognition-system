# disco-agent-saas - Separate Next.js Application

**⚠️ IMPORTANT: This is a SEPARATE Next.js application from the root project.**

## Project Isolation

This directory contains a standalone Next.js application that should be treated as completely independent from the main marketing-cognition-system project in the root.

### Key Differences

| Aspect | Root Project | disco-agent-saas |
|--------|-------------|------------------|
| Path Alias | `@/*` → `./src/*` | `@/*` → `./*` |
| Structure | API-focused with scan engine | Full SaaS application with UI |
| Dependencies | Minimal (Next.js, React) | Full stack (Prisma, Radix UI, etc.) |
| Purpose | Marketing cognition API | Discovery agent SaaS platform |

## Working with disco-agent-saas

### Setup
```bash
cd Documents/disco-agent-saas
npm install
npm run dev
```

### Build
```bash
cd Documents/disco-agent-saas
npm run build
```

### Important Notes

1. **Always run commands from within this directory** - Don't run build/dev commands from the root
2. **Separate node_modules** - Each project maintains its own dependencies
3. **Different TypeScript configs** - Path aliases resolve differently
4. **Isolated build outputs** - Each project has its own `.next` directory

## Preventing File Mixing

To avoid confusion and file conflicts:

- ✅ Keep environment variables in separate `.env.local` files
- ✅ Run npm commands from the correct directory
- ✅ Use absolute paths when referencing files across projects
- ✅ Check which project you're in before running commands
- ❌ Don't import from root project into disco-agent-saas
- ❌ Don't share build outputs or configurations
- ❌ Don't run commands from the wrong directory

## Architecture

```
marketing-cognition-system/
├── src/                          # Root project source
│   ├── app/api/scan/            # Main API endpoints
│   └── contracts/               # Shared type definitions
├── Documents/disco-agent-saas/   # ← YOU ARE HERE
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   ├── lib/                     # Utility functions
│   └── prisma/                  # Database schema
└── workflows/                    # n8n workflow definitions
```

## Questions?

If you need to share code between projects, consider:
1. Publishing shared types as an npm package
2. Using git submodules for truly shared code
3. Maintaining separate copies (preferred for independence)
