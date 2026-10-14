# Entire session capture (Price Wire)

Entire is enabled for this repo:

- `.entire/settings.json` — git-ref checkpoints
- `.cursor/hooks.json` — Cursor hook wiring

## For the DEV post

1. After a build session, search past agent work in Entire (or export from the Entire UI).
2. Quote 1–2 decisions in **How I Built It** (for example Mastra tool split, TabPFN fallback).
3. Satisfies **Best Use of Entire** when the post links or embeds those sessions.

## DevRelay embed (optional)

If you also submit a curated session via DevRelay, add to the draft:

```liquid
{% agent_session YOUR_SESSION_ID %}
```

Scrub `.env` values and API keys before upload.
