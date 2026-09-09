# BusinessCardScanner

Production-style **frontend UI** for multi-tenant business card scanning and event lead management. Mock data and services only — no backend.

## Stack

React · TypeScript · Vite · Tailwind CSS · Radix/shadcn-style UI · React Router · TanStack Query · React Hook Form · Zod · Lucide · Recharts · dnd-kit

## Run

```bash
npm install
npm run dev
```

## Architecture

`UI pages` → `src/services/api.ts` → `src/data/mock.ts`

Swap the service layer for real APIs later without redesigning screens. Theme tokens use CSS variables driven by organization branding.
