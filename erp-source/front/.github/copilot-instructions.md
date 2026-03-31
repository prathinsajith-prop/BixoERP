# ERP Frontend — Copilot Instructions

Turborepo monorepo with 14 Next.js micro-frontend apps and 6 shared packages.

## Tech Stack

- **React 19**, **Next.js 15.1**, **TypeScript**
- **Tailwind CSS v4** (PostCSS, CSS variables for theming)
- **Zustand** for auth state (tokens, 2FA, tenant)
- **Axios** for API calls (interceptors handle token refresh + 401 retry queue)
- **Lucide Icons** via `@erp/icons` package
- No react-query/SWR — direct fetch with component-level `useState`
- No form library — native HTML5 validation
- No shadcn/ui — custom UI components in `packages/ui`

## Monorepo Structure

```
front/
├── apps/                    # 14 Next.js micro-frontend apps
│   ├── core/                # Main app (auth, dashboard, settings) — port 3000/4000
│   ├── hr/                  # HR module — port 4003
│   ├── finance/             # Finance module — port 4001
│   ├── ...                  # Each module has its own Next.js app
├── packages/
│   ├── ui/                  # Shared UI component library (custom, not shadcn)
│   ├── api-client/          # Axios-based API client with interceptors
│   ├── shared/              # Types, utils, constants
│   ├── shell/               # Shared layout (sidebar, header, auth guard)
│   ├── config/              # Shared Next.js / TS config builders
│   └── icons/               # Icon re-exports (Lucide)
├── screens/                 # Screen-level components shared across apps
├── turbo.json               # Turborepo pipeline config
└── package.json             # Workspace root
```

## App Internal Structure

Every app under `apps/` follows this layout:

```
apps/{module}/src/
├── app/                     # Next.js App Router pages
│   ├── layout.tsx           # Root layout (wraps with Shell)
│   └── {feature}/
│       └── page.tsx         # Route page
├── lib/                     # Service factories, API helpers
└── store/                   # Zustand stores (if any)
```

## Conventions

### Naming

- **Directories**: kebab-case (`auth-layout/`, `page-header/`)
- **Components**: PascalCase files and exports (`DataTable.tsx`, `PageHeader.tsx`)
- **Utilities**: camelCase (`formatCurrency.ts`)
- **Types**: PascalCase interfaces (`Employee`, `DepartmentResponse`)

### Imports

- Path alias: `@/*` maps to `src/*` within each app
- Package imports: `@erp/ui`, `@erp/shared`, `@erp/api-client`, `@erp/shell`, `@erp/icons`

### Components

- All interactive components use `"use client"` directive
- UI components in `packages/ui/` are generic with TypeScript generics (e.g., `DataTable<T>`)
- Forms use native HTML5 validation — no form libraries
- Dark mode via `.dark` class on root element (not system preference)
- CSS variables for accent colors (`--accent-*`)
- Compact mode support (0.75 scale toggle)

### Data Fetching

- Services in `lib/` create API client instances with Axios
- Components fetch data in `useEffect` with `useState` for loading/error/data
- No react-query or SWR — manual fetching pattern
- Token refresh handled automatically by Axios interceptors in `@erp/api-client`

### Auth

- Zustand store manages auth state (`accessToken`, `refreshToken`, `tenantId`)
- `localStorage` persistence for tokens
- `AuthGuard` component from `@erp/shell` protects routes
- 2FA flow with `twoFactorToken`
- OAuth support: Google, Microsoft, GitHub, Apple

### Styling

- Tailwind v4 with PostCSS (`postcss.config.mjs` in each app)
- Theme via CSS custom properties — not Tailwind config
- Responsive design with Tailwind breakpoints
- Reduced motion toggle support

## Commands

```bash
npm install                          # Install all dependencies
npm run dev                          # Dev all apps
npx turbo run dev --filter=core      # Dev specific app
npx turbo run dev --filter=core --filter=@erp/hr-app  # Dev multiple apps
npm run build                        # Build all
npm run lint                         # Lint all
npm run type-check                   # TypeScript check all
npm run clean                        # Clean build artifacts
```

## Docker Deployment

- Multi-stage Dockerfiles per module (e.g., `Dockerfile.hr`, `Dockerfile.finance`)
- `DOCKER_ENV=true` env var for production detection
- Each module builds as standalone Next.js app on separate port
- Non-root user in production containers

## Key Files

- `turbo.json` — Pipeline config (build depends on ^build, dev is persistent)
- `packages/ui/` — All shared UI components
- `packages/api-client/` — Axios client, interceptors, token refresh logic
- `packages/shell/` — Sidebar, header, AuthGuard, layout wrappers
- `apps/core/src/` — Auth flows, tenant selection, dashboard, settings
