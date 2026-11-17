# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-11-16] Game rules live in `src/sim/` and must stay pure**
   Do instead: no DOM, `Math.random` or `Date.now` there; pass `Rng` and epoch ms in, and add a Vitest test for every new sim function.
2. **[2026-11-16] Tuning numbers belong in `content/balance.json`**
   Do instead: add a key there and read it through `content.balance`; prove a tuning change with `npm run sim` output.
3. **[2026-11-16] Content must validate before build**
   Do instead: run `npm run validate` after touching `content/`; every species and occurrence needs a `sources` entry.

4. **[2026-11-16] The built-in browser pane is usually hidden, so `requestAnimationFrame` and CSS animations stall**
   Do instead: drive the game with the dev harness (`await T.start(); await T.fast(60)`, `T.until('fight')`, `T.set(d => …)`), and take a throwaway screenshot before the real one because the first lags a frame.
5. **[2026-11-16] Harness and tool output can be enormous**
   Do instead: return counts and short summaries from page scripts, never raw logs or whole state.

## Research Workstream
1. **[2026-11-17] FishBase and SeaLifeBase pages read fine through web-fetch; sealifebase.se often resets the first request**
   Do instead: fetch summary pages in batches of 3-5 species per web-fetch call, retry once on ECONNRESET, and follow the "Length-weight" link for the LWR table when the Bayesian set misses the record weight by more than 30%.
2. **[2026-11-17] FishBase Bayesian length-weight sets are TL-based and often miss the record weight**
   Do instead: compute W at max length against the IGFA record (or FishBase max weight) for every set, and log the chosen set and its deviation in the species `sources[].supports` and the region dossier.

## Shell & Command Reliability
1. **[2026-11-16] Project path contains a space**
   Do instead: always double-quote the project path in shell commands.

## Domain Behavior Guardrails
1. **[2026-11-16] Toolchain is newer than most examples (Vite 8, Vitest 4, TS 7, Preact 11, zod 4)**
   Do instead: check the installed package's types before using an API from memory.

2. **[2026-11-16] Preact 11 does not add `px` to numeric inline styles**
   Do instead: write `style={{ width: '48px' }}` or a template string, never a bare number (0 and unitless props excepted).
3. **[2026-11-16] suncalc v2 has named exports and nullable sun times**
   Do instead: `import { getTimes } from 'suncalc'` and handle `times.sunrise === null`.
4. **[2026-11-16] tsx resolves `foo.node` as a native addon**
   Do instead: never name a TypeScript module `*.node.ts`; use `loadNode.ts`.

## User Directives
1. **[2026-11-16] Andy wants continuous building, not a stop per milestone**
   Do instead: keep going past milestone gates; record spec departures in `docs/DECISIONS.md`.
2. **[2026-11-16] The repo is `aingebritson/castaway-angler-game` (public, deployed to GitHub Pages from `main`); ignore the older `castaway-angler`**
   Do instead: push to `origin` only. Every push to `main` goes live, so run `npm run build` and `npm test` first, and keep private details out of commits.
