# DiscoAgent SaaS

> **Build Your Bass/Disco Music Community with Discord Bot Integration**

A production-ready full-stack Next.js 14+ SaaS application for building a music community platform focused on bass house and disco tracks, with Discord bot integration and Stripe-powered subscriptions.

## 🚀 Features

### For Users
- **Track Management**: Upload and share YouTube/Spotify music links
- **Playlist Creation**: Organize tracks into themed playlists
- **Discord Integration**: Connect your music with Discord bot
- **Two-Tier System**: Free (10 tracks) and Premium ($9/mo unlimited)
- **Authentication**: Email/password and Google OAuth support

### Technical Highlights
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript with full type safety
- **Styling**: Tailwind CSS + Shadcn UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Payments**: Stripe subscriptions with webhook support
- **Icons**: Lucide React
- **Player**: React Player for YouTube/Spotify embeds

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or cloud: Neon, Supabase, etc.)
- Stripe account (optional for local dev)
- Google OAuth credentials (optional)

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your database and API keys
```

3. **Set up the database:**
```bash
npx prisma db push
```

4. **Run development server:**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

See [SETUP.md](./SETUP.md) for detailed setup instructions including:
- Database configuration
- Stripe webhook setup
- Google OAuth configuration
- Deployment guides
- Database schema details

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth.js endpoints
│   │   ├── stripe/       # Stripe checkout & webhooks
│   │   └── tracks/       # Track CRUD operations
│   ├── auth/signin/      # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── pricing/          # Pricing page
│   ├── upload/           # Track upload
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/
│   ├── ui/               # Shadcn UI components
│   ├── navbar.tsx        # Navigation
│   └── track-player.tsx  # Music player
├── lib/
│   ├── auth.ts           # NextAuth config
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utilities
└── types/                # TypeScript types

prisma/
└── schema.prisma         # Database schema
```

## 💾 Database Schema

- **User**: Auth, premium status, Stripe IDs
- **Track**: Title, URL, genre, uploader
- **Playlist**: Name, description, owner
- **PlaylistTrack**: Many-to-many join table

## 🎨 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | Shadcn UI |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | NextAuth.js v5 |
| Payments | Stripe |
| Icons | Lucide React |
| Media Player | React Player |

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio
npx prisma db push   # Push schema to database
```

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

Compatible with: Railway, Render, AWS Amplify, DigitalOcean

## 📝 Environment Variables

Required variables (see `.env.example`):
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Auth secret key
- `NEXTAUTH_URL`: App URL
- `GOOGLE_CLIENT_ID/SECRET`: Google OAuth
- `STRIPE_SECRET_KEY`: Stripe API key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `STRIPE_PRICE_ID_PREMIUM`: Premium price ID

## 🎯 Roadmap

- [x] Core SaaS scaffolding
- [x] Authentication system
- [x] Track upload & management
- [x] Stripe integration
- [x] Responsive UI
- [ ] Playlist management UI
- [ ] Discord bot implementation
- [ ] Advanced track player
- [ ] Search & filtering
- [ ] User profiles
- [ ] Social features

## 📄 License

ISC

## 🤝 Contributing

Issues and pull requests are welcome!

---

Built with ❤️ for the bass house and disco music community
