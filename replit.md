# NASJ (نَسْج) — project context for Replit Agent

## What this is
A front-end demo of NASJ (نَسْج), a multi-role skills development, assessment, evidence verification and talent discovery platform. One integrated app with five role experiences and a demo role switcher (no real authentication). All people, universities and companies in the data are fictional.

Core journey: DISCOVER → LEARN → PRACTICE → GET EVALUATED → VERIFY → GET DISCOVERED.
Core rule: a skill is not simply claimed. It is demonstrated, assessed on clear criteria, and backed by evidence.

## Languages and direction
- **Landing page (`#home`) is English, LTR.** Headlines: Instrument Serif (gold italic accents), text: Geist, labels: Geist Mono.
- **The app (every `#role-page` route) is Arabic, RTL.** Font: Noto Kufi Arabic for everything; Reem Kufi only for the نَسْج logotype.
- `setDoc(lang, dir)` in `js/intro.js` switches `<html lang dir>` when moving between the landing and the app. `#app`, `#overlay` and `#toasts` also carry `dir="rtl"`.
- In the app, use logical Tailwind classes (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `border-s`). `I()` mirrors arrow/chevron icons automatically for RTL; the landing writes `<i data-lucide>` tags directly so it stays LTR.
- Numbers with symbols (`+38%`, `83%`) sit in `<span dir="ltr">` so they never flip.

## Stack (keep it this way unless asked)
- Plain HTML + vanilla JavaScript (no framework, no bundler). Scripts are classic `<script>` tags that share globals, loaded in order.
- Tailwind CSS 3.4 compiled by the CLI from `src/styles.css` into `css/styles.css` (committed, so the site also works without a build).
- GSAP 3.12.5 + ScrollTrigger, Three.js r128, Lucide icons 0.460.0, all from CDN with pinned versions in `index.html`.
- Fonts: Bricolage Grotesque (display), Geist (body), Geist Mono (numbers/labels), Reem Kufi (Arabic logotype).

## Run
- `npm install && npm run dev` → builds CSS and serves on port 3000.
- `npm run watch:css` in a second shell while editing classes.
- Deploy: static, `npm run build` copies `index.html`, `css/`, `js/` into `dist/`.

## File map
| File | Purpose |
|---|---|
| `index.html` | Landing markup (3D intro + sections), app shell (sidebar, top bar, role mega-menu), overlay/toast/tooltip containers |
| `src/styles.css` | Design tokens (`:root`) + component classes (`.card`, `.btn`, `.chip`, `.st`, `.seal`, `.seg`, `.toggle`, `.tbl`, `.mega`, `.node`…). Tailwind utilities load last so they can override. |
| `js/data.js` | All demo data: `PEOPLE`, `ROLES`, `NAV`, `STATES`, `SKILLS`, `PATHS`, `CHALLENGES`, `HACKS`, `PROJECTS`, `QUEUE`, `CANDIDATES`, `REQUIREMENTS`, `INSIGHTS`, `SESSIONS`, `ACTIVITIES`, `TEAM_PROJECT`, `VOLUNTEER`, `PULSE` |
| `js/core.js` | Helpers (`$`, `esc`, `I()` icon, `av()`, `stChip()`, `seal()`, `head()`, `stat()`), state `S`, sound `SFX` (Web Audio, no files), modal/drawer/toast/tooltip, SVG charts (`chart('line'|'bars', cfg)`, `spark`, `ring`, `hbars`), shell + mega menu, hash router, delegated actions |
| `js/intro.js` | Landing (English): `Net` = 3D hero where skill nodes link to evidence cards and a gold Verified seal pops on each match (pointer pulls lines, click connects); `Weave` = pinned scroll story where loose threads weave into fabric; role bento and verification ladder; `showLanding` / `showApp` |
| `js/views-student.js` | Student role: overview, skills, Learning Path Engine, assessments, challenges, hackathons + individual contribution page, clubs, volunteering, mentorship, projects, Skill Passport, public portfolio, community, profile |
| `js/views-roles.js` | Professor (evaluation interface with rubric), Company (requirements, challenge builder wizard, submissions, talent discovery, compare, shortlist, contact), Professional (insights, mentorship slots, reviews, path contributions, profile), Club (activities, team projects, record contributions), shared Market Pulse |
| `js/main.js` | Boot |

## Conventions
- **Routing:** `location.hash = '#<role>-<page>[-<arg>]'`, e.g. `#student-passport`, `#student-hack-mizan`, `#professor-evaluate-q1`, `#company-builder`. Empty or `#home` shows the landing. A view is `VIEWS.<role>.<page> = (arg) => htmlString`. Shared views live in `VIEWS.shared`.
- **Interactions:** never bind listeners per element. Add `data-act="name"` to a button and define `ACT.name = (el, event) => {}`. `data-go="role-page"` navigates. Forms use `data-form="name"` with `FORMS.name = form => {}` (submit is prevented globally).
- **Re-render:** mutate `S` then call `rerender()` (keeps scroll) or `buildShell()` when nav counts change.
- **Charts:** call `chart('line', {labels, series:[{name, vals, color, dash}], h, min, max})` or `chart('bars', {labels, vals, unit, h})` inside a view; they draw at real width after render with hover tooltips.
- **Icons:** `I('lucide-name', 'classes')`; `icons()` runs after every render.
- **Motion:** elements with `data-rv` animate in on render; numbers with `data-count` count up. Respect `RM` (prefers-reduced-motion).
- **Sound:** `SFX.play('tap'|'hover'|'open'|'success'|'toggle')`. A toggle lives in the top bar.

## Verification model (do not break)
States in order: `declared` → `assessed` → `evaluated` → `verified`.
Verified only when all four are true (see `criteria()` in `views-student.js`):
1. practical assessment completed, 2. score ≥ 70, 3. reviewed by a qualified evaluator, 4. evidence from ≥ 2 independent sources (evaluator reviews do not count as a source).
Participation certificates are stored with `excluded: true` and never count toward verification.

## Cross-role demo flows (state is shared in memory, resets on reload)
- Student → Learning Paths → "Simulate final assessment" → Graphic Design becomes Verified in the passport and in Company → Talent.
- Professor → Evaluation Queue → score rubric + feedback → submit → Reem's passport gains a professor evaluation.
- Company → Challenge builder → publish → appears in Student → Practical Challenges.
- Club → Record Contributions → Reem's skills gain a pending "Documented responsibility" record.

## Design rules
Dark obsidian minimalism, one gold accent (`--gold`), four verification colours, generous whitespace, mobile-first. Motion is slow and soft (`cubic-bezier(.22,1,.36,1)`), never noisy. Keep copy short and specific; no lorem ipsum.

## Good next steps
An English toggle for the app, real auth + database (e.g. Replit DB or Postgres) replacing `data.js`, file uploads for evidence, PDF export of the Skill Passport.
