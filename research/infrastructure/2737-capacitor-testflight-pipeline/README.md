---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-11-13
related-docs: ""
original-query: "this should be reeach testlfiht as a whole best practices as many opensource builds and learnings we can take from that ask shaw from shaw makes magic see if he has soluions" (Zaal, 12-13 Nov 2026, relayed by the seat)
tier: STANDARD
---

# 2737 - Shipping a Capacitor iOS app through TestFlight: best practices and open-source pipelines

## Goal

Find the best way to ship Sparkz (a Next.js app loaded in a Capacitor 8 WKWebView shell via `server.url = https://trysparkz.com`) to TestFlight, check it against what other open-source teams do, and list what to copy.

### Build 4 status (read this first)

The commit and the lane report say yes. No agent re-checked App Store Connect today.

- Commit `65ff17b` on branch `ios-testflight-build` is titled "ios: build 4 uploaded to TestFlight by scripts/testflight.sh". [Certain] I read it with `gh api repos/bettercallzaal/sparkz/commits/65ff17b` on 2026-11-13; author date 2026-11-12T18:58:53Z, which is 13:58 EST.
- `ios/App/App.xcodeproj/project.pbxproj` on `main` has `CURRENT_PROJECT_VERSION = 4;` (2 matches) and `MARKETING_VERSION = 0.1.0;`. [Certain] read via `gh api` today.
- A lane report (iman-desk, 12 Nov) said App Store Connect lists builds 1, 2 and 4 as VALID and build 3 was never uploaded. This came from a read-only ASC query and was not re-run here. [Likely] true, not re-verified.

Zaal confirms: App Store Connect > Apps > Sparkz > TestFlight > iOS builds. Build 4 (version 0.1.0) must show status "Ready to Test" or "Complete", not "Processing" or "Invalid", and the Internal Testing group must have it.

## Key Decisions

| # | Recommendation | Because |
|---|---|---|
| 1 | USE the current split: Xcode-account signing plus API-key upload (`scripts/testflight.sh`) | The script header says signing with the signed-in Apple ID avoids the Admin role that API-key cloud signing needs, so the key stays at App Manager. Of the repos read, none else splits it this way: Quilcast signs through the API key (cloud signing), the fastlane repos use match or an imported certificate. |
| 2 | USE build number = max(local, ASC highest) + 1, read from the ASC API | Already in `scripts/testflight.sh` (`asc_max_build`). It is the same idea as fastlane `latest_testflight_build_number + 1`, with no Ruby dependency. |
| 3 | SKIP fastlane and match for now | One app, one Mac, one signer. Game Shelf, Apollon and OpenAthlete need match or a CI certificate import only because CI has no Xcode account. Revisit when builds move to GitHub Actions. |
| 4 | USE `xcodebuild -exportArchive` to an .ipa, then `xcrun altool --upload-app` with the API key | Same pair Quilcast's `ios/release.sh` uses. Apple documents Transporter as the CLI alternative for JWT uploads; altool works today, so SKIP a swap until altool prints a deprecation error. |
| 5 | KEEP `ITSAppUsesNonExemptEncryption = NO` as a preflight failure | Info.plist on `main` has it set to false. Without it every build stops on the export compliance question. |
| 6 | USE internal testing only until the native shell has push and share features | Internal groups need no Beta App Review. The first external build goes to App Review, and guideline 4.2 ("beyond a repackaged website") applies to a pure `server.url` shell. |
| 7 | USE the 2 Apple-rule fixes before any external group or App Store submit: Sign in with Apple (or a 4.8 exemption check) and in-app account deletion | Sparkz uses Farcaster sign-in, which is a third-party login; 4.8 and 5.1.1(v) are the most common wrapper rejections. |
| 8 | USE a CI check that fails when `main` is behind ASC, on top of the script's printed `git add` reminder | The bump is committed by hand after upload; build 3 was skipped, so a stale `main` is the failure mode and ASC is the source of truth. |

## 1. Build numbering

- Two numbers matter. The marketing version (`CFBundleShortVersionString`, `MARKETING_VERSION`, here `0.1.0`) is user-facing. The build (`CFBundleVersion`, `CURRENT_PROJECT_VERSION`, here `4`) identifies a binary. Apple's upload page says the bundle ID and version number associate a build with an app record, and "the build string is used to uniquely identify the build throughout the system" [Apple upload-builds help, FULL for this fact].
- Rule: the build must rise every upload within a version train. `scripts/testflight.sh` enforces it: `FLOOR = max(CURRENT, ASC_MAX)`, `NEXT = FLOOR + 1`, and it dies if `BUILD_NUMBER` is not above the floor.
- Sparkz reads App Store Connect with `GET /v1/builds?filter[app]=<id>&sort=-uploadedDate&limit=200&fields[builds]=version` and takes the max. This is the same pattern as fastlane: the docs example is `increment_build_number({ build_number: latest_testflight_build_number + 1 })`, with `initial_build_number` as the first-upload fallback [fastlane docs, FULL].
- Setting it: Sparkz seds `CURRENT_PROJECT_VERSION` in `project.pbxproj` (Info.plist takes it from the build setting) and restores it on any exit that is not a finished upload (`restore` in the EXIT trap). Quilcast passes `MARKETING_VERSION="$1" CURRENT_PROJECT_VERSION="$2"` as xcodebuild arguments instead (`ios/release.sh`), which never touches the project file. OpenAthlete does the same through `xcargs` and then rewrites `project.pbxproj` back from a saved copy.
- Recommendation: move Sparkz to the xcodebuild-argument form. It removes the sed, the backup file and the restore logic (about 6 lines of `scripts/testflight.sh`), but the repo then no longer records the last uploaded number, so keep the commit `ios: build N uploaded` as the record. Quilcast also ties the iOS build number to the Android versionCode so both stores count alike; Sparkz has no Android build, so skip that.
- Failure seen: build 3 was never uploaded (lane report), so numbers can skip. That is allowed; they only have to rise.

## 2. Signing

- Automatic vs manual. Sparkz uses `CODE_SIGN_STYLE=Automatic` with `-allowProvisioningUpdates` and exportOptions `signingStyle automatic`. Manual signing (Apollon, Game Shelf, OpenAthlete) pins a named profile such as "match AppStore <bundle id>" and needs certificates in CI. Manual is for CI machines with no Xcode account; automatic is correct for one developer Mac.
- Two ways automatic signing authenticates:
  1. The Apple ID signed in to Xcode (Xcode > Settings > Accounts). Same identity as an Archive click.
  2. An App Store Connect API key passed to xcodebuild (`-authenticationKeyPath`, `-authenticationKeyID`, `-authenticationKeyIssuerID`), which enables cloud-managed signing. Quilcast's `ios/release.sh` does this on its release runner.
- The Admin requirement. The `scripts/testflight.sh` header states cloud signing would require the Admin role on the key, and that Sparkz avoids it so the key can stay at App Manager. [Likely] correct: it matches how Apple describes team keys and roles on the manage-API-keys page, but that page's role table did not render in the fetch (see Sources), so the Admin claim rests on the script header, not on Apple text I read.
- Why Sparkz splits signing from upload (`scripts/testflight.sh`, "Least privilege, split in two"): the key that uploads can be an App Manager key; the identity that signs is the human's local Xcode session. A leaked key cannot mint certificates. The cost: the pipeline only runs on Zaal's Mac, not in CI. Note the script's own caveat: `-allowProvisioningUpdates` may create or renew certificates and profiles even on `--dry-run`.
- Moving to CI later: copy OpenAthlete's pattern (a base64 distribution .p12 imported into a temporary keychain, then `get_provisioning_profile(force: true)` so a new capability never leaves a stale profile) or Game Shelf's `match` with a private encrypted repo. Both are manual signing; neither needs an Admin key.

## 3. Upload

| Tool | What it is | Use for Sparkz |
|---|---|---|
| `xcrun altool --upload-app` | CLI upload with `--apiKey --apiIssuer --p8-file-path` | USE now. Works with the key; Sparkz and Quilcast use it. |
| Transporter CLI | Apple's upload tool; Apple says it takes JWTs, the same ones the API uses [Apple upload-builds help, FULL for this fact] | SKIP until altool fails. It is the migration target. |
| `notarytool` | Notarization for macOS Developer ID apps | SKIP. Not for iOS. Fatline uses it for its Mac DMG (`apple/scripts/release.sh`), not TestFlight. |
| `xcodebuild -exportArchive` with `destination upload` | Export and upload in one step; needs the Xcode account or `-authenticationKey*` flags | SKIP. Sparkz exports with `destination export` so it can keep the .ipa and split signing from upload. |
| fastlane `upload_to_testflight` | Wrapper with `skip_waiting_for_build_processing` and `uses_non_exempt_encryption: false` | SKIP for now (Key Decisions row 3). |

- API key handling. The .p8 can be downloaded once ("This file cannot be downloaded again after the page has been refreshed" - fastlane App Store Connect API docs, FULL). `scripts/testflight.sh` keeps it at `~/.zao/private/asc/AuthKey_<KEY_ID>.p8`, refuses a path inside the repo, refuses a world-readable file, and never prints it. Known leak: the key ID and issuer ID are visible in `ps` while altool runs (script header). Neither is the secret.
- Processing: the script prints "Apple processes it for 10 to 30 minutes". `docs/TESTFLIGHT.md` step 7 says 5 to 60 minutes. Keep both ranges in mind: the real number is whichever your ASC email shows. Apple says you get an email when processing completes.
- Export compliance: set `ITSAppUsesNonExemptEncryption` to `false` in Info.plist when the app only uses exempt (HTTPS/OS) encryption. Sparkz `main` has it. Game Shelf instead passes `uses_non_exempt_encryption: false` to `upload_to_testflight`. Either works; the plist key stops the prompt for every future build.

## 4. TestFlight review and tester groups

- Internal: up to 100 App Store Connect users with access to the app. No Beta App Review. They must be team members, so Sparkz invites with the Developer role (`docs/TESTFLIGHT.md` step 8).
- External: up to 10,000 testers by email or public link. The first build added to an external group goes to App Review; Apple says "review is required only for the first build. Subsequent builds may not require a full review" [Apple testflight-overview, FULL]. `docs/TESTFLIGHT.md` estimates about 48 hours.
- Public link: external group feature; tester criteria (device, OS) can limit who accepts, and tight criteria reduce the number of testers [Apple testflight-overview, FULL].
- Expiry: builds become unavailable to testers after 90 days (Apple, FULL). A Sparkz shell that loads a live site still needs a new build before day 90, or testers lose the app. Put a calendar reminder at day 80 (Next Actions).
- What triggers beta review: adding a build to an external group the first time, and, in Apple's words, "may not require a full review" later; changes that matter to review (new permissions, new login method) can re-trigger it. [Likely]; the exact trigger list was not in the fetched text.
- ExportOptions detail: `testFlightInternalTestingOnly` is `true` in the Sparkz script, which makes the build ineligible for external groups or the App Store. That is deliberate; flip it to remove the guard on the day Zaal wants external testers.

## 5. Common rejections for WebView and Capacitor wrappers

Text below is from Apple's App Store Review Guidelines page, fetched 2026-11-13 [FULL].

| Guideline | What it says | Sparkz exposure | Fix |
|---|---|---|---|
| 4.2 Minimum Functionality | "Your app should include features, content, and UI that elevate it beyond a repackaged website." | HIGH for App Store; none for internal TestFlight | Ship native features before store review: native tab bar (already in `@capgo/capacitor-native-navigation`, per `docs/TESTFLIGHT.md`), push notifications, share sheet, associated domains. |
| 4.8 Login Services | An app that uses a third-party or social login to set up the primary account "must also offer as an equivalent option another login service" that limits data to name and email, allows a private email, and does not track for ads. | MEDIUM-HIGH: Farcaster sign-in is a third-party login | Add Sign in with Apple, or document why Farcaster sign-in falls under an exemption. Check the exemption text on the page before relying on it. |
| 5.1.1(v) Account Sign-In | "If your app supports account creation, you must also offer account deletion within the app." Also: access without a login if core function is not tied to one social network. | HIGH: Sparkz has accounts | In-app delete-account flow that removes the Hearth profile data. |
| 2.1 App Completeness | Final versions, working URLs, no placeholders, and "demo account info (and turn on your back-end service!)" if there is a login. | HIGH for a login-gated alpha (only Zaal and IMan can sign in per `docs/TESTFLIGHT.md`) | Give App Review a demo account or an approved demo mode. |
| 1.2 User-Generated Content | UGC apps need a filter for objectionable material, a report mechanism, a way to block abusive users, and published contact information. | MEDIUM: Hearths accumulate contributor content | Report and block controls plus a contact page, before store review. |

How wrappers add native value (each maps to 4.2): native tab bar and pull-to-refresh (done in #324 line of work), push (`@capacitor/push-notifications` and an APNs key), share extension, Associated Domains (`applinks:trysparkz.com` with `/.well-known/apple-app-site-association`), haptics, offline fallback (`cap-www/index.html` is already the fallback). Apollon also ships Capacitor App Store screenshots from simulators through fastlane (`lane :screenshots`) - a store-prep step Sparkz does not yet have.

## 6. Open-source pipelines

All licences read from the LICENSE file with `gh api repos/O/R/contents/LICENSE --jq .content | base64 -d | head -3` on 2026-11-13.

| Repo | Licence (from file) | Stack | Pipeline file | What to copy |
|---|---|---|---|---|
| github.com/backmeupplz/quilcast | MIT, "Copyright (c) 2026 Nikita Kolmogorov" | Native Swift Farcaster client, iPhone and Android | `ios/release.sh`, `.forgejo/workflows/release.yml` (job on `macos-26`), `.github/scripts/appstore.py` | Shell-only pipeline: `xcodebuild archive` with `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION` args, `-exportArchive` with `-authenticationKey*` flags, then `altool --upload-app`. Also `appstore.py` to submit the uploaded build to App Review with the same API key. The p8 is restored from a secret into the job's temp folder. Mode input `testflight-only` uploads without submitting. |
| github.com/farcasterxyz/client | MIT, "Copyright (c) 2026 Neynar, Inc." | Expo / React Native Farcaster app (`apps/farcaster-mobile`) | `apps/farcaster-mobile/eas.json` | Profile layout: `base` extended by `development`, `preview`, `internal`, `production`; pinned `node 24.3.0`, `cocoapods 1.16.2`, image `macos-sequoia-15.6-xcode-26.2`; `submit.production.ios.ascAppId`. Copy the pinned Xcode image idea. |
| github.com/dylsteck/litecast | MIT, "Copyright (c) 2025 Dylan Steck" (file is `LICENSE.md`) | Expo / React Native Farcaster client | `eas.json` | Minimal EAS file: `development`, `preview`, `production` profiles with env keys and an empty `submit.production`. Shows the smallest working EAS config; nothing else to copy. |
| github.com/danromero/fatline-monorepo | MIT, "Copyright (c) 2026 Dan Romero" | Native Swift Farcaster client (Mac, iPhone, Chrome) | `apple/scripts/release.sh`, `.github/workflows/ci.yml` | `release.sh` is a Mac Developer ID and notarytool script, not TestFlight. Copy its guards: refuse a dirty git tree, refuse the example bundle ID, check the provisioning profile is embedded, run tests before archive. `ci.yml` runs only server and Chrome jobs, no iOS upload. |
| github.com/ls1intum/Apollon | MIT, "Copyright (c) 2024 TUM Applied Education Technologies" | Capacitor webapp, fastlane | `standalone/webapp/fastlane/Fastfile` (614 lines) | Capacitor-specific: rebuild web assets and `cap sync ios` immediately before archiving so a lane cannot archive stale or seeded assets; `build` and `release` lanes split (`upload_to_testflight(skip_waiting_for_build_processing: true)`); screenshot lane with simulators. |
| github.com/thetigeregg/game-shelf | MIT, "Copyright (c) 2026 thetigeregg" | Capacitor app, fastlane + match | `ios/fastlane/Fastfile` (161 lines) | Closest to Sparkz's number logic: `latest_testflight_build_number` + 1, then `sync_ios_prod_version`, `match` (readonly in CI), `build_app` with `export_method: 'app-store'`, `upload_to_testflight(uses_non_exempt_encryption: false)`, plus `validate_asc_app` and `validate_match` preflight lanes. |
| github.com/openathleteorg/openathlete | AGPL-3.0 (file header: GNU Affero General Public License v3) | Capacitor app, fastlane | `apps/web/fastlane/Fastfile` (266 lines) | CI release lane: import a base64 .p12 into a temp keychain, `get_provisioning_profile(force: true)`, restore `project.pbxproj` in an `ensure` block, `RELEASE_TAG` env drives the version, `ios submit` is a separate lane. AGPL: read the pattern, do not paste code into Apache-2.0 Sparkz. |
| github.com/Lokavaluto/monujo | AGPL-3.0 (file header) | Ionic / Capacitor app, fastlane + match | `fastlane/Fastfile` (1187 lines) | Recovery helpers for revoked or expired match certificates (`ensure_ios_signing`). AGPL, pattern only. Too large to copy. |

Not found: no open-source Farcaster Capacitor app with a published TestFlight pipeline. The GitHub code search for `upload_to_testflight filename:Fastfile capacitor` returned 82 results, `testflight capacitor filename:Fastfile` returned 94; I read 4 Capacitor Fastfiles. Sparkz is the only Farcaster app in this set built as a server-url Capacitor shell.

## 7. Community

- HN, item 29043643 (comment by user dfabulich): a developer reports App Store reviewers rejected his games with the argument "Your app is clearly a web clipping... this app adds no additional value to the web site. You need to add features to your app - iOS-specific features." He calls it a reasonable reading of 4.2. [FULL] on this comment via the HN Algolia item API. Date of the thread: not read (the item API returns `created_at`, not printed here). This is the exact rejection shape Sparkz faces at store review.
- HN, item 36886847 (user joshstrange): says he shipped 10+ cross-platform apps on Quasar plus Capacitor and Ionic, some with remote JS/HTML/CSS update, all approved. [FULL] on the comment; it is one person's experience, not Apple policy.
- Reddit search (r/Capacitor, `search.json?q=rejected+4.2`): [FAILED - HTTP 403 from reddit.com with a browser User-Agent; no Reddit evidence in this doc].
- No GitHub issue on a Capacitor repo was read for this doc. [Guessing] that Capacitor issues contain more rejection reports; not searched.

## Message to Shaw (draft, Zaal sends)

Do not send without Zaal. Shaw Makes Magic is named only as the recipient; nothing is claimed about him.

1. Hi Shaw, Zaal from The ZAO here; we ship Sparkz, a Next.js app in a Capacitor iPhone shell, to TestFlight.
2. Today we sign with the Xcode account and upload with an App Store Connect API key from a script; build numbers come from ASC.
3. How do you ship to TestFlight: fastlane, Xcode Cloud, EAS or something else, and how do you handle signing and version bumps?
4. Any open-source pipeline of yours we could learn from? Happy to share ours back.

## Next Actions

| # | Action | Owner | Date | Done when |
|---|---|---|---|---|
| 1 | Confirm build 4 in App Store Connect > Apps > Sparkz > TestFlight > iOS builds, and that Internal Testing has it | Zaal | 2026-11-14 | Screenshot or note: build 4 (0.1.0) shows "Ready to Test" or "Complete", not "Processing" or "Invalid" |
| 2 | Send Shaw (Shaw Makes Magic) the 4-line message above; do not send without Zaal | Zaal | 2026-11-14 | Zaal confirms sent; any reply pasted into the Sparkz lane |
| 3 | Add a calendar reminder 10 days before the 90-day expiry of build 4 (upload was 2026-11-12, expiry about 2027-02-10) | Zaal | 2026-11-14 | Reminder exists dated 2027-01-31 or earlier |
| 4 | Decide Sign in with Apple vs a documented 4.8 exemption for Farcaster login, and write the decision in `docs/` | Zaal | 2026-11-16 | Decision note merged to `main` |
| 5 | Build in-app account deletion (guideline 5.1.1(v)) and report/block controls (1.2) | sparkz lane | 2026-11-20 | PR merged; delete flow demonstrated on a TestFlight build |
| 6 | Add a CI check that fails if `CURRENT_PROJECT_VERSION` on `main` is below the highest ASC build, or make the script print a loud reminder to commit the bump | sparkz lane | 2026-11-18 | Check or reminder in a merged PR; build 5 run records the commit |
| 7 | Prepare a demo account or demo-mode request for App Review (guideline 2.1) and a native-feature list for 4.2 | Iman | 2026-11-20 | One page in `docs/` listing demo login steps and the native features present in the build |
| 8 | Compare Apollon's `cap sync` before archive and Game Shelf's `validate_asc_app` preflight with `scripts/testflight.sh` and port any missing guard | sparkz lane | 2026-11-18 | PR that adds the guard or a comment explaining why it is not needed |
| 9 | Re-fetch Apple's manage-API-keys and cloud-signing pages in a real browser and confirm the Admin-role claim in the script header | Iman | 2026-11-17 | Quote from Apple's page added to this doc under Sources |

## Sources

1. https://developer.apple.com/app-store/review/guidelines/ [FULL] - quoted 4.2, 4.8, 5.1.1(v), 1.2, 2.1. Fetched 2026-11-13 with curl.
2. https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview [PARTIAL - page body fetched; internal/external 100 and 10,000 limits, 90-day expiry and first-build review confirmed; the list of what re-triggers review not found]
3. https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers [PARTIAL - public-link criteria and notify behaviour read; no explicit review-trigger list]
4. https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds [PARTIAL - upload via Transporter with JWT and the build-string identity quote read; altool deprecation status not found on the page]
5. https://developer.apple.com/help/app-store-connect/manage-your-team/manage-api-keys [PARTIAL - page fetched (200) but the role table did not render; the Team Key and "Individual keys can't use Provisioning endpoints or notaryTool" lines read; the Admin requirement for cloud signing not confirmed from Apple text]
6. https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api [FULL - the HTML page is a JavaScript-only shell; the content was read from Apple's JSON form, https://developer.apple.com/tutorials/data/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api.json (200, 15 KB): Team keys reach all apps whatever the role, Individual keys cannot use the Provisioning endpoints, and the Admin role can create and delete users]
7. https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations [FULL - read from the JSON form, https://developer.apple.com/tutorials/data/documentation/security/complying-with-encryption-export-regulations.json (200, 12 KB). It says App Store Connect asks the compliance questions on every new version unless Info.plist carries the key, and that encryption built into the OS, such as HTTPS, is typically exempt, which matches Key Decision 5]
8. https://docs.fastlane.tools/actions/latest_testflight_build_number/ [FULL] - `latest_testflight_build_number + 1` example and `initial_build_number`.
9. https://docs.fastlane.tools/app-store-connect-api/ [FULL] - .p8 one-time download, key ID, issuer ID, JWT.
10. https://capacitorjs.com/docs/ios [PARTIAL - confirms Capacitor 8 era requirements: iOS 15+, Xcode 26.0+, WKWebView; deploy page https://capacitorjs.com/docs/ios/deploying-to-app-store returned only a shell, FAILED]
11. https://github.com/bettercallzaal/sparkz - `scripts/testflight.sh` (255 lines) and `docs/TESTFLIGHT.md` (147 lines) read in full via `gh api`; `ios/App/App/Info.plist` and `project.pbxproj` read on `main`. [FULL]
12. https://github.com/backmeupplz/quilcast , https://github.com/farcasterxyz/client , https://github.com/dylsteck/litecast , https://github.com/danromero/fatline-monorepo [FULL for the files named; `.forgejo/workflows/release.yml` of Quilcast read only by pattern-matched lines, so PARTIAL for the whole workflow]
13. https://github.com/ls1intum/Apollon , https://github.com/thetigeregg/game-shelf , https://github.com/openathleteorg/openathlete , https://github.com/Lokavaluto/monujo [PARTIAL - Fastfiles read in key sections (Apollon lines 174-260, Game Shelf 112-161, OpenAthlete 189-255); Monujo skimmed by grep only]
14. https://news.ycombinator.com/item?id=29043643 and https://news.ycombinator.com/item?id=36886847 [FULL for the two comments, via https://hn.algolia.com/api/v1/items/<id>]
15. https://www.reddit.com/r/Capacitor/search.json?q=rejected+4.2 [FAILED - HTTP 403 with a browser User-Agent]
