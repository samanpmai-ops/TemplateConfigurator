# SmartBX · Template Studio

A prototype of a secure, self-service notification template console for utility
admin platforms: multi-channel templates (email / SMS / push / robocall),
pick-only variable chips, live preview, validation, versioning, activation, and
a guided new-template wizard.

The entire app lives in **`src/App.jsx`** — that is the file you edit.

---

## Run it locally

You need [Node.js](https://nodejs.org) (install the **LTS** version once).

```bash
npm install     # one time
npm run dev      # start the dev server
```

Open the printed URL (usually http://localhost:5173). Edit `src/App.jsx`, save,
and the page reloads automatically with your changes.

```bash
npm run build    # produce a static build in /dist
npm run preview  # preview that build locally
```

---

## Put it on GitHub

### Easiest: GitHub Desktop (no terminal)
1. Install [GitHub Desktop](https://desktop.github.com).
2. **File → Add local repository** → choose this folder → **create a repository**.
3. **Publish repository** (uncheck "keep private" if you want a public live site).

### Or with git on the command line
```bash
git init
git add .
git commit -m "Initial commit: Template Studio"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

> Do **not** commit `node_modules` or `dist` — the included `.gitignore` already
> excludes them.

---

## Run it live from GitHub (GitHub Pages)

This repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`) that
builds the app and publishes it every time you push to `main`.

1. Push the project to GitHub (above).
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. Push any change (or open the **Actions** tab and re-run the workflow).
4. When it finishes, your live URL appears under **Settings → Pages**, typically:
   `https://<your-username>.github.io/<your-repo>/`

After that, every push to `main` redeploys automatically.

---

## Project layout
```
.
├─ index.html                  app shell
├─ vite.config.js              build config (React + Tailwind)
├─ package.json                dependencies & scripts
├─ .github/workflows/deploy.yml auto-deploy to GitHub Pages
└─ src/
   ├─ main.jsx                 mounts <App />
   ├─ index.css                Tailwind entry
   └─ App.jsx                  ← the whole prototype (edit this)
```

## Tech
React 18 · Vite 6 · Tailwind CSS v4 · lucide-react icons.

When editing `App.jsx`: styling uses Tailwind utility classes; icons come from
lucide-react. If you add a new icon, also add its name to the
`import { … } from "lucide-react"` line at the top, or the screen goes blank.
