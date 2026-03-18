# ACM @ UIUC — RSVP Portal

Frontend for the ACM @ UIUC event RSVP system. Built with React, TypeScript, Vite, and Mantine UI.

## Stack

- **React 19** + **TypeScript**
- **Vite** — dev server and bundler
- **Mantine v8** — UI components and notifications
- **`@acm-uiuc/core-client`** — typed SDK for the Core API
- **`@azure/msal-react`** — Microsoft SSO authentication
- **Cloudflare Turnstile** — bot protection on RSVP/cancel/profile actions
- **React Router v7** — client-side routing

## Getting Started

```bash
yarn install
yarn dev        # local-dev (points to QA API)
yarn dev:qa     # dev build against QA API
```

## Build

```bash
yarn build          # production build
yarn build:dev      # dev environment build
yarn build:prod     # production environment build
yarn typecheck      # type-check without emitting
```

## Environments

Configured in `src/config.ts` via `VITE_RUN_ENVIRONMENT`:

| Environment | Value       | API                              |
|-------------|-------------|----------------------------------|
| Local dev   | `local-dev` | `core.aws.qa.acmuiuc.org`        |
| QA/Dev      | `dev`       | `core.aws.qa.acmuiuc.org`        |
| Production  | `prod`      | `core.acm.illinois.edu`          |

## Project Structure

```
src/
├── common/
│   ├── types/          # Shared types (re-exported from SDK + enrichment types)
│   └── utils/          # apiError, notifyError helpers
├── components/
│   ├── AuthContext/    # MSAL auth provider + useAuth()
│   ├── EventsContext/  # Fetches all events on mount; useEvents()
│   ├── ProfileContext/ # Fetches RSVP profile after auth; useProfile()
│   ├── RsvpsContext/   # Fetches user RSVPs, enriches with event data; useRsvps()
│   ├── Layout/         # MainLayout shell
│   └── Logo/
├── pages/
│   ├── events/         # Upcoming events list + RSVP flow
│   ├── rsvps/          # My RSVPs (view, cancel)
│   ├── profile/        # RSVP profile create/edit
│   └── Home.page.tsx   # Dashboard
└── App.tsx / Router.tsx / main.tsx
```

## Architecture Notes

- **Context-based caching** — `EventsContext`, `ProfileContext`, and `RsvpsContext` each fetch once and expose a `refetch()` for manual refresh. Provider order in `main.tsx`: `Auth → Events → Profile → RSVPs`.
- **SDK usage** — all API calls go through `@acm-uiuc/core-client`. Auth tokens (`xUiucToken`) and Turnstile tokens (`xTurnstileResponse`) are passed as typed request parameters, not headers.
- **Empty-body responses** — RSVP POST and DELETE return 201/200 with empty bodies. Use the `Raw` SDK variant (`apiV1Rsvp...Raw`) and skip `.value()` to avoid JSON parse errors.
- **Error notifications** — all errors surface via `showApiErrorNotification()` (`src/common/utils/notifyError.tsx`) which shows a Mantine notification with the error title, message, optional request ID, and a mailto report link.
