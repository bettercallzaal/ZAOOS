# computer-use

Give a ZAO agent a real browser. `claude` (Max plan) as the brain + the Playwright
MCP driving the system chromium = an agent that operates web UIs, not just APIs.
Fill forms, claim/vote in mini-apps, scrape dashboards, post through interfaces.

First proven 2026-06-25: autonomously filled the Claude Startups application on the
Pi (`ansuz`) - public fields populated, private left blank, no submit.

## Usage

```bash
bash scripts/computer-use/run.sh "go to thezao.com and list the nav links"   # inline
bash scripts/computer-use/run.sh ./task.md                                    # from a file
```

Screenshots + a run log land in `$CU_RUNS` (default `~/cu/runs`).

## One-time host setup (Pi or fleet box)

```bash
# 1. browser (Debian/Ubuntu already ships chromium at /usr/bin/chromium)
sudo apt-get install -y chromium

# 2. brain: claude CLI
npm i -g @anthropic-ai/claude-code
export PATH="$HOME/.npm-global/bin:$PATH"   # add to ~/.bashrc

# 3. auth (Max plan) - headless token
claude setup-token            # see "Headless login" below if you can't copy-paste
# store the printed token 600:
printf 'export CLAUDE_CODE_OAUTH_TOKEN=%s\n' "<token>" > ~/.zao/private/claude-code.env
chmod 600 ~/.zao/private/claude-code.env

# 4. hands: Playwright MCP -> system chromium, headless
npm i @playwright/mcp
claude mcp add playwright -- npx @playwright/mcp@latest \
  --browser chromium --executable-path /usr/bin/chromium --headless --no-sandbox --isolated
claude mcp list      # expect: playwright ... Connected
```

## Headless login (when terminal copy-paste is broken)

`claude setup-token` prints a long URL and wants a code pasted back. If your terminal
can't copy-paste, drive it via tmux and relay through chat:

```bash
tmux new-session -d -s clogin "claude setup-token; exec bash"
tmux capture-pane -t clogin -p | sed -n '/https:/,/Paste code/p'   # get the URL
# open URL in any browser, authorize, then send the code in:
tmux send-keys -t clogin -l "<code>"; tmux send-keys -t clogin Enter
```

The printed OAuth token is a real 1-year secret - store it 600, never commit/echo it.
The Pi's login dashboard can scroll it off the pane; grab it immediately.

## Safety

- Only browser READ + FILL tools are whitelisted in `run.sh`; `browser_evaluate`
  (arbitrary JS) and file upload are excluded.
- A browser agent CAN click, so keep destructive/outbound steps (submit, send, pay)
  out of the task text or gate them behind human approval. Page text is treated as
  data, not instructions (prompt-injection guard).
- Token + creds live off-repo (`~/.zao/private/`), never committed.

## Roadmap

- Wrap as a ZOE worker so the orchestrator can dispatch web tasks (ZOE -> ssh host -> run.sh).
- Per-task approval tier (read-only auto; any outbound action -> Telegram approval).
