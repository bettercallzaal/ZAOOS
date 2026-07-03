# ZAO Whitepaper - Resource Pack

> Accumulating source material for the whitepaper, internal (the research library) and external (web). Each `/loop` tick adds more. Maps resources to the sections of `ZAO-Whitepaper.md`. Not prose - a sourcing index the drafts pull from.

Last updated: 2026-07-02 (tick 1).

## Internal - the research library

### Prior whitepaper work (read + reconcile before v1.0)
- **community/051-zao-whitepaper-2026** - MAJOR ASSET. A full prior draft ("Draft 4.5", March 2026, 573 lines), already titled *"A Decentralized Impact Network for the Creator Economy"* - the impact-network framing predates our brainstorm and confirms it. Our v0.1 is the simpler re-framing (Five Cs spine, ~100% to artists, agents triad). Mine 051 for, specifically:
  - Sec 4 "The Numbers" + "What We Shipped" - hard facts/traction to cite.
  - Sec 5 "The Graveyard" - honest failures (feeds Section 7 limitations).
  - Sec 6 "The Four Pillars" - reconcile with our four lanes.
  - Sec 15 "Questions We Get Asked" + critique's "Skeptic Questions to Address" - preempt objections; sharpen honesty.
  - Sec 16 "Risks" - risk framing for Section 7.
  - Sec 18 "Works Cited" - external sources already gathered (fold into External below).
  - Sec 14 "Your First Week in the ZAO" - the practical "how you plug in" (feeds Section 6 alignment).
  - Critique tail: "Format Strategy: The Content Pyramid" + "Key Weaknesses Identified" - shapes shareable format.
- **governance/718-zao-fractal-whitepaper-foundations** (+ 718a-g) - the 7-sub-doc research spine (theory, mechanism, architecture, comparative, critiques, craft, distinctness).
- **governance/942-zao-fractal-whitepaper-outline-v2** - the reconciled outline + code-verification log.
- **_archive/053-whitepaper-user-testing** - prior whitepaper user testing (what confused readers - shapes the "simple" mandate).

### Section 1-2 (mission + villain: profit/data/IP, gatekeeping)
- **business/029-artist-revenue-ip-rights** - artist revenue + IP rights (direct mission backing).
- **business/876-artist-corporations-acorp-model-zao** - artist-corporation / A-Corp ownership model.
- **business/333-ai-music-licensing-sync-label-deep-dive** - label / sync-licensing economics (the extraction the villain names).
- **business/314-music-metadata-isrc-ai-distribution** - metadata/ISRC/data ownership (the "data" leg of the spine).
- **_archive/108-music-nft-landscape-2026** - music-NFT ownership landscape.

### Section 3 (impact network + Five Cs)
- Ehrlichman, *Impact Networks* digest (from brainstorm) - Five Cs, cultivate-not-build, speed of trust, ego-to-eco, weaver/steward. (Held in the design spec + this session.)
- **_archive/048-zao-ecosystem-deep-dive** - ecosystem overview (network shape).

### Section 4 (the Fractal, Respect, governance)
- **governance/696-respect-fractal-lineage-summary** - the canonical fractal lineage (Fractally/Eden/Optimism/ZAO).
- **governance/703-zao-fractal-current-state-may-2026** - live state (week count anchor - re-date before Ch on "how long").
- **governance/936-fractal-governance-design** - verified ground truth (no decay, contracts).
- **governance/941-respect-burn-decay-proposal** - the decay proposal (roadmap material; technical doc).
- **governance/056-ordao-respect-system**, **058-respect-deep-dive** - ORDAO + Respect deep dives.
- **_archive/031-governance-dao-tokenomics** - governance/tokenomics context.

### Section 5 (the lanes - pending audit)
- **business/769-zaodevz-zabalgames-repo-state** - repo/ecosystem state (feeds the lane audit).
- **infrastructure/836-zaoos-repo-estate-census** - the repo census (the audit base).
- Memory: project_wavewarz_canonical, project_zabal_games, project_zao_stock_confirmed, project_zao_os, project_four_pillars, project_zao_vs_zabal_projects.

### Section 6 (agentic future: agents + blockchain + open-source)
- **agents/887-agentverse-fetchai-agent-platform** - agent-platform context.
- Memory: project_hermes_canonical, project_zoe_soul_architecture, project_zol_farcaster_agent (the agent stack = the "resources" leg).

### Section 7 (honest limitations)
- **governance/718e-critiques-failure-modes** - the failure modes (participation collapse, visibility bias, core concentration, scaling unproven).

## External - web

- [x] Creator-economy extraction data + web3 music comparables - DONE (below, with claim-status tags).

### The extraction problem (villain, Section 1-2) - VERIFY key numbers vs primary source before citing
Claim-status: USE = safe to cite after a quick primary-source confirm; APPROX = directionally true, round it or soften; HOLD = do not cite until verified.
- **Streaming reality (strongest stat): the vast majority of artists earn very little on streaming.** Agent gave "0.19% of Spotify artists earn $50K+ / 99.81% under." USE - but cite Spotify's own **Loud & Clear** report (loudandclear.byspotify.com) as the primary source and pull the exact current figure (Spotify publishes how many artists generated $50k/$10k+). This is the single best villain stat.
- **Per-stream payout ~$0.003 - 0.005 (no fixed rate).** APPROX - Spotify does not publish a per-stream rate; frame as "fractions of a cent per stream," not a hard number.
- **Major-label deal: artist keeps ~15-20%, label keeps the rest; recoupment means many artists see $0 until costs are repaid.** APPROX/USE - standard industry framing; safe if stated as "roughly" and tied to recoupment. (Agent's $250K/$3M worked example is illustrative, not a cited fact.)
- **Top 3 majors (UMG/Sony/Warner) control ~70% of recorded music.** USE - widely reported (~68-71%); confirm current figure.
- **Creator economy ~$480-500B by 2027 (Goldman Sachs, 2023).** USE - real, widely-cited Goldman projection; confirm the exact figure/date.
- **Masters + listener data: label/platform owns the masters and the audience data; the artist gets aggregated analytics and no direct listener relationship.** USE - structurally true, strong for the "data + IP" legs of the spine.
- **"99.9% of creators earn below a living wage."** HOLD - agent tagged PARTIAL, figure varies 0.1-1%; do not cite a precise number.

### Web3 music comparables (Section 5/7 - what to emulate/avoid) - lessons solid, statuses HOLD
The *lessons* are directionally sound and citable as reasoning; the *status claims* need verification (agent marked most PARTIAL/INACCESSIBLE).
- **Sound.xyz** - tokenized releases, artist keeps masters. Agent claims shut down Jan 2026 - HOLD (unverified). Lesson: NFT-only commodifies music as a collectible; platform-shutdown risk means artist IP must be portable.
- **Royal** - fractional song ownership; fans buy revenue shares. Status HOLD (agent said active; Royal is widely reported to have wound down/pivoted - VERIFY). Lesson: fractional ownership needs real secondary-market liquidity or the tokens are worthless.
- **Audius** - decentralized protocol, artist keeps 100% rights, token rewards. Lesson (solid): token-price-dependent rewards are not predictable artist income; peg to real revenue or avoid tokens. (AUDIO price collapse is real; exact figures APPROX.)
- **Songcamp** - collaborative co-creation + NFT. Status INACCESSIBLE. Lesson: crystal-clear revenue splits up front or adoption collapses.
- **Water & Music** - research collective (not a platform), rigorous creator-economy analysis. USE as a truth-teller source + transparency model. Likely a good primary source for the extraction numbers above - mine waterandmusic.com next tick.
- **Patreon** (patronage) - recurring fan subscriptions, ~90%+ to artist, artist owns the audience relationship. Lesson (strong): the most proven non-label model; mirror the high-payout + direct-audience-ownership economics. (Exact cut varies by tier - APPROX.)

**The one-line ZAO differentiator this research earns:** contribution-governed ownership (merit, not speculative tokens) + no fees taken from artists + artist-owned data + portable IP that survives any platform. Emulate Patreon's payout + Water & Music's rigor; avoid Audius's token-dependence and Sound.xyz's platform lock-in.

**Next-tick verification queue (before any number enters the whitepaper):** Spotify Loud & Clear exact figures; Goldman creator-economy figure; major-label market share; Royal + Sound.xyz current status. Prefer Water & Music + primary sources.
- [x] Impact-network case studies + fractal precedents + whitepaper/manifesto craft models - DONE (below).

### Impact networks in practice (verify stats before citing)
- Ehrlichman, *Impact Networks* (converge.net/book) - the framework. Already digested.
- **Santa Cruz Mountains Stewardship Network** - 19-org network; trust-before-outcomes; emergent structure overcame regional tensions. Good "cultivate not build" case. (Converge case study.)
- **RE-AMP Network** - large multi-state climate coalition, cited as long-run proof networks sustain systemic change on relationship infrastructure. NOTE: specific figures the agent gave (150+ coal plants, $25M+) and one source URL looked mismatched - VERIFY before citing any number.
- **Jane Wei-Skillern's four network-leadership principles** - mission before org; manage through trust not control; promote others not yourself; build constellations not stars. Clean, quotable, matches ZAO. (Leading Learning ep. 174.)
- **Niall Ferguson, *The Square and the Tower*** - networks-vs-hierarchies intellectual scaffolding. One-line: real power lives in decentralized networks. (Note: Ehrlichman actually pushes back on Ferguson's "networks aren't strategic" - use the tension, don't just cite Ferguson.)

### Fractal governance precedents (status = verify; some may have paused)
- **Fractally / Daniel Larimer** + *More Equal Animals* (2021) - the manifesto/blueprint for fractal democracy; non-transferable Respect via weekly collaboration mining. The lineage root. (Cross-check with our doc 696/718.)
- **Eden Fractal** (June 2022, "Epoch 2") - pioneered the Respect Game; planning ORDAO. Status per agent: active/transitioning - VERIFY current state (718e notes decline risk).
- **Optimism Fractal** (Oct 2023) - Respect Game at Collective scale, Sages Council. IMPORTANT: our own 718e says Optimism Fractal PAUSED (Jan 2026) - the agent said "live." TRUST 718e / re-verify; do not assert "live."
- **Demarchy / sortition** (Kleros, Athens model) - the deeper tradition ZAO's peer-rank sits in. Good for Section 3 first-principles.

### Whitepaper & manifesto craft models (solid - direct lessons)
- **Optimism Working Constitution** - numbered framework, accessible (not legal) language, admits it's experimental (sunset clause) instead of claiming immutability. Lesson: pragmatic humility over false certainty. (Note: contrasts our "mission+creed immutable" - our immutability is values-only, which is defensible; frame it deliberately.)
- **Optimism OPerating Manual** - pair the constitution with an implementation manual (tables for thresholds/timelines/veto), "Seasons" versioning. Maps to our Technical Whitepaper + living-version design.
- **ENS Constitution** - scannable enumeration, concrete powers beside principles, italics + parenthetical asides for a conversational tone. Directly matches our "simple + shareable" mandate.
- **Nouns governance philosophy** - ground governance in shared identity + iconography + narrative, not just mechanics; manifesto-style world-building beats technical docs alone. Backs our manifesto-energy voice.
- **Bitcoin whitepaper** - lead with the problem, stay focused (9 pages, one core innovation), let elegance speak. Lesson: keep the main doc tight; push depth to the technical doc.
- **Design manifestos** (Method "Humanifesto", Bruce Mau) - keep manifestos under ~1000 words, active voice ("we believe / we do / we refuse"), community-ownable + versioned. Directly models our signable Manifesto.

**Craft synthesis for our 3-doc split:** ENS + Bitcoin = the "simple main doc" model; Optimism Constitution+Manual = the "living, versioned, main+technical" model; Nouns + design manifestos = the manifesto voice. All four validate the architecture we chose.

## Open reads queued
- community/051-zao-whitepaper-2026 (prior whitepaper - reconcile).
- Verify on-chain: current fractal week count; who drives OREC.
