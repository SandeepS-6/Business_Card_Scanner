# BusinessCardScanner

Production-style **frontend UI** for multi-tenant business card scanning and event lead management. Mock data and services only — no backend.

## Stack

React · TypeScript · Vite · Tailwind CSS · Radix/shadcn-style UI · React Router · TanStack Query · React Hook Form · Zod · Lucide · Recharts · dnd-kit

## Run

```bash
npm install
npm run dev
```

## Demo accounts

Password for all: `demo123`

| Email | Role |
|-------|------|
| `super@bcs.app` | Super Admin |
| `admin@nexus-events.example` | Org Admin (Nexus — teal theme) |
| `maya@nexus-events.example` | User |
| `admin@atlas-field.example` | Org Admin (Atlas — amber theme) |

## Demo flow

Login → Dashboard → Capture Card → Processing → Review (confidence) → Duplicate dialog → Contact → Leads / Follow-ups → Email/WhatsApp templates → CRM sync → Offline queue (toggle Wi‑Fi in header) → Organization branding (switch org as Super Admin).

## Architecture

`UI pages` → `src/services/api.ts` → `src/data/mock.ts`

Swap the service layer for real APIs later without redesigning screens. Theme tokens use CSS variables driven by organization branding.
