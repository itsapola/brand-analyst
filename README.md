# Brand Intelligence Toolkit

A structured, evidence-led audit of homepage clarity, positioning, differentiation, trust, and conversion — built for strategic review, not generic AI commentary.

**Live:** https://brand-analyst.vercel.app/ (redeploy this version to the same project, or update the URL once redeployed)

## What changed in this rebuild

- **Runs on the Anthropic API (Claude) instead of OpenAI.** Same audit logic, different model provider.
- **Branding now matches the rest of the tool set** — same design tokens (paper/ink/persimmon, Space Grotesk/Fraunces/Newsreader/JetBrains Mono) as the [Category Thesis Generator](https://category-thesis-generator.vercel.app/) and [Technical-to-Buyer Translator](https://technical-translator.vercel.app/), so all three read as one built system rather than three one-off experiments.
- Same three-stage flow as the original: **Extract → Evaluate → Prioritize**.

## What it does

1. **Extract** — fetches the live homepage server-side and pulls the visible text (headings, copy, CTAs), stripped of scripts/styles/markup.
2. **Evaluate** — scores eight fixed strategic categories (clarity, positioning, differentiation, trust, conversion, audience specificity, proof strength, voice consistency), each 1–10 with a rationale grounded in the actual page content.
3. **Prioritize** — returns a ranked action plan of the 3–5 highest-impact fixes.

## Stack

- Next.js 14 (App Router)
- Anthropic API (`claude-sonnet-5`), called server-side from a route handler — the API key never reaches the browser
- No database — stateless, one request in, one JSON response out
- Page fetching + text extraction happens server-side via a lightweight regex-based HTML strip (no headless browser, so JavaScript-rendered pages with little server-rendered content will extract thin text — the tool says so honestly rather than guessing)

## Running locally

```bash
npm install
cp .env.example .env.local
# edit .env.local and add your real ANTHROPIC_API_KEY
npm run dev
```

Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this repo to GitHub (replacing the existing `brand-analyst` repo contents, or as a new repo if you'd rather keep history).
2. In Vercel, import the repo (or point the existing `brand-analyst` project at the updated repo).
3. Under **Environment Variables**, add:
   - `ANTHROPIC_API_KEY` — your key from [console.anthropic.com](https://console.anthropic.com/settings/keys)
4. Remove any old `OPENAI_API_KEY` variable if one exists — it's no longer used.
5. Deploy.

## Notes

- The API key is a **server-side** env var (not `NEXT_PUBLIC_`) — only read inside `app/api/audit/route.js`, never shipped to the client.
- The model is prompted to say so honestly rather than fabricate an evaluation when a page returns too little extractable text (common on heavily JavaScript-rendered sites).

---

Built by [Ashley Pola](https://ashleypola.com) — brand and narrative strategist.
