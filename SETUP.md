# DiscoAgent SaaS - Setup Guide

## Overview
DiscoAgent SaaS is a production-ready full-stack Next.js 14 application for building a bass/disco music community with Discord bot integration.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (Email + Google OAuth)
- **Payments**: Stripe
- **Icons**: Lucide React

## Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or cloud-hosted like Neon/Supabase)
- Stripe account
- Google OAuth credentials (optional)

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: From Google Cloud Console
- `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`: From Stripe Dashboard
- `STRIPE_WEBHOOK_SECRET`: From Stripe webhook setup
- `STRIPE_PRICE_ID_PREMIUM`: Your Stripe price ID for premium subscription

### 3. Set Up Database
```bash
# Push the schema to your database
npx prisma db push

# Optional: Open Prisma Studio to view your data
npx prisma studio
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Features

### Free Tier
- Up to 10 tracks
- Create playlists
- Basic Discord bot access
- Community features

### Premium Tier ($9/month)
- Unlimited tracks
- Unlimited playlists
- Priority Discord bot hosting
- Ad-free experience
- Priority support
- Early access to new features

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── stripe/        # Stripe integration
│   │   └── tracks/        # Track CRUD operations
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   ├── pricing/           # Pricing page
│   ├── upload/            # Track upload page
│   └── layout.tsx         # Root layout
├── components/
│   ├── ui/                # Shadcn UI components
│   └── navbar.tsx         # Navigation component
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript type definitions

prisma/
└── schema.prisma          # Database schema
```

## Database Schema

### User
- Authentication fields (email, password, OAuth)
- Premium status and Stripe IDs
- Relations to tracks and playlists

### Track
- Title, URL (YouTube/Spotify), genre
- Uploader reference
- Many-to-many relationship with playlists

### Playlist
- Name, description
- Owner reference
- Many-to-many relationship with tracks

## Stripe Integration

### Setup Webhooks
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `.env`

### Testing with Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Google OAuth Setup
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy client ID and secret to `.env`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms
The app is compatible with any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

## Development Commands
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Database
npx prisma studio        # View database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes
npx prisma db pull       # Pull schema from database
npx prisma migrate dev   # Create migration
```

## Next Steps
1. Configure your database connection
2. Set up Stripe products and pricing
3. Configure Google OAuth
4. Customize branding and colors
5. Add Discord bot integration
6. Deploy to production

## Support
For issues or questions, please open an issue on GitHub.
