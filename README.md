# CampusOS Base App

**Multi-tenant SaaS base for school fee collection and communication.**

Built on Next.js 16, this is a foundation app that schools can fork and customise. Each fork is full-stack — own API routes, own database, own authentication.

## Features

- **Authentication** — Email/password + optional Google OAuth via Better Auth. Session-protected routes with login page.
- **Fee Dashboard** — Invoice table with status tracking, payment links, and "remind to pay" flow.
- **WhatsApp Announcements** — Compose and send bulk WhatsApp messages to parents. Uses Evolution API for WhatsApp connectivity (QR code pairing, message sending, phone number validation).
- **Public Payment Page** — `/pay/[invoiceId]` — parents can pay fees via Razorpay Checkout without logging in. Signature-verified payment flow.
- **Razorpay Integration** — Order creation, payment verification, webhook handling with HMAC signature validation.
- **REST API Routes** — All features exposed via Next.js API routes (invoices, payments, webhooks, WhatsApp proxy).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Better Auth (email/password, Google OAuth) |
| Database | PostgreSQL via Supabase + Drizzle ORM |
| Payments | Razorpay SDK |
| WhatsApp | Evolution API (Baileys) — separate Docker service |
| Validation | Zod v4 |
| Linting | oxlint / oxfmt |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For WhatsApp announcements, you also need Evolution API running locally — see `INSTRUCTION.md`.

## Project Structure

```
app/
├── (protected)/          # Auth-required pages (sidebar layout)
│   ├── home/             # Dashboard
│   ├── payments/         # Fee tracking
│   ├── announcements/    # WhatsApp sender
│   └── logs/             # Activity log (placeholder)
├── api/
│   ├── auth/             # Better Auth endpoint
│   ├── invoices/         # Invoice CRUD
│   ├── payments/         # Razorpay order/verify
│   ├── webhooks/         # Razorpay event webhook
│   └── whatsapp/         # Evolution API proxy
├── login/                # Auth page
├── pay/[invoiceId]/      # Public payment page
├── layout.tsx
└── page.tsx

lib/
├── services/
│   ├── invoices.ts       # File-based invoice storage (swap point for DB)
│   ├── payment.ts        # Razorpay helpers
│   ├── webhook.ts        # HMAC signature verification
│   └── whatsapp.ts       # Evolution API HTTP client
├── db/                   # Drizzle schema + Postgres client
├── auth.ts               # Better Auth server config
└── auth-client.ts        # Better Auth client config

data/invoices/            # Sample invoice JSON files
components/               # UI components (shadcn + app shell)
```

## Deployment

- **Recommended:** VPS with `next start` (persistent process for long-running needs)
- **Also works:** Vercel (serverless) — WhatsApp features require a separate Evolution API instance
- Each school fork gets its own deployment with isolated DB and API keys

## Environment Variables

Copy `.env.example` to `.env` and fill in. Required:
- Better Auth secret
- Supabase Postgres URL
- Razorpay test/live keys
- Evolution API URL + API key (for WhatsApp)

## License

MIT
