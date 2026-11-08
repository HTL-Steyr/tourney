# Repository Guidelines

## Project Structure & Module Organization

This repository is a Bun + Turbo monorepo.

- `apps/admin`: Nuxt admin dashboard (tournament operations, management UI).
- `apps/viewer`: Nuxt public/client viewer app.
- `apps/api/supabase`: local Supabase config, SQL migrations, seed data, and image resources.
- `apps/user-creator`: small Node script for bootstrapping users.
- `packages/core`: shared Nuxt layer/components/styles used by apps.
- `packages/types`: shared TypeScript types (includes generated Supabase types).
- `docs`: VitePress documentation site.

## Build, Test, and Development Commands

Run all commands from the repo root.

- `bun install`: install workspace dependencies.
- `bun run dev`: run all workspace `dev` tasks via Turbo.
- `bun run dev:admin` / `bun run dev:viewer`: run one frontend locally.
- `bun run build`: build all workspaces.
- `bun run format` / `bun run format:write`: check/fix formatting across packages.
- `bunx turbo run check-types`: run type checks (`vue-tsc`/`tsc`) where configured.
- `bun run start:supabase` / `bun run stop:supabase`: start/stop local Supabase stack.
- `bun run types:supabase`: regenerate DB types after schema changes.

## Coding Style & Naming Conventions

- Follow `.editorconfig`: UTF-8, LF, 2-space indentation, trim trailing whitespace, final newline.
- Formatting is enforced with Prettier (`.prettierrc`): no semicolons and Tailwind class sorting.
- Vue component files use `PascalCase` (example: `TournamentFlow.vue`).
- Composables use `useX` naming (example: `useLiveTournaments.ts`).
- Keep shared domain types in `packages/types/src` and import them instead of redefining.

## Testing Guidelines

There is currently no unified `test` script in the workspace. For each change:

- Run `bun run format` and `bunx turbo run check-types`.
- Smoke-test affected apps locally (`bun run dev:admin` or `bun run dev:viewer`).
- For performance/load checks, use the existing k6 script: `k6 run apps/viewer/test/load.js`.

## Commit & Pull Request Guidelines

- Use Conventional Commits; this repo uses `semantic-release` (`feat:`, `fix:`, `chore:` etc.).
- Prefer scoped messages when helpful, e.g. `feat(viewer): add live standings filter`.
- PRs should include:
  - clear summary and reason for the change,
  - linked issue/ticket,
  - screenshots/videos for UI changes,
  - notes for schema/env changes (including migration and `types:supabase` updates).

## Security & Configuration Tips

- Use each app’s `.env.example` as the source of required variables.
- Never commit secrets or production keys.
- Keep SQL migrations in `apps/api/supabase/migrations` as the source of truth for DB changes.
