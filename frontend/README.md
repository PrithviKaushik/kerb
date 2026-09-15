# KERB · Frontend

Next.js 16 (App Router) product shell for the KERB track-limit steward-assist
system. Sees the same structured evidence contracts the backend emits —
never internal CV internals.

## Page map

| Route | Purpose |
| --- | --- |
| `/` | Cinematic landing with radial nav wheel |
| `/demo` | Live pipeline demo (committed A5 evidence bundle) |
| `/incidents` | Prioritized incident queue |
| `/incidents/[incidentId]` | Incident evidence workstation |
| `/evidence` | Evidence gallery + live summary |
| `/knowledge` | Rule deck, inspector, dependency graph |
| `/reports` | Historical archive + steward review workspace |
| `/how-it-works` | Editorial explanation of the reasoning pipeline |
| `/analysis` | Upload/probe/extract workstation (legacy entry) |

## Run

```bash
npm install
npm run dev          # http://localhost:3000
```

The API client defaults to `http://127.0.0.1:8000`; override with
`NEXT_PUBLIC_API_BASE_URL`.

## Setup

See the root `README.md` for backend setup and the out-of-the-box demo.