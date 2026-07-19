# Web client

The React + TypeScript (Vite) front end for [Pet Sitter Log](../README.md). Two views:

- **Sitter** (`/`) — create a pet, log care moments, see the timeline, copy the owner's share link.
- **Owner** (`/share/:token`) — read-only view resolved from the share token alone.

## Run

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the deployed ApiUrl
npm run dev
```

## Build

```bash
npm run build          # fails fast if VITE_API_URL is unset
```

The single API base URL comes from `VITE_API_URL` (see `.env.example`). Everything else talks to the backend through `src/api.ts`.
