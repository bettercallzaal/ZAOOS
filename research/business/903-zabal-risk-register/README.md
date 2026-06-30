---
topic: business
type: decision
status: research-complete
last-validated: 2026-06-25
superseded-by:
related-docs: 902
original-query: "what is our potential risk and how do we mitigate that /loop"
tier: STANDARD
---

# 903 - ZABAL Gamez / The ZAO risk register + mitigations

> **Goal:** Catalog the real risks to ZABAL Gamez (and The ZAO around it), ranked by exposure, each with a concrete mitigation. Grounded in the repo's own warnings + the season's actual setup.

## Key Decisions (top mitigations first)

| Risk | Severity | Mitigation (do this) | Status |
|------|----------|----------------------|--------|
| No legal entity behind money/contracts/prizes | HIGH | Form the LLC (doc 902) - Wyoming Instant Series LLC via OtoCo, hold the brand + run prize/sponsor flows through it | Not started |
| Brand not trademarked + name drift | HIGH | Trademark "ZABAL Gamez" (the mark + name); enforce the glossary in CLAUDE.md; fix stale "magnetic.ai" -> "Magnetiq" in data | Partial (glossary exists) |
| Key-person dependency (Zaal is the single operator) | HIGH | Document the playbooks (workshop-production-workflow exists), delegate production (Iman on media), and route ownership through the ZAO collective | Partial |
| Token/prize = securities exposure | HIGH | Issue any token/prize from the LLC; legal review before $ZABAL or paid collectibles; keep tokenless where possible (the tokenless Empire model) | Not started |
| Lost work from git/PR mishandling | MED | The CLAUDE.md git rules (verify PR open before pushing; one PR = one unit; re-sync main) - already documented; keep following | Documented |
| Platform dependency (Farcaster/Vercel/Upstash/Luma/Magnetiq/YouTube) | MED | Own the data (recordings + transcripts kept locally, static portable site, no-build edge functions); never single-source the canonical record | Strong |
| Secrets / signer-key handling | MED | Back up keys off the single machine; rotate; the manifest accountAssociation is signed - never hand-edit; keep API tokens in env, not code | Partial |
| Reputation / follow-through on public commitments | MED | Don't over-promise; the "on hold" announcement discipline; deliver what's cast | Ongoing |

## Findings - the risk register

### 1. Legal / liability (HIGH)
ZABAL Gamez signs sponsor/partner deals, runs prize pools ($500 Finals USDC, $Zabal, POIDH bounties), and has collectible/registration surfaces (Magnetiq). With **no entity**, that activity attaches personally to whoever runs it. **Mitigate:** the LLC (doc 902). An LLC also becomes the clean owner of the brand, the contracts, and any token issuance.

### 2. Brand + IP (HIGH)
- The name/mark "ZABAL Gamez" is **not trademarked** - anyone could file it. The brand is the season's core asset.
- **Name drift is already happening:** `data/bonfire-graph.json` still calls the workshop-library vendor "magnetic.ai / Tyler Stambaugh" (lines ~5511-5786, 7901) - the glossary corrected this to **Magnetiq (magnetiq.io)** on 2026-05-24. Brand inconsistency in a machine-readable graph propagates.
- **Mitigate:** (a) trademark the name + hold it in the LLC; (b) one-pass fix the "magnetic" references to "Magnetiq" in the data; (c) the CLAUDE.md glossary is the enforcement doc - keep it authoritative.

### 3. Key-person dependency (HIGH)
Zaal is the single operator across recruiting, hosting, production, posting, and the build. If he's unavailable, the season stalls. **Mitigate:** the documented workflows (workshop-production-workflow.md, media-playbook.md), Iman on media production, and routing entity/brand ownership through The ZAO so it's not personally bottlenecked.

### 4. Token / financial / regulatory (HIGH if tokens)
Prize pools and any $ZABAL / paid collectible flirt with securities + money-transmission rules. **Mitigate:** issue from the LLC (OtoCo markets the LLC as a token/SAFE issuer), get legal review before formalizing a token, and lean on **tokenless** mechanics where possible (the tokenless Empire, Respect as non-transferable governance) which sidestep most of it.

### 5. Lost work / process (MED - well-mitigated)
The repo has a real history of stranded PRs (CLAUDE.md documents PR #54: merged ~2 min after opening, next commits stranded on a dead branch) and a parallel-session doc-number collision (the 819 renumber). **Mitigate:** the CLAUDE.md git rules already encode the fixes - verify the PR is OPEN before every push, one PR = one finished unit, re-sync main after merge. Keep following them.

### 6. Platform dependency (MED - well-mitigated)
The season rides on Farcaster, Vercel, Upstash, Luma, Magnetiq, YouTube, Cal.com. Any could change terms, pricing, or break. **Mitigate (already strong):** every recording + transcript is kept locally; the site is static + portable (no-build edge functions, zero npm); the canonical record is in-repo, not in a vendor. The exposure is real but the "kept" philosophy blunts it.

### 7. Secrets / security (MED)
Companion ZAO work flagged real handling gaps (a toolkit that leaked a signer key; "no off-Pi key backup"). For ZABAL Gamez specifically: the Mini App manifest accountAssociation is signed (do NOT hand-edit), API tokens live in env vars. **Mitigate:** off-machine key backup, rotation, secrets in env not code, and the standing rule to never paste secrets into tools.

### 8. Reputation / commitment (MED)
Public casts are promises. Over-promising (dates that slip, announcements that stall) erodes trust. **Mitigate:** the existing "on hold" discipline (announcements held until ready), and shipping what's cast.

## Also See

- [Doc 902](../902-otoco-llc-for-zabal/) - the LLC mitigation for risks 1, 2, 4.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Form the LLC (Wyoming Instant Series via OtoCo) and assign the brand to it | @Zaal | Task | This month |
| File a trademark for "ZABAL Gamez" | @Zaal | Task | This month |
| Fix "magnetic.ai" -> "Magnetiq" in data/bonfire-graph.json (zabalgames repo) | @Zaal | PR | This week |
| Off-machine backup of signing/API keys + rotation pass | @Zaal | Task | This week |
| Legal review before any $ZABAL / paid collectible / token | @Zaal | Task | Before launch |

## Sources

- [Doc 902 - OtoCo LLC](../902-otoco-llc-for-zabal/) [FULL - the entity mitigation]
- zabalgames `CLAUDE.md` [FULL - git/PR loss history (PR #54), brand glossary, manifest-signing rule, storage model]
- zabalgames `data/bonfire-graph.json` [FULL - the "magnetic.ai" brand-drift instances]
- zabalgames `docs/workshop-production-workflow.md` + `media-playbook.md` [FULL - the documented process that mitigates key-person risk]
- ZAOOS doc 894 (ZOL launch ship log) [PARTIAL - the signer-key-leak + no-key-backup security findings, as a cross-project signal]
