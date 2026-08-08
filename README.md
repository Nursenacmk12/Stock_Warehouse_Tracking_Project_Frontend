# StockGuard — Frontend

React + Vite UI for the Stock Warehouse Tracking stack. Talks to the .NET API (default `http://localhost:5087`) via the Vite dev proxy.

Sibling API repo: `Stock_Warehouse_Tracking_Project_API`.

## Quick start

```bash
# 1) API (separate terminal) — http://localhost:5087, Swagger at /swagger
# 2) Frontend
cp .env.example .env   # optional; proxy works with empty VITE_API_BASE_URL
npm install
npm run dev            # http://localhost:5173
```

Or from PowerShell: `.\run-dev.ps1` (starts API + Vite when the API path is resolvable).

## Architecture

```
Browser (:5173)
  └─ Vite proxy  /api /health /hubs  →  API (:5087)
       ├─ REST (JWT Bearer)
       └─ SignalR /hubs/stock
```

- **Dev:** leave `VITE_API_BASE_URL` unset so requests stay same-origin and hit the proxy.
- **Prod:** set `VITE_API_BASE_URL` to the public API origin (no trailing slash).
- SAP mock fallback is controlled by `VITE_ALLOW_SAP_MOCK` (see env matrix). Prod builds default mock **off**.

## Role matrix

Roles come from the API JWT `role` claim. Frontend route guards (`AppRouter.jsx`) and sidebar (`Layout.jsx`) must stay aligned with API `[Authorize(Roles=…)]`.

| Area | SuperAdmin | Admin | WarehouseManager | Manager |
|------|:----------:|:-----:|:----------------:|:-------:|
| Dashboard / Stocks / Movements | ✓ | ✓ | ✓ | ✓ |
| Products / Categories / Operations / Alerts | ✓ | ✓ | ✓ | — |
| Warehouses (write on API: Admin+) | ✓ | ✓ | view (nav) | — |
| **Reports** | ✓ | ✓ | — | **—** |
| Analytics | ✓ | ✓ | — | ✓ |
| Integrations / Settings / Event Log | ✓ | ✓ | — | — |
| User admin | ✓ | — | — | — |

**Manager ≠ Reports:** `Manager` is analytics/read-oriented. Report export/email endpoints are `SuperAdmin`/`Admin` only on both FE and API — do not grant `/reports` to `Manager` without a matching API change.

## Environment matrix

Secrets belong in local `.env`, API `appsettings.*.json`, or host env — **never commit real values**. Frontend `.env` only needs Vite-prefixed vars; backend keys are documented here so a new developer can wire the full stack.

### Frontend (`VITE_*`)

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_API_BASE_URL` | FE `.env` | Absolute API base in production; empty = use Vite proxy in dev |
| `VITE_ALLOW_SAP_MOCK` | FE `.env` | `true`/`false`. Dev defaults on unless `false`; prod defaults off unless `true` |
| `VITE_ENTRA_CLIENT_ID` | FE `.env` | Entra SPA Application (client) ID — shows “Microsoft ile giriş” when set with tenant |
| `VITE_ENTRA_TENANT_ID` | FE `.env` | Directory (tenant) ID |
| `VITE_ENTRA_REDIRECT_URI` | FE `.env` | Default `http://localhost:5173/auth/callback` |

### Backend — JWT / DB / SAP

| Variable / key | Purpose |
|----------------|---------|
| `ConnectionStrings__DefaultConnection` | SQL Server |
| `Jwt__Key` | Signing key (≥ 32 chars) |
| `Jwt__Issuer` / `Jwt__Audience` | Token validation |
| `Jwt__ExpiresInMinutes` | Token lifetime (default 480) |
| `SapClient__Provider` | e.g. `Http` |
| `SapClient__UseMock` | Backend SAP mock client |
| `SapHttp__BaseUrl` | SAP HTTP gateway |
| `SapHttp__Username` / `SapHttp__Password` | SAP credentials |
| `SapHttp__Client` / `SapHttp__Language` | SAP client + language |
| `SapHttp__*Path` | Stock/product path templates |

### Backend — notifications

| Variable / key | Purpose |
|----------------|---------|
| `Integrations__Smtp__Enabled` | Enable SMTP provider |
| `Integrations__Smtp__Host` / `Port` / `UseSsl` | SMTP server |
| `Integrations__Smtp__UserName` / `Password` | SMTP auth (password write-only in API) |
| `Integrations__Smtp__FromEmail` / `FromName` | From header |
| `Integrations__SendGrid__ApiKey` | SendGrid API key |
| `Integrations__SendGrid__FromEmail` | SendGrid from |
| `Integrations__SendGrid__AlertEmail` | Default alert recipient |
| `Integrations__Slack__Enabled` / `WebhookUrl` | Slack incoming webhook |
| `Integrations__Teams__Enabled` / `WebhookUrl` | Teams incoming webhook |

Runtime overrides also exist via Settings UI → `GET/PUT /api/notifications/smtp|slack|teams` (URLs/passwords masked on GET).

### Backend — Entra ID SSO (Faz 6)

| Variable / key | Purpose |
|----------------|---------|
| `Authentication__Entra__Enabled` | Master switch (`false` = password-only; document default) |
| `Authentication__Entra__TenantId` | Directory (tenant) ID |
| `Authentication__Entra__ClientId` | Same SPA app registration client ID (audience for id_token) |
| `Authentication__Entra__RedirectUri` | Informational / FE alignment |
| `Authentication__Entra__DefaultRole` | Role when Entra has no mappable roles (default `Manager`) |
| `Authentication__Entra__AutoProvisionUsers` | Create local user on first SSO login |
| `Authentication__Entra__PreferEntraRoles` | Update DB role from Entra app roles when present |

**Session model:** Password and Entra both end in a **StockGuard JWT** stored in `localStorage` (Bearer). Entra id_token is exchanged via `POST /api/auth/entra/login` — not kept as the API auth token. HttpOnly cookies are out of scope for this POC.

**Role mapping:** Entra `roles` claim (app roles) → StockGuard `SuperAdmin` / `Admin` / `WarehouseManager` / `Manager`. Optional aliases like `Stock.Admin` are in `RoleMappings`. Unknown roles fall back to `DefaultRole`.

When `Enabled=false` or TenantId/ClientId missing: `GET /api/auth/entra/config` returns `{ enabled: false }`; FE hides or disables the Microsoft button.

Full commented examples: [`.env.example`](.env.example).

## OpenAPI TypeScript types

Swagger is published by the API at `/swagger` (Development) → `GET /swagger/v1/swagger.json`.

```bash
# Prefer committed snapshot (offline)
npm run generate:api-types

# Refresh snapshot from a running API, then regenerate
npm run generate:api-types:refresh

# Custom source
# OPENAPI_URL=http://localhost:5087/swagger/v1/swagger.json npm run generate:api-types:refresh
# OPENAPI_FILE=./openapi/swagger.json npm run generate:api-types
```

Outputs:

- `openapi/swagger.json` — OpenAPI snapshot
- `src/types/generated-api.d.ts` — `openapi-typescript` output

Hand-written helpers (if any) live in `src/types/api.d.ts` and must not replace the generated file.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server + proxy to `:5087` |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |
| `npm run generate:api-types` | Generate types from OpenAPI |
| `npm run generate:api-types:refresh` | Fetch live swagger + regenerate |
| `npm run test:e2e` | Playwright |

## Verify

1. API up: `http://localhost:5087/health` and `/swagger`
2. `GET /api/auth/entra/config` → `{ "enabled": false, … }` when Entra is off
3. `npm run generate:api-types` exits 0; `src/types/generated-api.d.ts` exists
4. `npm run build` succeeds
5. Log in with password; confirm `Manager` sees Analytics but not Reports
6. (Live SSO) Fill Entra env on FE + API, register redirect URI, click **Microsoft ile giriş**
