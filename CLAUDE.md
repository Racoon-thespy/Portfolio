# Portfolio: context for Claude sessions

Static site (plain HTML, CSS, JS, no build step) served by GitHub Pages at
https://racoon-thespy.github.io/Portfolio/. Film-themed ("Absolute Cinema"): a CRT overlay, a horizontal
scroll stage, reels, a bottom scrubber, and an "end credits" contact panel.

It also hosts an **AI voice assistant widget**, which is built and maintained in a **separate repo**.
Read this before touching `agent.js` or anything near it.

## The two repos

| | Portfolio (this repo) | voice-agent |
| --- | --- | --- |
| Path | `/Users/aditya/Portfolio` | `/Users/aditya/voice-agent` |
| GitHub | `Racoon-thespy/Portfolio` | `Racoon-thespy/Adi-VA-` |
| Holds | the site, plus a built `agent.js` | the Cloudflare Worker (backend), the widget source, tests, evals |
| Goes live by | `git push` (Pages rebuilds in about a minute) | `npm run deploy` (Worker), `npm run publish:widget` (widget) |

Use the `Racoon-thespy` GitHub account for both (`gh auth switch -u Racoon-thespy`).

## `agent.js` is a build output. Do not edit it by hand.

It is minified. The next `npm run publish:widget` in voice-agent either refuses (if `agent.js` has uncommitted
edits) or replaces it with a fresh build, so hand edits are lost.

- **Change the look from this repo** with CSS variables in `style.css`. They pass through the widget's
  Shadow DOM, so no rebuild is needed:

  ```css
  #aditya-voice-agent {
    --va-accent: #e5342b;
    --va-bottom: 92px;
  }
  ```

  Variables (all optional; defaults in brackets): `--va-accent` (#e5342b), `--va-accent-2` (#f5473a),
  `--va-bg` (#050506), `--va-panel` (#0c0c0f), `--va-ink` (#f4f4f1), `--va-muted` (#8b8b93),
  `--va-muted-2` (#5c5c63), `--va-line` (rgba(255,255,255,.1)), `--va-line-strong` (rgba(255,255,255,.2)),
  `--va-radius` (6px), `--va-font` (Inter), `--va-font-mono` (Space Mono), `--va-font-size` (14px),
  `--va-right` (20px), `--va-bottom` (92px), `--va-z-index` (45), `--va-width` (380px), `--va-height` (520px),
  `--va-inset-mobile` (16px). The page's CSS cannot reach anything else inside the widget.
- **Change the layout or behaviour** (elements, text, logic): that is source in voice-agent
  (`widget/src/`), then `npm run publish:widget`, then commit and push here.
- To hide the widget entirely: `#aditya-voice-agent { display: none; }`.

## How the widget is wired in

```html
<script src="script.js"></script>
<script src="agent.js" data-api="https://voice-agent.fancy-bread-e0d1.workers.dev"></script>
```

- Keep it a **classic script** (no `type="module"`, not injected dynamically): it reads
  `document.currentScript.dataset.api` on first run. No `data-api`, no widget.
- It adds one `<div id="aditya-voice-agent">` to `<body>` with a Shadow DOM. Do not wrap, move, or
  reparent it. It is `position: fixed`, bottom-right, and sits outside `.h-stage`.
- **Stacking:** the widget is `z-index: 45`. Other layers: CRT overlay 40, drift layer 39, scrubber 35,
  header 20. The scrubber is `--scrub-h` (72px) tall, so the widget's default `bottom` is 92px to clear it.
  If the scrubber's height changes, adjust `--va-bottom` here.
- `script.js` intercepts `a[href^="#"]` links **at page load** so they scroll sideways to the right panel.
  It cannot see inside the widget (Shadow DOM), and the widget no longer has an in-page link.
- The widget makes network calls only to the Worker above. It needs **HTTPS** for the microphone (Pages
  provides it). If a Content-Security-Policy is ever added, allow `connect-src` to the Worker URL and
  `media-src blob:`.

## Things that break the agent if changed here

1. **The site's origin.** The Worker only accepts requests from `https://racoon-thespy.github.io`. If the site
   moves (custom domain, different Pages URL), the widget gets 403 until `ALLOWED_ORIGIN` in
   voice-agent's `wrangler.jsonc` is changed and `npm run deploy` is run.
2. **The Contact section.** The agent tells visitors to "check the Contact section at the bottom of the
   page". Keep a contact section (`<footer id="contact">`, "End credits"). If it is renamed or moved,
   update the agent's prompt in voice-agent too.
3. **Facts about the site that the agent repeats.** Its profile (`voice-agent/src/profile.md`) mentions the
   film theme and that the Photography, Writing, Videography and Music reels are "coming soon". When those
   reels go live, or the bio, links or tag lists change, the profile needs updating there, then
   `npm run deploy`.

## What the agent is, in one paragraph

Visitors type or tap the mic. Audio is converted to WAV in the browser, transcribed by Whisper on
Cloudflare Workers AI, answered by a Llama model using only the profile, then spoken by MeloTTS. The Worker has
no tools or secrets, strict CORS, per-IP rate limits, input and output guards, and 28 prompt-injection
tests. Free-tier allowance is about 100 conversations a day; beyond that the agent stops until 00:00 UTC.
The widget tells visitors their recording is sent to Cloudflare Workers AI.

## Practical notes

- GitHub Pages caches for 10 minutes. After pushing, hard-refresh (Cmd+Shift+R) to see changes.
- Untracked `.DS_Store` and `Portfolio.code-workspace` are local clutter; do not commit them.
- Commit messages: short imperative summary; Claude-authored commits end with the Co-Authored-By trailer.
- Never commit secrets. Nothing here needs any (the Worker holds no keys).
- Questions about the agent's answers, voice, pronunciation, guardrails or hosting belong in the
  voice-agent repo, not here.
