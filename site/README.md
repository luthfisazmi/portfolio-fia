# Luthfi Azmi Sa'diyah — Portfolio Website

A static one-page portfolio site built from your PPTX portfolio deck — same content,
same brand tone (olive green + signal red on cream paper, bold display type, the
ID-badge/lanyard motif from your cover slide), laid out like a modern portfolio
site (sticky nav, hero, about, filterable skills, experience, projects grid,
certifications, contact form).

No build step, no framework — plain HTML/CSS/JS. Works anywhere static files work.

## Files

```
index.html          — all page content/sections
assets/style.css     — all styling (colors, type, layout, responsive rules)
assets/script.js     — nav toggle, active-link highlight, skills filter, contact form
assets/img/          — your photos + cropped project screenshots, pulled from the deck
```

## Run it locally

You don't need Node or a build tool. Any static server works, e.g.:

```bash
cd site
python3 -m http.server 8080
# open http://localhost:8080
```

Or just double-click `index.html` (some browsers restrict local file requests —
use a local server if fonts/icons don't load).

## Deploy to Vercel (→ yourname.vercel.app)

**Option A — Vercel CLI (fastest)**
```bash
npm i -g vercel
cd site
vercel
```
Follow the prompts (link/create a project, keep defaults — it's a static site,
no build command needed). Vercel gives you a `*.vercel.app` URL immediately;
run `vercel --prod` to publish it as your production URL.

**Option B — GitHub + Vercel dashboard**
1. Push this `site` folder to a new GitHub repo.
2. Go to vercel.com → **Add New… → Project** → import that repo.
3. Framework preset: **Other** (or "No Framework"). Leave build command empty,
   output directory as `.` (root). Deploy.
4. You'll get `your-repo-name.vercel.app`; you can rename the project (and
   therefore the subdomain) in Project Settings → General.

**Option C — Drag and drop**
Go to vercel.com/new, and drag the whole `site` folder onto the page. Done.

## Things you'll likely want to personalize

- **Download CV**: the "Get In Touch" / hero buttons don't currently link to a
  CV file. Add your CV as `assets/CV_Luthfi_Azmi.pdf` and link a button to it
  if you want a download option.
- **Contact form**: `Send Message` currently opens the visitor's email app
  with a pre-filled message (no backend). For an in-page send, wire it to a
  form service like Formspree, Web3Forms, or a Vercel serverless function —
  the form markup is already in `index.html` (`#contactForm`).
- **Project links**: project cards currently don't link out (no live URLs were
  in the deck). Add `<a href="...">` around each `.proj-card` once you have
  live demo / GitHub links per project.
- **Tech-logo icons**: skill pills load PHP/Laravel/MySQL/Python/Figma/GitHub
  logos from a public CDN (jsdelivr/devicon) — if you'd rather self-host them,
  drop SVGs into `assets/img/icons/` and update the `src` paths in `index.html`.
- **Favicon**: currently an inline generated "L" mark — swap the `<link rel="icon">`
  in `index.html` for a real favicon file if you have a logo.

## Palette reference

| Token | Hex | Use |
|---|---|---|
| Cream | `#F6F3EA` | Page background |
| Deep green | `#223318` | Headlines, footer/contact background |
| Green | `#4C6B2E` | Secondary accents |
| Red | `#E23F2E` | Primary CTA / accent |
| Yellow | `#F6D949` | Small highlight accents |
