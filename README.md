# Family Medical Records

Progressive Web App (PWA) to record and browse family medical events.

## Features

- 📋 Medical event tracking (consultations, emergencies, surgeries, exams, etc.)
- 👨‍👩‍👧‍👦 Associate events with family members
- 📸 Link document photos from Google Photos
- 💰 Reimbursement tracking (ISAPRE and Complementary Insurance)
- 📱 Mobile-first design (installable PWA)
- 🔍 Search and filter by patient, type, and date range

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend  | React + TypeScript + Vite |
| PWA       | vite-plugin-pwa (Workbox) |
| Styling   | Tailwind CSS |
| Backend   | Supabase (PostgreSQL) |
| Photos    | Google Photos API |
| Tests     | Vitest + Playwright |
| CLI       | Commander.js |

## Requirements

- Node.js 18+
- Supabase account (free tier)
- Google Cloud project with Google Photos API enabled

## Setup

1. Clone the repository
2. `npm install`
3. Copy `.env.example` to `.env` and configure the variables
4. Run the SQL schema in Supabase (`src/infra/supabase/schema.sql`)
5. `npm run dev`

## Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run test         # Unit tests
npm run test:coverage # Tests with coverage
npm run test:e2e     # E2E tests (Playwright)
npm run cli          # CLI (feature parity)
```

## CLI

```bash
npm run cli -- miembros listar
npm run cli -- evento crear --tipo "Consulta Médica" --paciente "Juan" --fecha "2024-01-15" --descripcion "Control anual"
npm run cli -- evento listar
npm run cli -- evento ver <id>
```

## License

Private use.
