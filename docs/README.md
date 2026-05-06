# Corn Mafia

Corn Mafia is a Discord-first, role-aware guild platform in V1 delivery state.

The platform is built as a DB-first Next.js web app. PostgreSQL owns private truth and business rules where migrated. The app reads through approved `web_view` read surfaces or approved read functions, and writes through `web_api` business functions. Runtime app code must not directly CRUD `web_priv` private truth tables.

## Current baseline

- Next.js 16
- React 19
- Turbopack build path
- ESLint 9 flat config
- strict TypeScript
- PostgreSQL-backed data and business rules
- Docker runtime with web and database services
- Discord identity and role-aware access
- DB-backed admin, member, public content, media, navigation, and authoring surfaces
- Bootstrap and operator scripts for V1 deployment support

## Core docs

Use the docs in this order:

1. `docs/project_definition.md`
   - Current architecture, scope, boundaries, active surfaces, and non-negotiable rules.
2. `docs/codebase_rules.md`
   - TypeScript, app surface, route, panel, table, helper, SQL, generation, audit, and working rules.
3. `docs/style_system.md`
   - CSS ownership, token/theme ownership, brand implementation, UI primitive styling rules, and inline style exceptions.
4. `docs/roadmap.md`
   - Post-foundation roadmap and future sequencing.
5. `docs/chatgpt_project_instructions.md`
   - Suggested ChatGPT project behavior for future assisted work.

## Working principle

If an older note, prompt, archived snapshot, or memory conflicts with the current repository and these docs, use the current repository and `docs/project_definition.md`.

Do not use old external snapshot links as source of truth.

## Artifact convention

When generating replacement files for this project, downloadable archives should extract directly into the current repository root. The archive should not contain an extra wrapper folder. After extraction, paths should appear directly as `apps/`, `docs/`, `infra/`, `scripts/`, or root files.
