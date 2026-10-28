# byemily.org

just my personal site portfolio kinda, with a cool fake shell thingy meow

Next.js 16 (App Router), React 19, Tailwind v4.

## Running

```bash
cp .env.example .env   # fill in SMTP settings for the contact form
npm install
npm run dev            # http://localhost:19990
npm run build && npm start
```

## Content

- `posts/*.md` and `projects/*.mdx`, with frontmatter (see
  `lib/posts.ts` and `lib/projects.ts` for the fields). Files are read
  on every request, so new posts show up without a rebuild. Names
  starting with `.` are drafts: hidden on the site and not committed.
- `lib/content.ts`: the /about copy (also `about.md` in the terminal).
- `lib/socials.ts`: links shown in the nav, footer and /about.

## Code

- `lib/hero-current*.tsx`, `components/heroes/`: the boot animation and
  terminal (`terminal/` holds commands, tab completion and rendering).
- `app/api/contact`: the contact endpoint behind the form and
  `./contact.sh`, rate limited per client and overall
  (`lib/rate-limit.ts`).
- Runtime state (last login, rate limits) lives in `.data/`.
