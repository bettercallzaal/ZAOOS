---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-07-04
superseded-by:
related-docs: 946
original-query: "Expo app to TestFlight: the complete playbook learned shipping WaveWarZ DJ Wavy (2026-07-03) - EAS setup, Apple enrollment, credentials, native-vs-web gotchas, automated build+submit pipeline. Output as a new public repo."
tier: STANDARD
---

# 966 - Expo to TestFlight: the WaveWarZ playbook

> **Goal:** Everything learned shipping WaveWarZ DJ Wavy from mock app to TestFlight beta in one day (2026-07-03, 7 builds), so the next ZAO mobile app repeats it in hours, not days.

## Key Decisions

| Decision | Verdict | Why |
|----------|---------|-----|
| Apple enrollment type | USE Individual ($99/yr) to start | Live same-day via web browser (no phone app needed). Org accounts need a legal entity + D-U-N-S (1-2 weeks). Convert later via Apple support. |
| Build system | USE EAS cloud builds | Zero local Xcode config for the release path; credentials (dist cert, provisioning profile, APNs key) auto-generated on first interactive run and stored on Expo servers. |
| Client env vars | BAKE public EXPO_PUBLIC_* values into eas.json production profile | EAS uploads respect .gitignore, so .env.local silently never reaches the cloud builder - the app ships in unconfigured/demo mode with zero errors. This bit us: auth was silently disabled in build 1. |
| Submit automation | PUT ascAppId in eas.json submit profile | First submit must be interactive (creates the ASC app record + an EAS-managed ASC API key). After that, `eas submit --non-interactive` works forever. |
| Tester distribution | USE Internal Testing for the team | Instant, no Beta App Review. Catch: internal testers must be App Store Connect team members (Users and Access, Developer role is enough). External groups need Beta App Review (~48h) - save for wide beta. |
| Device testing | TEST ON DEVICE EARLY - web E2E is not enough | Two native-only bugs shipped past a fully green web suite (details below). |

## The pipeline (end state)

One command from code to TestFlight, ~35-45 min total, zero prompts:

```
npx eas-cli build -p ios --profile production --non-interactive --no-wait
# watcher polls build:view; on FINISHED:
npx eas-cli submit -p ios --id <build-id> --non-interactive --wait
```

Numbers from the day: 7 builds, first battle-tested build ~6.5h after Apple enrollment payment, Apple processing 5-60 min per submit, EAS compile 12-20 min.

## Setup checklist (in order)

1. Apple Developer Program: developer.apple.com/enroll, Individual, 2FA required on the Apple ID, pay $99. Activation email arrived same day for us.
2. Expo account + `npx eas-cli login`. NOTE: login needs a real TTY - it fails inside non-interactive shells.
3. `eas init` - the project slug in app.json must match the EAS project or init refuses (create fresh with `eas init --non-interactive --force` rather than renaming your app to match a dashboard-created project).
4. app.json: `ios.bundleIdentifier`, and set `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (standard HTTPS-only app) or every TestFlight build waits on a manual compliance question in ASC.
5. eas.json: production profile with `autoIncrement: true` (remote version source), public env vars in `env`, and `submit.production.ios.ascAppId` (grab the numeric Apple ID from ASC -> App Information after the first submit).
6. First build MUST be interactive in a real terminal: Apple sign-in + 2FA, then yes to generated dist cert, provisioning profile, push key. Everything after is non-interactive.
7. First submit MUST be interactive too (creates ASC app record + EAS-managed ASC API key). Then never again.
8. Testers: ASC -> Users and Access -> invite (Developer role) -> TestFlight -> Internal Testing group -> add.

## Native-vs-web gotchas (each cost a build)

| Bug | Symptom | Fix |
|-----|---------|-----|
| RN fetch cannot read file:// URIs | Upload step dies instantly on device; identical code green on web (picker returns blob: there) | `FileSystem.uploadAsync(url, uri, { httpMethod: 'PUT', uploadType: BINARY_CONTENT })` from expo-file-system/legacy on native; keep fetch-blob on web. Community thread: react-native-fetch-blob#387. |
| RN Pressable dead around styled-lib children | History cards untappable on iOS, fine on web | Use the styling library's own press system (Tamagui onPress + pressStyle) - match whatever mechanism your working buttons already use. |
| Supabase magic link "requested path is invalid" | Login email link errors on device | Supabase URL Configuration -> Redirect URLs must allowlist the app scheme (`yourscheme://**`). Web-only setups never hit this. |
| No CORS on the backend | Web preview dead, native fine (native fetch has no CORS) | Add CORS headers to API + R2/S3 bucket policy if a web build must share the backend. |

Codebase ground truth: `wavewarz-dj-wavy-mobile` - `lib/api.ts` (platform-split upload), `lib/battle-runner.ts` (background job pattern), `eas.json` (env + ascAppId), PR #3 (19 commits, the whole day).

## Cost + time summary

- $99/yr Apple Developer (Individual), $0 Expo (free tier covered 5 cloud builds in one day)
- Apple enrollment payment -> activation: same day
- Code change -> testable on phone: ~35-45 min (EAS compile + submit + Apple processing)
- Internal tester invite -> installed: minutes (no review)

## Also See

- [Doc 946](../../dev-workflows/946-zao-claude-code-kit/) - Claude Code kit (in-flight in a parallel session)
- Public repo spun out of this doc: https://github.com/bettercallzaal/expo-testflight-playbook

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Publish public playbook repo (bettercallzaal/expo-testflight-playbook) with this content generalized - repo live | @Zaal (Claude executes) | Repo | 2026-07-04 |
| Hurricane merges WaveWarZ PR #3 so main == tested TestFlight app - PR merged | @hurricane | PR | 2026-07-06 |
| Add CORS to Repo B API + R2 bucket so web preview works - web battle completes | @hurricane | PR | 2026-07-08 |
| ZAO app kickoff reuses this playbook (target: first TestFlight build inside one day) | @Zaal | Project | 2026-07-11 |

## Sources

- [FULL] First-hand ship log: WaveWarZ DJ Wavy 2026-07-03 session - 7 builds, all failures + fixes observed directly (primary source; loop journal in repo `.claude/loop-state.md`)
- [FULL] [EAS Build setup](https://docs.expo.dev/build/setup/) - verified 200, 2026-07-04
- [FULL] [EAS Submit for iOS](https://docs.expo.dev/submit/ios/) - verified 200, 2026-07-04
- [FULL] [EAS environment variables](https://docs.expo.dev/eas/environment-variables/) - verified 200, 2026-07-04; documents the env behavior behind the .env.local pitfall
- [FULL] [Apple Developer Program enrollment](https://developer.apple.com/programs/enroll/) - verified 200, 2026-07-04
- [FULL] [expo-file-system docs](https://docs.expo.dev/versions/latest/sdk/filesystem/) - verified 200, 2026-07-04
- [FULL] [react-native-fetch-blob#387 - Process file:// URIs on iOS](https://github.com/wkh237/react-native-fetch-blob/issues/387) - verified 200, 2026-07-04; community confirmation of the file:// fetch class of failure
- [FAILED - search results cited facebook/react-native#54626 and #21851; both 404 on direct fetch, treated as search-index hallucinations and excluded]
