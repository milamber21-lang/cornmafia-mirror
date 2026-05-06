Corn Mafia is in V1 delivery and feature-expansion mode.

Source of truth:
- Use the current uploaded repo snapshot, SQL dump, and repo docs first.
- Start with README.md and docs/*.md when available.
- Ignore old external snapshot URLs unless I explicitly ask to use them.
- Do not use this old source as truth:
  https://raw.githubusercontent.com/milamber21-lang/cornmafia-mirror/main/support/_snapshot.txt
- Never assume file, script, route, SQL, or config contents. Ask me to provide missing files.

Core architecture:
- DB-first Next.js 16 / React 19 / PostgreSQL app under apps/web.
- App reads from web_view or approved DB read functions.
- App writes through web_api.
- App must not directly CRUD web_priv.
- Runtime role is cm_client; owner/migration role is cm.
- Admin, member, and public workflows stay separate when behavior differs.
- V1 includes member content/media/series authoring and YouTube channel admin.

When generating code:
- Generate full files, not patches or fragments, unless I explicitly ask.
- Every code file must include its path at the top inside the file.
- Use separate code blocks per file, each starting with the file path comment.
- For multi-file output, prefer downloadable zip/tar archives.
- Archives must be root-clean: when I choose “Extract Here,” they unpack files/folders directly into the current repo directory, with no wrapper folder.
- Correct archive shape: README.md, docs/..., apps/..., infra/..., scripts/...
- Incorrect archive shape: cornmafia-update/README.md, cornmafia-update/docs/...
- Keep all output UTF-8 safe.

TypeScript:
- Never use any, any[], or Record<string, any>.
- Prefer unknown and narrow with type guards or runtime validation.
- Use concrete event/callback types when known.
- Do not use unsafe e as Error catch handling.
- Keep imports clean and server-only imports out of client components.

Existing logic:
- Preserve working logic unless the requested task requires a change.
- Do not simplify, remove, or rename active behavior without checking usage.
- Ask before deleting anything that may be obsolete.
- Fix route/client/DB contract changes together.

App conventions:
- Follow docs/codebase_rules.md.
- Use rows for collections, row for current item, doc for single-row route responses.
- Mutations return ok: true, and doc only when needed.
- API routes must guard themselves.
- Panels separate topError, metaError, submitting, and metaLoading.
- Failed saves must not call onSaved or auto-close.

SQL:
- Follow docs/codebase_rules.md.
- Use web_priv/web_api/web_view boundaries.
- Use uppercase SQL keywords, lowercase object names, schema-qualified references, tabs, readable LEFT JOIN style, and fixed search_path for SECURITY DEFINER functions.
- Generate full SQL object definitions when requested.
- Mirror current owner, grant, delimiter, header, and search_path patterns.

Styling:
- Follow docs/style_system.md.
- TS/TSX owns structure, state, data, and composition.
- CSS owns visual styling.
- Inline style is forbidden except documented runtime/computed exceptions.
- Current color split is approved:
  base-colors.css = raw palette
  themes.css = theme role mapping
  tokens.css = non-color design tokens
- Do not hardcode visual tokens in TS/TSX.

Audit mode:
- If I ask for audit/analysis only, generate no code.
- Check real files, imports, route usage, SQL contracts, and current docs.
- Be mechanical, exact, and project-specific.
- Classify findings by P0, P1, P2, P3 when useful.

Documentation:
- Keep README short.
- Durable truth lives in docs/.
- Repo docs override uploaded ChatGPT project files when a fresh snapshot is provided.