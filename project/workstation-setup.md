# Setting up a workstation for Invisible Ships

How to get a new computer ready to work on this site, whether it is the
maintainer on a second machine or another contributor. Written 3 Oct 2026.

## 1. Read these first

1. `/CLAUDE.md`: the working rules. Settled decisions, not preferences.
2. `project/README.md`: where plans, decisions and work in flight are written.
3. `project/roadmap.md`: what is being built, in order.
4. `project/data-rules.md`: the three copies of the content and how they agree.

## 2. Lay out the folder

Keep the repository inside a project folder of its own, not loose in Documents
or Downloads:

```
<your project folder>/
├── v0-invisibleships/      this repository
└── (everything else for the project: research, drafts, old files)
```

Clone with GitHub Desktop (File → Clone repository →
`growthoutcome-code/v0-invisibleships`) and choose the project folder as the
local path. Work on `main` unless a feature doc in `project/features/` names a
branch.

## 3. Install the tools

- **Node.js** 18.17 or newer (the site runs Next.js 14), then `npm install` in the repository.
- **Python 3** (`python3 --version`, or `python --version` on Windows). The
  corpus scripts need it.
- **GitHub Desktop**. Commits and pushes go through it.

## 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in the values. **Values are
never written in this repository, in a doc, or in a chat.** Get them from the
Vercel project (Settings → Environment Variables) or from the maintainer.

| Variable | Used for | Without it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Reading content from Supabase | The site falls back to the bundled copy |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Server-side logging of gate answers and downloads | Nothing is logged. Never prefix with `NEXT_PUBLIC_` |
| `IP_HASH_SALT` | Salting the visitor hash | The hash is written as null |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics | No PostHog events |
| `POSTHOG_PERSONAL_API_KEY` (plus `POSTHOG_PROJECT_ID`, `POSTHOG_API_HOST`, which have working defaults) | PostHog counts on `/insights` | `/insights` says counts are not connected |
| `NEXT_PUBLIC_GA_ID` | Google Analytics | Falls back to the site's own measurement ID |
| `GA_MP_API_SECRET` | Sending confirmed downloads to Google Analytics | Downloads reach PostHog only |
| `GA_PROPERTY_ID`, `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Google Analytics counts on `/insights` | `/insights` shows no Google numbers |
| `MAXMIND_LICENSE_KEY` | VPN labels on visit locations | Every location reads "network unknown" |

A local machine only needs the first row to see the site. The rest matter for
measurement and logging, and are already set in Vercel for production.

**Keep your own visits out of the numbers.** Open the site once on each device
as `https://www.invisibleships.com/?analytics=off` for a device used only to
build, or `?author=1` for one you also read on. See `CLAUDE.md` §2.

## 5. Check it works

```
npm run dev       # the site at http://localhost:3000
npm run check     # the guards; must pass before any push
```

After adding or changing content, run `npm run corpus` and then `npm run check`.
See `CLAUDE.md` §1 and §3.

## 6. Optional: the commit and pull triggers

The maintainer keeps a private inventory of the project folder
(`folder-inventory.py`, one folder above the repository). It is private because
the folder holds unpublished research and drafts, and this repository is public.
The maintainer's copy is kept with the project's private notes.

To have that inventory refresh itself after every commit and every pull, run once
in a terminal, inside the repository:

```
sh scripts/install-local-hooks.sh
```

- It installs two small files in `.git/hooks/`, which git never pushes, so each
  workstation runs it once.
- If `folder-inventory.py` is not one folder up, the triggers do nothing. A
  contributor without it can install them or skip this step. Nothing breaks
  either way.
- They never block or fail a commit or a pull.
- An existing hook of a different kind is left alone, with a message.
- To remove them: `sh scripts/install-local-hooks.sh --remove`.

**Run this yourself, in a terminal.** A Claude session working through the link
to your computer cannot do it for you: it must not run git in your folder (it
cannot delete files there, so git leaves `.git/index.lock` behind and GitHub
Desktop then refuses to commit), and it is not allowed to write inside `.git`.

## 7. How work gets published

1. Work happens in your folder, by you or written there by a Claude session.
2. Before anything changes, confirm `main` matches GitHub: Fetch origin in
   GitHub Desktop.
3. Commit and push in GitHub Desktop. A push to `main` deploys to production on
   Vercel.

## Standing rules worth repeating

- **Never edit the author's Google Docs**, from any machine, ever. They are the
  original record.
- **Never remove Google Analytics.** It runs alongside PostHog. See decision 0016.
- **No lists of organizations or people's names**, anywhere on the site. See
  `CLAUDE.md` §6.
