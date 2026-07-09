# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Shopify **Hydrogen** headless storefront (Hydrogen `2026.4.3`) deployed to **Shopify Oxygen** (Cloudflare Workers–style runtime). Built on **React Router 7** (not Remix — see import rule below), Vite, and Tailwind CSS v4. Started from the Hydrogen "Skeleton" template.

## Commands

```bash
npm run dev         # Local dev server via Shopify CLI + MiniOxygen, runs codegen in watch mode
npm run build       # Production build (shopify hydrogen build --codegen)
npm run preview     # Build then serve the production bundle locally
npm run lint        # ESLint over the repo
npm run typecheck   # react-router typegen && tsc --noEmit
npm run codegen     # Regenerate GraphQL types + React Router route types
```

- **No test runner is configured** — there is no `test` script and no test files (`eslint-plugin-jest` is present but unused). Do not assume a test command exists; confirm with the user before adding one.
- Node `^22 || ^24` required.
- `.env` holds Shopify storefront credentials and `SESSION_SECRET` (required — context creation throws without it). The Customer Account API (`/account`) needs a public dev domain; see README step for setup.

## Architecture

### Request flow
`server.ts` is the Oxygen worker entrypoint. Each request:
1. `createHydrogenRouterContext` (`app/lib/context.ts`) builds the Hydrogen context — Storefront client, Customer Account client, cart handler, session, and cache — and passes it to React Router as the load context.
2. `createRequestHandler` delegates routing/rendering to React Router.
3. On a `404`, `storefrontRedirect` checks Shopify-managed URL redirects before returning.
4. Pending session changes are committed via `Set-Cookie` after the response.

### Loaders/actions access Shopify via context
In routes, reach Shopify through the loader/action context, e.g. `context.storefront.query(...)`, `context.customerAccount`, and `context.cart`. To add custom clients (CMS, reviews, Admin API), populate `additionalContext` in `app/lib/context.ts` — entries become available as both `context.propertyName` and `context.get(...)`.

### Routing
File-based via `@react-router/fs-routes` `flatRoutes()`, wrapped in Hydrogen's `hydrogenRoutes()` in `app/routes.ts`. Route files live in `app/routes/` using flat-route dotted naming (e.g. `products.$handle.tsx`, `account.orders.$id.tsx`, `[sitemap.xml].tsx`). Add manual routes to the array in `app/routes.ts`.

### GraphQL + codegen (two schemas)
`.graphqlrc.ts` defines **two** projects, and codegen writes matching type files consumed throughout the app:
- **Storefront API** (`default`): documents are inline queries across `app/**` (excluding `app/graphql/`). Types → `storefrontapi.generated.d.ts`.
- **Customer Account API** (`customer`): documents live only in `app/graphql/customer-account/`. Types → `customer-accountapi.generated.d.ts`.

These `*.generated.d.ts` files are build artifacts — never edit them by hand; run `npm run codegen` (or `dev`/`build`, which codegen automatically) after changing any GraphQL document. Shared Storefront fragments (cart, header, footer) live in `app/lib/fragments.ts`.

### Session
`AppSession` (`app/lib/session.ts`) is a cookie-based `HydrogenSession`. Mutating methods (`set`/`unset`) flip `isPending`, which `server.ts` uses to decide when to commit the cookie.

### root.tsx
Loads header/footer data and shop analytics, wraps everything in `PageLayout`, and sets `shouldRevalidate` to skip root-loader revalidation on sub-navigation (perf optimization) except on mutations.

## Critical conventions

- **React Router, not Remix.** Import routing hooks/components from `react-router` (e.g. `useLoaderData`, `Link`, `Form`). Never import from `@remix-run/*`, and **never** from `react-router-dom`. See `.cursor/rules/hydrogen-react-router.mdc` for the full Remix→React Router package mapping.
- **Path alias:** `~/*` → `app/*`.
- **Tailwind v4** is wired through the `@tailwindcss/vite` plugin (`vite.config.ts`); entry is `app/styles/tailwind.css`. No `tailwind.config.js`.
- `build.assetsInlineLimit: 0` in `vite.config.ts` is intentional — keeps assets un-inlined so a strict CSP works. Don't change without reason.
- `guides/` contains reference docs (search, predictive search) for existing feature implementations.
