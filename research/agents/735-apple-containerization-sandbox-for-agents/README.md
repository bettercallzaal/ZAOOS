---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "601, 670, 685, 727, 728, 730, 734"
original-query: "Research the Reddit r/ollama thread https://www.reddit.com/r/ollama/comments/1tg7nih/local_linux_sandbox_for_ai_agents_on_macos_no/ - the post is about Elvean shipping a Linux sandbox for AI agents on macOS via Apple Containerization. Real story is the underlying Apple framework. How does this fit the ZAO autonomous agent stack (Hermes / hermes-orchestrator) given doc 685 already said Incus is Linux-only and skipped for the laptop?"
tier: STANDARD
---

# 735 - Apple Containerization as a sandbox for autonomous agents on macOS

> **Goal:** Lock how Apple's `apple/containerization` Swift package (macOS 26 + Apple Silicon, Apache 2.0, 8.5k stars, released May 2025) fills the macOS-native-sandbox gap that doc 685 (code-on-incus, Linux-only) explicitly left open. The Reddit thread was triggered by Elvean shipping it; the framework itself is the durable primitive, and it is the right runtime sandbox for hermes-orchestrator runs on Zaal's Mac.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **ADOPT `apple/containerization` as the macOS-native sandbox layer** for the hermes-orchestrator `RunnerAdapter` once macOS 26 is on Zaal's Mac. | Doc 685 explicitly excluded the laptop because Incus is Linux-only. Apple Containerization is the Mac-native equivalent: ~6 sec Alpine VM boot, ~540MB VM + ~37MB sandbox-service overhead, dedicated per-container IPs (no port forwarding), `/workspace` bind mount. Apple's official Swift package, Apache 2.0, 8.5k stars, repo updated 2026-05-23 (active). |
| 2 | **NEW `RunnerAdapter` for hermes-orchestrator: `MacContainerRunner`.** Wraps `apple/container` CLI (the binary repo, separate from the `apple/containerization` library) to spawn `claude` CLI subprocesses inside a per-task Alpine VM. | The current `HermesRunner` (doc 734, `src/adapters/hermes-runner.ts`) spawns `claude` on the bare host. That keeps the host's `~/.ssh`, env vars, secrets, and Git tokens in scope - structurally violates `.claude/rules/secret-hygiene.md`. Wrapping the same subprocess in an Alpine VM makes secret hygiene structural instead of procedural. Same per-doc-685 reasoning, now Mac-native. |
| 3 | **Pair with the autonomy gate (doc 734 `src/autonomy.ts`).** Container-sandboxed runs can have a more permissive AUTO allowlist (blast radius is contained); bare-host runs stay strict. | Sandboxing changes the cost of getting an AUTO call wrong. The gate's "default deny on the unknown" can be relaxed for tools that only touch `/workspace` inside the VM. Network-outbound and host-FS still default to CONFIRM. |
| 4 | **Treat Elvean as a reference implementation, NOT a dependency.** Elvean's sandbox feature (the Reddit thread's subject) is a working demonstration of the pattern; the framework is the part we adopt. | Elvean is a closed-source native Mac AI client (`elvean.app`, "Private AI Workspace for Mac" with 300+ models). Useful as a UX reference for how an end-user wraps the framework, but ZAO does not need a third-party client - we wire the Swift package or the CLI directly into the orchestrator. |
| 5 | **HOLD adoption until macOS 26 + Xcode 26 + Apple Silicon are confirmed on Zaal's machine.** The framework's hard requirements per README. | If Zaal's Mac is on macOS 25 or has Intel silicon, none of this ships. Confirm before any implementation work. |
| 6 | **Cross-validates doc 730's "43% of public MCP servers have critical vulns" warning** and doc 728's Supabase MCP DB-leak vector. Sandboxing the runner is the structural defense against malicious tool calls or prompt-injected exfiltration. | Per doc 730, the threat model includes a prompt-injected SQL exfiltration via support-ticket text. Per doc 728, `mcp__supabase__*` must run anon-key + RLS. Sandbox makes the worst case "the VM saw it" not "the host saw it." |

## What the framework actually is

`apple/containerization` is a **Swift package** by Apple for running Linux containers on macOS via `Virtualization.framework`. Released 2025-05-29, currently 8,554 stars, Apache 2.0, repo updated TODAY (2026-05-23). See [apple/containerization](https://github.com/apple/containerization).

Key facts from the README:

| Fact | Detail |
|------|--------|
| Per-container model | Each Linux container runs inside its own dedicated lightweight VM (not shared) |
| Networking | Dedicated IP address per container - removes need for port forwarding |
| Boot time | "Sub-second start times" via optimized kernel + minimal init |
| Init system | `vminitd` - small init inside the VM, exposes GRPC API over vsock for runtime config + process spawn |
| Kernel | Optimized Linux kernel config in `/kernel`. Tested kernel `6.14.9`. User-provided kernels supported per-container (VIRTIO required compiled-in, not modules). Pre-built option: Kata Containers' `vmlinux.container` |
| Image management | OCI image support, remote registry interaction, ext4 FS creation |
| Cross-arch | Rosetta 2 for running linux/amd64 containers on Apple Silicon |
| Requirements | macOS 26, Xcode 26, Apple Silicon. Older macOS NOT supported. |
| License | Apache 2.0 |
| Companion repo | [apple/container](https://github.com/apple/container) - the CLI binaries (`container run`, etc.) built on top of the library |

The Elvean Reddit post's numbers (~6 sec Alpine boot, ~540MB VM + ~37MB sandbox service) are consistent with the README's "lightweight VM + sub-second start" claims. Elvean appears to be running it close to spec.

## Reddit thread - what the community said

[Post](https://reddit.com/r/ollama/comments/1tg7nih/local_linux_sandbox_for_ai_agents_on_macos_no/): 72 upvotes, 0.95 upvote ratio, 16 comments. Posted by u/Conscious-Track5313 (Elvean founder).

Useful comment signal:

| Commenter | Score | Substance |
|-----------|-------|-----------|
| u/Buddhabelli | 2 pts | "[Apple Containerization] better. soooooo much better. docker has been a dog on macos since launch. it was never designed with macos in mind." Cross-validates the "this beats Docker Desktop on Mac" pitch. Mentions [UTM](https://mac.getutm.app/) ($9.99 App Store / free on website) as a free alternative for full VMs. |
| u/Equal_Jellyfish_4771 | 1 pt | Asked the performance-vs-Docker-Desktop question explicitly |
| u/ellicottvilleny | 4 pts | "Open source?" - the framework is, Elvean is not. Top-voted comment is a sourcing question. |
| u/mrscrufy | 1 pt | Asked how the demo video was made; founder said `ScreenStudio`. Not relevant to the framework. |
| u/Nicoolodion | -4 pts | "AI generated trash" - downvoted to oblivion. No substantive criticism. |

Thread is moderate-signal (73 upvotes is not viral, 0.95 ratio is good) and the technical comments confirm the value prop. The framework, not Elvean, is the story.

## How it slots into the ZAO agent stack

Three places this matters today:

### 1. hermes-orchestrator (doc 734) `RunnerAdapter`

The just-shipped [hermes-orchestrator v0.5.0 stacked PRs](https://github.com/bettercallzaal/hermes-orchestrator) define `RunnerAdapter` as:

```ts
interface RunnerAdapter {
  spawn(input: RunnerInput): Promise<RunHandle>
  stream(handle: RunHandle): AsyncIterable<RunEvent>
  intervene(handle: RunHandle, message: string): Promise<void>
  kill(handle: RunHandle): Promise<void>
}
```

The default `HermesRunner` spawns `claude` CLI on the bare host. A `MacContainerRunner` would wrap `apple/container` CLI:

- `spawn()` -> `container run -d --workspace /workspace alpine-with-claude:latest`, then exec `claude --print --output-format stream-json` inside the container
- `stream()` -> read the container's stdout via `container logs -f` or vsock
- `intervene()` -> the same `claude --resume <session_id>` trick as `HermesRunner` (doc 734), but executed inside the container
- `kill()` -> `container kill`

Cost cap + stuck-timeout + max-interventions semantics remain unchanged - they live in the orchestrator drain loop, not the runner.

### 2. Autonomy gate posture

Doc 734's `src/autonomy.ts` ships a 3-tier gate (AUTO / CONFIRM / REFUSE) with a "fail-safe up" default. Sandboxing flips the cost-of-getting-it-wrong calculation for a subset of actions:

| Action class | Bare-host tier | Sandboxed tier |
|--------------|----------------|----------------|
| `bash:rm -rf` inside `/workspace` | CONFIRM | AUTO (worst case: VM filesystem wiped, no host damage) |
| `gh pr create` | AUTO | AUTO (unchanged - network egress, real-world side effect) |
| `git push origin main` | CONFIRM | REFUSE (sandboxed agents should never push to host repos directly) |
| `read $HOME/.ssh/id_*` | CONFIRM | REFUSE (sandbox should not have host SSH keys mounted - the bind mount is `/workspace` only) |
| Install npm package | CONFIRM | AUTO (Alpine VM is disposable; broken deps die with the VM) |
| LLM tool call to an unknown tool | CONFIRM | CONFIRM (unchanged) |

The header rule: **sandbox-on relaxes the AUTO side for blast-radius-bounded actions, tightens REFUSE for actions the sandbox should structurally prevent (host FS, secret access).**

### 3. Defense against MCP exfiltration vectors (docs 728 + 730)

Doc 730 surfaced the HN 848-point Supabase MCP SQL-exfiltration disclosure: prompt-injected support-ticket text caused the agent to run unintended SQL via a privileged MCP tool. The structural defense per doc 728 is anon-key + RLS scoping. The orthogonal structural defense is sandboxing the runner so that even if a tool is compromised, the blast radius is bounded to the VM.

Doc 730 also flagged the `server-everything` `get-env` tool that dumps full `process.env`. Inside a sandbox, that `process.env` is the VM's env, not the host's - Anthropic key, GitHub token, etc. never leave the host.

## Why now (vs. waiting)

- macOS 26 is the gate. If Zaal is on macOS 26 + Apple Silicon: build the spike this month. If not: bookmark, revisit at next macOS upgrade.
- Hermes-orchestrator just shipped its `RunnerAdapter` interface (doc 734). The seam is open and clean - adding a second adapter is additive, not invasive.
- The threat-model evidence (docs 728/730) is fresh. The structural defense should ship while the lessons are warm.
- 8.5k stars at 12 months means the OSS community has stress-tested it; this is past "research toy" status.

## Risks + open questions

| Risk | Mitigation |
|------|-----------|
| macOS 26 not on Zaal's Mac yet | Check `sw_vers`. If macOS 25 or earlier, doc 735 stays bookmarked. Apple Silicon already confirmed (M-series). |
| Claude CLI auth inside a VM | Claude Code Max-plan OAuth is host-machine-bound. Either (a) the VM gets a one-shot API key from env (regress to API-key billing) or (b) the host runs `claude` and we mount the orchestrator's session-state directory into the VM. Option (a) is a billing decision; option (b) defeats the secret-hygiene argument. **Open question, must resolve before shipping.** |
| Per-VM cold-start latency | Alpine boots in ~6 sec per the Reddit post. For latency-sensitive tasks (`/info`, ZOE concierge replies), pre-warm a pool of N idle VMs - `apple/container` should support container snapshots / templates per the framework's optimized-kernel design. |
| Apple deprecation risk | Apache 2.0 license + Apple-maintained = relatively low risk. But this is a young framework (1 year old); semver may not be stable. Pin to a specific release. |
| Doubles the dependency surface | Yes. Adopt only after Hermes-orchestrator (doc 734) has dogfooded for 7+ days unsandboxed and proves the orchestrator pattern itself works on the bare host first. |
| `apple/container` CLI vs `apple/containerization` library | The library is the long-term integration point; the CLI is faster to dogfood. Start with CLI shim, swap to library binding later if value is proven. |

## Adoption plan (proposal)

Sequenced, none of this is committed until Zaal greenlights:

1. **Confirm `sw_vers` reports macOS 26 + Apple Silicon on Zaal's Mac.** If not, stop here. (5 min)
2. **Install `apple/container` CLI; run the hello-world `container run alpine echo hi`** to verify the toolchain. (15 min)
3. **Spike `MacContainerRunner` in the hermes-orchestrator repo** (NOT in ZAOOS `bot/src/hermes/`) - a 2nd `RunnerAdapter` alongside `HermesRunner`, behind a feature flag. Resolve the Claude-CLI auth question (Risk #2 above) here. (Half-day)
4. **Run the same `learning-loop.test.ts` (doc 734) against `MacContainerRunner`** to prove the round-trip works inside the VM. (1 hour)
5. **Update doc 734's adoption plan** to add a step: "after FileMemory dogfood + Bonfire labeling unlock, switch to `MacContainerRunner` for any pattern with `confidence:low` on the autonomy gate." (15 min)
6. **Document the bare-host vs sandboxed autonomy posture table** as a `docs/sandbox-posture.md` in the hermes-orchestrator repo. (30 min)
7. **Open a PR to the public hermes-orchestrator repo** adding `MacContainerRunner` as an optional adapter. Build-in-public per repo's README. (PR + review)

## Also See

- [Doc 685](../../dev-workflows/685-code-on-incus-agent-sandbox/) - the Linux-side prior art; doc 735 is the Mac-side complement
- [Doc 734](../734-hermes-orchestrator-framework/) - the `RunnerAdapter` interface this would implement
- [Doc 727](../727-zoe-as-agent-builder-supervisor/) - the architecture lock that doc 734 ships and doc 735 extends
- [Doc 728](../../dev-workflows/728-serena-mcp-zao-integration/) - Supabase MCP anon-key + RLS posture; sandbox is the orthogonal defense
- [Doc 730](../../dev-workflows/730-claude-code-mcp-best-practices/) - "43% of public MCP servers have critical vulns" - sandbox is the structural answer
- [Doc 670](../670-iman-call-may18-craig-pizzadao/) - Iman call that touched ZAO Craig (separate runtime decision)
- [Doc 601](../601-agent-stack-cleanup-decision/) - Hermes-canonical lock; sandboxing is additive, not a replacement

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Run `sw_vers` to confirm macOS 26 + Apple Silicon | @Zaal | One-shot | This week |
| Install `apple/container` CLI + verify `container run alpine echo hi` | @Zaal | Toolchain | After (1) confirmed |
| Spike `MacContainerRunner` in hermes-orchestrator repo (NEW adapter alongside HermesRunner) | @Zaal | hermes-orchestrator PR | After hermes-orchestrator v0.5.0 tagged (per doc 734) |
| Resolve Claude-CLI auth-in-VM question (API key vs host session mount) | @Zaal | Decision | During spike |
| Run `learning-loop.test.ts` against `MacContainerRunner` | @Zaal | Test | During spike |
| Add `docs/sandbox-posture.md` to hermes-orchestrator repo (bare-host vs sandboxed autonomy table) | @Zaal | hermes-orchestrator PR | After spike validates the model |
| Update doc 734's adoption plan with sandbox step | @Claude | ZAOOS PR | After (3) merges |
| Re-validate `apple/containerization` repo activity quarterly | @Zaal | Watch | Every 3 months |
| Watch Apple WWDC 2026 for follow-on framework announcements | @Zaal | Watch | June 2026 |

## Sources

- [Reddit r/ollama thread - Elvean post](https://www.reddit.com/r/ollama/comments/1tg7nih/local_linux_sandbox_for_ai_agents_on_macos_no/) [FULL - 72 pts, 0.95 ratio, 16 comments fetched via zao-fetch-reddit.sh; post body + 5 comment threads + first-level replies all read]
- [apple/containerization README](https://github.com/apple/containerization) [FULL - fetched via `gh api repos/apple/containerization/readme`; design section, requirements, kernel notes, license all confirmed; 8554 stars, Apache 2.0, updated 2026-05-23 verified via `gh api repos/apple/containerization`]
- [apple/container repo](https://github.com/apple/container) [PARTIAL - referenced from containerization README as the CLI binary repo; metadata not separately fetched, not blocking]
- [elvean.app](https://elvean.app) [FULL - homepage title + meta description fetched via curl with Mozilla UA; confirms "Private AI Workspace for Mac" + 300+ models positioning]
- [Apple Virtualization.framework docs](https://developer.apple.com/documentation/virtualization) [PARTIAL - referenced by Containerization README as the underlying primitive; not fetched, public Apple docs assumed stable]
- [Kata Containers `vmlinux.container`](https://github.com/kata-containers/kata-containers) [PARTIAL - referenced by Containerization README as a pre-built kernel option; not fetched]
- [UTM Mac VM app](https://mac.getutm.app/) [PARTIAL - mentioned by u/Buddhabelli in the Reddit thread as a free alternative for full-fat VMs; not the recommended adoption path, included for completeness]
- ZAOOS doc 685 [FULL - read frontmatter + Key Decisions table; confirms Incus is Linux-only and laptop sandboxing was explicitly punted]
- ZAOOS `bot/src/hermes/` codebase audit [FULL - via grep for "sandbox|alpine|VM|containeriz" - confirmed ZERO existing sandbox integration; clean slate]
