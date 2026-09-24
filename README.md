# GraphQL Profile

A lightweight, dependency-free single-page application (SPA) that lets a student sign in with their **Zone01 Ouujda** credentials and visualize their learning profile — total XP, current level, audit ratio, skills radar, and a list of completed projects — as an interactive dashboard.

**Live demo:** <https://graphiqlweed.netlify.app/>

---

## Table of Contents

- [Technologies](#technologies)
- [How It Works](#how-it-works)
- [Authentication](#authentication)
- [GraphQL Integration](#graphql-integration)
- [Data Flow](#data-flow)
- [Visualizations](#visualizations)
- [Features](#features)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Code Notes](#code-notes)
- [Future Improvements](#future-improvements)

---

## Technologies


| Technology | Purpose |
|---|---|
| HTML5 | Single entry page (`index.html`) |
| CSS3 | Styling (`assets/css/profile.css`) — CSS custom properties, flexbox, CSS grid, media queries |
| JavaScript (ES Modules) | All application logic (`<script type="module">`, native ES module imports) |
| GraphQL | Profile data queries against the Zone01 Oujda GraphQL engine |
| SVG | Charts generated as inline SVG strings (donut chart, radar chart) |
| Fetch API | All network requests (authentication + GraphQL) |
| `localStorage` | JWT token persistence |

---

## How It Works

The application is a client-side SPA with no build step. `index.html` contains a single empty `<main id="app">` container and loads one ES module:

```text
index.html
   └── assets/js/main.js
          └── router()          ← the only call at startup
                 ├── token exists? → profileTemplate() + initProfile()
                 └── no token?     → loginTemplate()   + initLogin()
```

`assets/js/router.js` is a minimal hash-less router: on every call it checks for a token in `localStorage` and renders either the **login page** or the **profile dashboard** by injecting a template string into `#app` and running the page's `init*()` function to attach event listeners and fetch data. Login and logout both call `router()` again to re-render.

### Runtime flow

```text
User
 ↓
Login form (login.js)
 ↓
POST /api/auth/signin  (Basic auth header)  →  JWT token
 ↓
Token saved to localStorage (storage.js)
 ↓
router() re-renders → profile page
 ↓
GraphQL query (graphql.js) with Bearer token
 ↓
Zone01 Ouujda GraphQL engine
 ↓
Data processed in profile.js + helpers.js
 ↓
DOM updated  +  SVG charts rendered (graph.js)
```

---

## Authentication

Implemented in `assets/js/api/auth.js`:

1. The user submits a **username or email** and **password** on the login form (`assets/js/pages/login.js`).
2. The credentials are concatenated as `identifier:password`, encoded with `btoa()` (Base64), and sent as an HTTP **Basic Authorization** header in a `POST` request to:

   ```text
   https://learn.zone01oujda.ma/api/auth/signin
   ```

3. On success the server responds with a **JWT as plain text** (wrapped in quotes; the code strips the surrounding quotes with a regex). On failure a generic error — *"Invalid username/email or password"* — is displayed in the form's `#error-message` element.
4. The token is stored in `localStorage` under the key `token` (`assets/js/utils/storage.js` provides `getToken()`, `setToken()`, `removeToken()`).
5. Every subsequent GraphQL request includes the header `Authorization: Bearer <token>`.
6. **Logout** removes the token from `localStorage` and re-runs the router, returning the user to the login page.

> The JWT payload contains a `https://hasura.io/jwt/claims` object with an `x-hasura-user-id` field. The GraphQL `user` query itself relies on the server-side JWT context rather than an explicit `id` argument, so no client-side JWT decoding is needed.

---

## GraphQL Integration

All profile data comes from a **single GraphQL query** (`PROFILE_QUERY` in `assets/js/pages/profile.js`) executed through one shared helper (`assets/js/api/graphql.js`).

- **Endpoint:** `https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql`
- **Method:** `POST`
- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <token>`
- **Variables:** the helper accepts a `variables` object (`graphqlRequest(query, variables)`), but `PROFILE_QUERY` uses none — all filtering is done inline in the query.
- **Error handling:** if the HTTP response is not OK or the response body contains `errors`, the helper throws with the first error message (or a fallback *"GraphQL request failed"*). Network failures and malformed JSON responses are also caught and surfaced as friendly errors. When the failure is an authentication problem (HTTP 401 or a JWT/expired-token error message), the helper removes the stored token and throws an `AuthError`; `initProfile()` catches it and re-routes to the login page.

### Query structure and how each field is used

| Query alias / field | What it requests | Filter | How the frontend uses it |
|---|---|---|---|
| `user` | `id`, `login`, `auditRatio`, `totalUp`, `totalDown`, `attrs`, nested `cohort: events → cohorts → labelName`, and two `audits_aggregate` counts (`succeeded` / `failed` closure types) | Implicit JWT user context | `login` → navbar username; `cohort[0].cohorts[0].labelName` → navbar subtitle (falls back to `"Unknown"`); `totalUp`/`totalDown` → audit donut chart and Up/Down figures. The `auditRatio`, `attrs`, and success/failed counts are fetched but **not displayed**. |
| `totalXP: transaction_aggregate` | `aggregate.sum.amount` | `type = "xp"` and `event.object.name = "Module"` | Formatted by `formatXP()` (B/KB/MB) → **Total XP** card. |
| `level: transaction_aggregate` | `aggregate.max.amount` | `type = "level"` and `event.object.name = "Module"` | **Level** circle in the summary card. |
| `skills: transaction` | `type`, `amount` (ordered `amount desc`) | `type` matches `%skill%` (case-insensitive) | Deduplicated by `getLatestSkills()`, top 8 by amount → **skills radar chart**. |
| `projects: transaction` | `amount`, `createdAt`, `path`, nested `object { id name type }` | `type = "xp"`, `eventId = 41`, `object.type = "project"`, ordered `createdAt desc` | Rendered as a scrollable list of project name, date, and XP. |

The response is expected in the shape `data.user[0]` (an array with the authenticated user), and each aggregate/list is read from `data.<alias>`.

---

## Data Flow

1. `initProfile()` sends `PROFILE_QUERY` via `graphqlRequest()`.
2. The raw response is unpacked (`data.user[0]`) and written directly into the DOM.
3. Helpers in `assets/js/utils/helpers.js` transform values:
   - `formatXP(value)` — divides by 1000 into **B / KB / MB** units (2 decimals when not an integer; `0 B` for falsy values).
   - `getLatestSkills(skills)` — keeps only the **first** (highest-amount) transaction per skill type, deduplicating repeats.
   - `formatSkillName(name)` — strips the `skill_` prefix, replaces hyphens with spaces, and title-cases.
   - `getLatestProjects(projects)` — deduplicates projects by name.
4. `profile.js` takes the top 8 skills by amount, renders both SVG charts into their containers, and appends one HTML block per project (project names are HTML-escaped before interpolation).
5. Rendering is a one-shot operation on page load — there is no polling, refresh interval, or live update.

---

## Visualizations

Both charts are pure **string-generated inline SVG** (no charting library), in `assets/js/components/graph.js`, injected via `innerHTML`.

### Audit Ratio — donut chart (`auditGraph(up, down)`)

- **Data:** the user's `totalUp` and `totalDown` audit byte totals.
- **Calculation:** `percent = up / (up + down) × 100`; a circle of radius 80 has `stroke-dasharray` set to its circumference and `stroke-dashoffset` to the unfilled portion, so the indigo arc represents the "up" share. Centered text shows `ratio = up / down` (or the raw `up` figure when `down === 0`), labeled *"Ratio"*. The SVG carries an `aria-label` describing the ratio.
- Rendered into `#audit-graph`; the numeric Up/Down totals below it are formatted with `formatXP()`.

### Skills — radar chart (`skillsRadarGraph(skills)`)

- **Data:** the top 8 skill types and their amounts (after deduplication in `getLatestSkills()`).
- **Calculation:** axes are placed at even angles around a 260×260 SVG (radius 80, starting at the top); each polygon vertex sits at `radius × (amount / maxAmount)` along its axis — values are normalized against the highest skill, so the shape stays readable regardless of the absolute amounts. Axis lines, vertex labels (with the `skill_` prefix stripped, anchored toward the chart so long names are not clipped), and a filled semi-transparent polygon are assembled as SVG strings. An empty skill list renders an empty-state message instead of a chart.
- Rendered into `#skills-graph`.

Both charts render once when the profile loads; they are not interactive and do not animate.

---

## Features

| Feature | Where | Data used |
|---|---|---|
| Login with username/email + password, inline error message | `pages/login.js`, `api/auth.js` | Zone01 credentials (Basic auth) |
| Token persistence + automatic session restore | `utils/storage.js`, `router.js` | JWT in `localStorage` |
| Logout | `pages/profile.js` | `removeToken()` + re-route |
| Total XP summary card | `pages/profile.js` | `totalXP` aggregate (Module XP) |
| Level indicator circle | `pages/profile.js` | `level` aggregate max |
| Audit ratio donut chart + Up/Down totals | `components/graph.js` | `user.totalUp`, `user.totalDown` |
| Skills radar chart (top 8) | `components/graph.js` | `skills` transactions |
| Recent projects list (name, date, XP) | `pages/profile.js` | `projects` transactions (`eventId: 41`) |
| Navbar with username, cohort label, logout | `pages/profile.js` | `user.login`, `cohort.labelName` |
| Responsive bento-style dashboard layout | `assets/css/profile.css` | — |

Not present in the code: routing by URL/paths, password reset, XP-over-time graphs, data caching, tests, or a build pipeline.

---

## Project Structure

```text
graphql-profile/
├── index.html                     # Entry point: empty #app container + main.js module
├── assets/
│   ├── css/
│   │   └── profile.css            # Full design system: variables, login page, dashboard grid, cards, error/empty states, responsive rules
│   └── js/
│       ├── main.js                # Bootstrap: imports and calls router()
│       ├── router.js              # Token check → renders login or profile page
│       ├── api/
│       │   ├── auth.js            # Basic-auth sign-in request → JWT token
│       │   └── graphql.js         # Shared graphqlRequest() helper (Bearer token, AuthError, error handling)
│       ├── components/
│       │   └── graph.js           # auditGraph() donut + skillsRadarGraph() radar (SVG generators)
│       ├── pages/
│       │   ├── login.js           # Login template + form submit handler (loading state, error display)
│       │   └── profile.js         # Profile template, PROFILE_QUERY, initProfile() rendering, error/empty states
│       └── utils/
│           ├── helpers.js         # formatXP(), getLatestSkills(), formatSkillName(), getLatestProjects()
│           └── storage.js         # getToken() / setToken() / removeToken() (localStorage)
├── README.md
└── tre.txt                        # Saved directory-tree listing (reference only; may be outdated)
```

---

## Running Locally

No build step, bundler, or `package.json` is required — the app runs on native ES modules and has **zero dependencies**.

### Requirements

- Any modern browser with ES module support
- A static file server (ES modules do **not** work from `file://` URLs)
- A valid Zone01 Oujda account to sign in

### Run it

From the project root, serve the folder with any static server, e.g.:

```bash
# Python 3
python3 -m http.server 8080

# or Node.js
npx serve .
```

Then open `http://localhost:8080` and sign in with your Zone01 Oujda username/email and password.

There is no install step, no dev command, no build command, and no preview command — no `package.json`, scripts, or tooling configuration exists in the repository.

### Environment variables

None. The API base URLs are hard-coded in the source:

- `assets/js/api/auth.js` → `https://learn.zone01oujda.ma/api/auth/signin`
- `assets/js/api/graphql.js` → `https://learn.zone01oujda.ma/api/graphql-engine/v1/graphql`

---

## Deployment

The site is hosted on **Netlify** at <https://graphiqlweed.netlify.app/>.

The repository contains **no `netlify.toml` and no build configuration** — which is consistent with the project's zero-build nature. Deployment is a static publish of the project root: Netlify serves `index.html` and the `assets/` folder as-is, with no build command needed. (The exact Netlify site settings — publish directory, headers, redirects — are not defined in the source code and cannot be verified from it.)

---

## Code Notes

A few observations from the code, useful for maintainers:

- `pages/profile.js` shows an inline error banner with a **Try again** button when the GraphQL request fails (except for auth errors, which re-route to login), and renders empty-state messages when there are no skills or projects.
- Project names from the API are HTML-escaped (`escapeHTML()` in `profile.js`) before being interpolated into markup.
- The GraphQL query filters on a hard-coded `eventId: 41` for the projects list, which ties it to a specific cohort/event in the Zone01 platform.

---

## Future Improvements

Suggestions based on the current codebase (not existing features):

- Move the hard-coded API URLs into a small config module (or environment-driven config at build time) so the backend can be swapped without editing source.
- Use `formatSkillName()` for readable radar labels (it is available in `helpers.js` but the radar currently renders the raw type minus the `skill_` prefix).
- Add an XP-over-time line/area chart — the data source (`transaction` with `createdAt`) already supports it.
- Show the already-fetched `auditRatio` and succeeded/failed audit counts somewhere in the dashboard.
- Remove the hard-coded `eventId: 41` filter so the projects list adapts to any cohort/event.
- Replace `innerHTML`-based rendering with small DOM-builder helpers to further reduce injection surface (project names are already escaped).
