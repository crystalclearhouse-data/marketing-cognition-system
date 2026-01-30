# Quick Command Reference

## Initial Setup (Run Once)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual values

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push
```

## Development

```bash
# Start development server
npm run dev

# Open Prisma Studio (database GUI)
npx prisma studio

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Management

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create a migration
npx prisma migrate dev --name your_migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npx prisma studio
```

## Stripe Setup (Optional for local dev)

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Test webhook
stripe trigger payment_intent.succeeded
```

## Testing Stripe Locally

Test credit card numbers:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any 5-digit postal code.

## Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## Troubleshooting

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Reset Prisma
npx prisma generate
npx prisma db push --force-reset

# Check TypeScript errors
npx tsc --noEmit
```
