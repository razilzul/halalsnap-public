# HalalSnap landing page — maintenance guide

The marketing site for **https://halalsnap.org**. Plain static HTML/CSS/JS — **no build step,
no framework, no runtime dependency.** This README is the single place to look when you need to
change something.

---

## 1. Where the site lives (important)

There are **two copies** of these files:

| Copy | Repo / path | Role |
|---|---|---|
| **Live (deployed)** | **`razilzul/halalsnap-public`** (repo root) | What `halalsnap.org` actually serves, via **GitHub Pages**. **Edit here to change the live site.** |
| Source / reference | `razilzul/halalsnap` → `landing/` (this folder) | Where the page was built; carries this README + the local preview config. Tracked in PR #85. |

> The two copies differ in **one line**: the footer/Terms **Privacy Policy** link is an absolute
> `github.io` URL in `landing/`, but a **relative** `privacy-policy.html` in `halalsnap-public`
> (because privacy + terms live in that same repo). The deploy step rewrites it automatically.

**Recommended going forward:** treat **`halalsnap-public` as the source of truth** (it's the live,
public, simple static repo and also hosts `privacy-policy.html` + `terms-of-service.html`). The
`landing/` copy in the app repo can be closed/ignored once you're comfortable. If you keep both,
remember to deploy after editing (below).

---

## 2. File map

```
index.html             ← the whole landing page (semantic HTML + inline styles + a little vanilla JS)
terms-of-service.html  ← Terms page (also lives in halalsnap-public)
privacy-policy.html    ← Privacy page (lives in halalsnap-public only)
colors_and_type.css    ← design tokens: brand palette, type scale, spacing, shadows
assets/
  icons.js             ← inlined Ionicons registry + renderer (drives every [data-icon] span)
  logo_oneline.png  fav_icon.png  icon.png
  og-image.png         ← 1200×630 social share card
  result-product-v3.jpg  founder-bh.jpg  screens/result-food.jpg
404.html               ← branded not-found page (GitHub Pages serves it automatically)
robots.txt  sitemap.xml
CNAME                  ← "halalsnap.org" (halalsnap-public only — configures the custom domain)
.nojekyll             ← (halalsnap-public only) makes Pages serve files verbatim
```

The web font (Plus Jakarta Sans) loads **non-render-blocking** from `index.html` (`<link media=print
onload>`), so the page paints instantly on the system-font fallback.

---

## 3. How to make common changes (in `index.html` unless noted)

| Want to change… | Where |
|---|---|
| **Headline / tagline** | Hero `<h1>` (search `Halal clarity, in a snap`). Also update `og:title` / hero is the visible one. |
| **Hero sub-text / value prop** | `<p>` right under the hero `<h1>`. |
| **App-store links** | Search `apps.apple.com/sg/app/halalsnap/id6747142470` and `play.google.com/...com.halalsnap.app` (appear in hero, final CTA, **and** the JSON-LD). Update all. |
| **The phone screenshot in the hero** | `assets/screens/result-food.jpg` (referenced ~hero). Keep aspect ratio tall. |
| **The example result image** | `assets/result-product-v3.jpg`. |
| **The trailer video** | Replace the YouTube ID `5hZ9rIn0P-E` everywhere: the facade `<img>` thumbnail, the `loadTrailer()` iframe src, **and** the `VideoObject` JSON-LD (`thumbnailUrl`, `embedUrl`, `contentUrl`). Also fix `VideoObject.uploadDate`. |
| **Support email** | Footer — `feedback@halalsnap.com`. |
| **FAQ** | Edit the visible FAQ section (`id="faq"`) **and** the matching `FAQPage` entries in the JSON-LD — Google requires the two to match. |
| **Brand colors / fonts / spacing** | `colors_and_type.css` (CSS variables). The accent teal is `--teal: #00D4AA`. |
| **Mobile hero behaviour** | `<style>` block → `@media (max-width: 980px)` / `@media (max-width: 560px)`. On mobile the phone drops below the pitch (`.hero-phonewrap{order:1}`) and shrinks (`.phone-frame{width:248px}`). |
| **Regenerate the share image** | Re-run a `sharp`-based script (the original logic is in git history of the app repo: `_make-og.tmp.js`); output `assets/og-image.png` at 1200×630. |

---

## 4. Preview locally

```bash
npx serve halalsnap-public -l 4321   # or: npx serve landing -l 4321
# open http://localhost:4321
```

Nothing to compile. (In the app-repo worktree, `.claude/launch.json` defines a "landing" preview.)

---

## 5. Deploy (publish changes)

GitHub Pages auto-deploys `halalsnap-public` on every push to `main` (~1–2 min).

**If you edited `halalsnap-public` directly:** just `git commit` + `git push origin main`. Done.

**If you edited the app-repo `landing/` copy**, sync it across:
```bash
# from a clone of halalsnap-public:
cp <app-repo>/landing/index.html .
cp <app-repo>/landing/{sitemap.xml,404.html,terms-of-service.html,colors_and_type.css} .
cp -r <app-repo>/landing/assets/* assets/
# rewrite the privacy link to same-origin relative:
sed -i 's#https://razilzul.github.io/halalsnap-public/privacy-policy.html#privacy-policy.html#g' index.html terms-of-service.html
git add -A && git commit -m "Update landing page" && git push origin main
```

**Verify after deploy:**
```bash
curl -sI https://halalsnap.org/ | head -1                 # 200
curl -s  https://halalsnap.org/ | grep -o '<title>[^<]*'  # new title
curl -sI https://halalsnap.org/sitemap.xml | head -1      # 200
```
(Browsers cache aggressively — hard-refresh / append `?v=2` to see changes.)

---

## 6. Hosting & DNS (set up 2026-06-05)

- **Host:** GitHub Pages, `halalsnap-public`, Deploy-from-branch `main` /(root), **Enforce HTTPS ON**.
- **DNS (Namecheap → Domain List → halalsnap.org → Advanced DNS, BasicDNS):**
  - `A  @  185.199.108.153 / .109.153 / .110.153 / .111.153` (GitHub Pages)
  - `CNAME  www  razilzul.github.io.`
  - **Do NOT touch** the Email-Forwarding MX (`eforward1–5.registrar-servers.com`) or the SPF TXT,
    and **do NOT move nameservers** — that breaks the `@halalsnap.org` catch-all forwarding.
- `git push` works via Windows Credential Manager even though the `gh` CLI token is currently invalid.

---

## 7. SEO — what's done and what's left

**Done (in `index.html` unless noted):**
- Keyword-optimised `<title>` (≤60 chars) + `<meta name="description">` (~160 chars).
- `robots` meta (`index,follow,max-image-preview:large`), `canonical`, `og:locale`, `author`.
- Open Graph + Twitter Card tags with a real 1200×630 `og:image`.
- **schema.org JSON-LD** (`<script type="application/ld+json">`): `Organization`, `WebSite`,
  `MobileApplication`, `VideoObject`, `FAQPage`.
- Visible **FAQ section** (`id="faq"`) matching the FAQ schema.
- `sitemap.xml` (home + privacy + terms) referenced from `robots.txt`.
- `404.html`, single `<h1>`, descriptive `alt` text, lazy-loaded below-fold images, HTTPS,
  mobile-friendly, non-render-blocking fonts.

**Left to do (needs your accounts — can't be automated from the repo):**
1. **Google Search Console** — verify `halalsnap.org` and submit `https://halalsnap.org/sitemap.xml`.
   Verify via DNS TXT (add the token in Namecheap Advanced DNS) or by dropping the
   `google*.html` file GSC gives you into `halalsnap-public`. *This is the single highest-impact step.*
2. **Bing Webmaster Tools** — same idea (or just import from GSC).
3. **`VideoObject.uploadDate`** in the JSON-LD is a placeholder (`2026-06-04`) — set the real date.
4. **Ratings rich snippet** — once you have real App Store / Play ratings, add an `aggregateRating`
   to the `MobileApplication` schema. **Do not invent numbers** (Google penalises fake ratings).
5. Test markup at https://search.google.com/test/rich-results after deploy.

---

## 8. Outstanding decisions

- **PR #85** (the app-repo `landing/` copy) is redundant now that the site is served from
  `halalsnap-public`. Merge it as historical source or close it — your call.
- **App-store privacy URL:** the old `razilzul.github.io/halalsnap-public/privacy-policy.html`
  now 301-redirects to `halalsnap.org/privacy-policy.html` (still works); update store listings to
  the clean URL when convenient.
