# PreInk

A web app that sells a branded "studio launch kit" to new permanent makeup (PMU) artists: consent forms, aftercare cards, policies, a price menu and launch materials, with the artist's studio name, logo and chosen style on every page. Three one-time tiers, decided by the owner 2026-11-17: Essentials $29 (client safety forms), Studio $49 (plus policies, price menu, pricing calculator; the main offer), Launch $79 (plus model call script, first ten clients plan, launch checklist, and all five styles). Tiers live in `TIERS` in `src/kit/catalog.ts`; consent, health history, aftercare and photo release must stay in every tier. Tagline: "The business kit for new PMU artists."

Live domain: getpreink.com. Private staging: preink.dev. Both are in the owner's Cloudflare account.

## Who you are working with

The owner is not a developer. Their wife is a working PMU artist, which is the inside knowledge behind the product. They write short messages, often in imperfect English, and they talk about outcomes, not implementation.

- Explain every setup step simply: exactly what to click or paste, one step at a time.
- Make the technical decisions yourself and state each one in a line. Do not offer menus of technical options.
- When a message is ambiguous, say the two readings briefly, pick the likelier one, and keep moving. Ask a question only when the answer changes what gets built.
- They prefer seeing a working result over reading plans. Build, then show it in the browser pane.
- Show the "Still needed" list (bottom of this file) at the end of every phase, and keep it current.
- Before spending Higgsfield credits, state the credit cost and wait for a yes. So far 1.5 credits were spent: 0.5 on the share image (`public/og.jpg`, sources in `design/share-image/`) and 1 on four studio photos (`public/photos/`, sources in `design/photos/`). A 5-second video costs about 35 credits; it was deferred because it slows the page on phones.
- They said: do not make it look like AI wrote it. That covers design and copy. See "Design and copy" below.

## How to work

1. Read the relevant files before changing anything. The code is small; read it instead of guessing.
2. Decide the approach, say it in one or two lines, then build.
3. Add or update tests with every change. Run `npm run typecheck`, `npm test` and `npm run build` before saying something works.
4. Look at the result in the browser at phone width (375px) and desktop width. Check the console for errors. Use the built version (`preink-built`) when checking security headers.
5. Report plainly: what changed, what was verified, what is not done, and which choices were your own defaults for the owner to confirm.
6. Do not commit, push, deploy, or change anything in the Cloudflare account without the owner's go-ahead for that specific action.

Reply style: lead with the result. Short paragraphs and bullets. No jargon without a plain-words explanation. Never claim something is tested, deployed or reviewed unless it is.

## Rules that must not be broken

These come from the owner's brief. Legal compliance is the highest priority.

- **AI never writes or edits legal text.** Consent forms, the health history form and the photo release use fixed, versioned template wording only. AI may help with policy tone, price suggestions, the client plan, scripts and text-logo options, and that output must be validated and length-limited before it reaches a PDF.
- **Never state a regulation from memory.** Every jurisdiction rule must come from a page fetched from an official government or regulator source, stored with source URL, exact supporting excerpt, date checked, reviewer and status. A second agent re-checks each rule from the source without seeing the first result; a mismatch means "needs review". If nothing is found, record "no specific requirement found".
- **Only a person can mark a jurisdiction "verified".** `src/kit/jurisdictions.ts` starts empty on purpose, and a test enforces it. Unverified places get the clearly labeled general version.
- **Every form carries the "template, not legal advice" line.** A test enforces it.
- **Never collect or store the artist's clients' data or any medical information.** Collect only studio branding and an email address.
- **No marketing claim of legal compliance or full state coverage.** A test fails on phrases such as "legally compliant" or "all 50 states".
- **Secrets live only in Workers secrets** (or `.dev.vars` locally, which is git-ignored). Never in code, never pasted into chat.
- **A paid order must never be left undelivered.** Fulfil only from a signature-verified, idempotent Stripe webhook; retry failures, then alert the owner.

## What is built (Phase 1)

Static site, plain TypeScript with Vite, no framework. Fonts are self-hosted through `@fontsource`.

| Path | What it is |
|---|---|
| `index.html` | Landing page. All copy is static HTML for SEO. JSON-LD for Organization, WebSite and FAQPage. |
| `kit/index.html` + `src/main.ts` | Kit builder: five-question form and a live watermarked preview with a style switcher. |
| `privacy/`, `terms/`, `refunds/` | Draft legal pages, marked as drafts and `noindex` until a lawyer reviews them. |
| `src/landing.ts` | Draws the sample pages on the landing page with the real renderer. |
| `src/lib/validate.ts` | The single gate for all input: allow-listed choices and cleaned text. No browser dependencies, so the server can reuse it. |
| `src/lib/logo.ts` | Logo upload checks: type by signature bytes (PNG, JPEG, WebP only; SVG refused), 2 MB limit, redrawn on a canvas. |
| `src/lib/html.ts` | The `html` tagged template. It escapes every interpolated value. Build all markup with it. |
| `src/kit/catalog.ts` | Edition config (PMU), services, logo fonts, brand colors, states. A tattoo edition later is a config change. |
| `src/kit/styles.ts` | The five styles as data: layout switches plus design tokens. A new style is one new entry. |
| `src/kit/documents.ts` | Preview content of each document. |
| `src/kit/assemble.ts` | Turns the artist's input into the ordered page list. Pure function. |
| `src/kit/render.ts` | Turns pages into HTML strings. Runs in the browser now, and is meant to run on the server for PDFs. |
| `src/kit/jurisdictions.ts` | Which places are verified (none yet) and the notices shown otherwise. |
| `src/styles/kit.css` | Page layouts. Everything inside a page is in `em`, scaled from the page width, so a thumbnail and a full-size page are identical. Set font size only on leaf elements. |
| `public/_headers` | Security headers for Cloudflare Pages, and `noindex` for preink.dev and `*.pages.dev`. |
| `tests/` | Vitest: input validation, logo checks, kit assembly and rendering, page and SEO checks. |

Design decisions already made:

- **The preview holds back most wording.** `greek` blocks send only a heading and a line count to the browser, drawn as grey bars. The full templates will live server-side and be assembled into PDFs only after payment. Never put full legal text in client code.
- **Strict Content-Security-Policy with no inline styles or scripts.** Never emit `style="..."` attributes or inline event handlers. Set dynamic values with `element.style.setProperty` or classes. Tests enforce this for rendered pages and the HTML files.
- **Wording is identical across styles.** A test checks that the assembled kit does not change with the style.
- **The gift certificate was removed** at the owner's request. Do not add it back.
- **Refund policy is confirmed by the owner:** 14 days, for a kit that did not arrive, will not open, or materially differs from the preview.
- **PDF generation plan:** render the same HTML with Cloudflare Browser Rendering so the PDF matches the preview exactly. This needs the Workers Paid plan (about $5 a month). `pdf-lib` cannot turn HTML and CSS into a PDF.
- **Delivery email goes through a transactional service** (Resend), not GoHighLevel. GoHighLevel is for the contact list, onboarding emails and abandoned-preview follow-ups.
- **AI model for in-app features:** Claude through the official TypeScript SDK in a Worker. Load the `claude-api` skill before writing that code.

All draft form wording, the example prices on the price menu, and the three legal pages were written by Claude and have not been reviewed by a lawyer. Studio policies use "non-refundable booking fee" wording (never "deposit"), one free reschedule, and an initialed and signed acknowledgment, following industry guidance on card disputes (see `reports/PMU starter kit market gaps.md`); a "Using Your Policies" guide for the artist sits in the Studio tier. Both need lawyer review and must never promise dispute outcomes. Pre-care sheets (added 2026-11-17, one per service, in every tier) and aftercare cards are healing and health guidance: their withheld sections must be written with, and approved by, a working PMU artist before launch.

## Commands

```bash
npm run dev        # local site at http://localhost:5173
npm test           # all tests
npm run typecheck
npm run build      # production build into dist/
npm run preview    # serve the build at http://localhost:4173 with the real security headers
```

`.claude/launch.json` defines `preink-dev` and `preink-built` for the browser pane.

For Cloudflare, use the `cf` CLI unless the project has a Wrangler configuration file (it does not yet). The Cloudflare plugin connection is signed in to the owner's account. The `cf` CLI sign-in was started twice and never completed.

## Design and copy

- Editorial and warm, aimed at beauty professionals: paper background, ink text, one clay accent, Newsreader serif headings, Hanken Grotesk for interface text. Hairlines instead of shadowed cards.
- No purple gradients, glass effects, emoji icons, or rows of identical icon cards.
- Vocabulary: "pigment", "clients", "studio". Never tattoo-shop wording.
- Copy is plain and specific. Say what the thing is and what it does. No hype words, no rhetorical questions, no promises about results.
- Messaging (from the market research, 2026-11-17): lead with no Canva or design work, keeping booking fees, one payment instead of a monthly app, and the pricing and first-clients plan courses leave out. The home page compares PreInk with "template file" and "consent app" without naming competitors; keep every cell true. No testimonials until real ones exist; any from the owner's wife or free beta users must disclose the connection (FTC Endorsement Guides). Phase 3: verified states must show "Official source: [link], checked [date]" on the form.
- Mobile first. Check every change at 375px wide.
- Never generate pictures of brows, lips, faces, artists, clients or before-and-after results. Visitors would read them as real work. Atmosphere photos only: desks, tools, cards, rooms, with no text, people or hands.
- Photos: add phone (640) and desktop (1024) JPG sizes in `public/photos/`, with width, height, a real description and `loading="lazy"`. Tests check this.
- Motion lives in `src/landing.ts`: `data-reveal` eases sections in, `data-live-sample` types the studio name and cycles the five styles. Hidden starting states must sit under `.js-motion`, which is only added when the visitor has not asked to reduce motion. A test enforces this.

## Phases

1. **Preview page** (built, running locally, not yet on preink.dev)
2. **Payment and delivery:** Stripe Checkout with Stripe Tax in test mode, signature-verified idempotent webhook, PDF generation, private R2 storage, emailed signed expiring link, magic-link login for re-downloads, refund and dispute handling that revokes the link, coupon and partner codes with a sales report
3. **Rules table and admin:** D1 tables for templates and jurisdiction rules with version history, research and verifier agents, admin behind Cloudflare Access, audit log
4. **GoHighLevel and agents:** purchase and abandoned-preview webhooks, law monitor, new-jurisdiction skill, template skill, support agent, weekly report
5. **Go-live** on getpreink.com

Stop and show a working result at the end of each phase.

## Queued next, in this order

1. Marketing claims review of the landing page: a first pass is done, without the skill. Fixed: "Everything you hand a client" (overclaim), "the statements it requires" (implied completeness, now "state-specific statements found in those sources"), "the paperwork your course did not hand you" (assumption), "about two minutes" (unmeasured, now "a few minutes"). Still open: the page describes payment, email delivery and re-download, which are not built, and the "traced to official sources and checked by a person" claim needs the research records to exist before go-live. Re-run with `product-legal:marketing-claims-review` before launch.
2. Competitive brief: done 2026-11-17. Findings: Etsy Canva form bundles sell for about $5 to $15 with no branding done for the buyer and no state handling; the closest bundle (Hannce PMU Business Bundle) is £47 for seven forms and five policies; trainer guides and courses cover business setup; PMU Forms is a digital-signing app at about $14.99 a month or $119.99 a year and says its forms were reviewed by health officials. Price was later set as three tiers ($29 / $49 / $79, see top of this file). Lead with: finished and branded without Canva, every page previewed before paying, honest state labeling, and a launch plan. Gap to consider later: digital signing on a tablet.
3. Keyword clustering: done 2026-11-17, without volume data (no keyword tool connected). One page per cluster, each linking to /kit/. Build in this order:
   1. `/microblading-consent-form/`: built 2026-11-17. Use it as the pattern for the rest: breadcrumb, two sample pages, what it covers, a "before you use it" checklist that names no specific state rule, FAQ with matching FAQPage data, closing link to /kit/, footer link on every page, sitemap entry, tests in `tests/site.test.ts`.
   2. `/how-to-price-permanent-makeup/` with a free working pricing calculator (price list, price menu template)
   3. `/pmu-client-intake-form/` (health history, consultation form, what to ask before a procedure)
   4. `/lip-blush-consent-form/`
   5. `/pmu-booking-policies/` (deposit, cancellation, no-show, touch-up)
   6. `/pmu-aftercare-cards/` (brows, lips, eyeliner; healing instructions need review by a working artist)
   7. `/pmu-model-call-script/`
   8. `/start-a-pmu-business/` (checklist, first clients)
   9. Later, low demand: eyeliner consent, photo release.
   The home page keeps "permanent makeup consent form", "PMU consent form" and "PMU forms"; no new page may target those (it would compete with the home page). Pages describe what a form covers and show branded samples; they never publish the full legal wording, never state a state rule from memory, and never claim compliance. Use `searchfit-seo:create-content` for each page and add every page to `public/sitemap.xml`.
4. The AI step in the kit builder: the artist describes their studio in a sentence or two, and AI suggests a tagline, logo lettering and color, a style, starting prices, policy tone, and a personalized model-call script and first-clients plan. Each suggestion can be accepted or changed. Needs a Worker endpoint and the owner's Anthropic API key.
5. Put Phase 1 on preink.dev behind Cloudflare Access so only the owner can open it.

## Still needed

Keep this list current and show it at the end of every phase.

- A git commit as a restore point. Nothing has been committed yet.
- The 3 launch states. The owner wants to sell to all of the US from day one, with every state on the general version until verified. Proposed first three: Texas, Florida and the state where the owner's wife works (not yet named). Ask before assuming.
- Anthropic API key, for the AI step
- A Stripe account in test mode, before Phase 2 (GitHub is done: `makstech7/preink`, pushed)
- A working support@getpreink.com address; the legal pages already show it
- Email sending from getpreink.com (Resend) with its DNS records
- A GoHighLevel sub-account with an inbound webhook
- Lawyer review of the form wording and the three legal pages, plus one exported checklist document to send the lawyer
- For the lawyer to supply: legal business name and address, governing law, and any wording needed for California or European visitors
- Trademark and existing-business check on the name "PreInk"
- Product structured data with the price, to add when checkout is live
- Expected monthly cost at 0, 100 and 1,000 sales (asked for in the brief, not yet delivered)
- Go-live checklist: Stripe live mode, Stripe Tax on, one real purchase and refund tested end to end
- Phase 2: three Stripe prices (one per tier); the server must re-check the tier and only deliver that tier's documents; Launch delivery must include the kit in all five styles; partner codes must work on every tier
