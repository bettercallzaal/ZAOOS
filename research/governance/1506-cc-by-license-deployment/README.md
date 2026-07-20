# 1506 — CC-BY LICENSE File Deployment (5 Min, Do Now)

**Type:** ACTION-BRIEF  
**Topic:** Governance  
**Status:** DO NOW — 5 minutes. Paste the LICENSE file below and submit a PR to bettercallzaal/ZAOOS.

---

## Why This Matters

The ZAOOS corpus claims to be "CC-BY licensed" in every README, press kit, and grant application. But as of July 2026, there is no LICENSE file in the root of the bettercallzaal/ZAOOS repository.

This means:
- The CC-BY claim is unenforceable — there's no actual license grant
- Researchers, journalists, and grant reviewers cannot verify the license
- DAOstar's daoURI JSON spec expects a `license` field with a verified URL
- Wikipedia will not accept citations to unlicensed material

Fix: add a `LICENSE` file to the repo root in 5 minutes.

---

## The LICENSE File (Paste Into GitHub)

**Create file:** `LICENSE` (no extension) at the root of bettercallzaal/ZAOOS

**Contents:**

```
Creative Commons Attribution 4.0 International (CC BY 4.0)

Copyright (c) 2024-2026 ZAO (Zaalian Arts Organization)
All research documents in this repository are licensed under:
Creative Commons Attribution 4.0 International License

You are free to:
  Share — copy and redistribute the material in any medium or format
  Adapt — remix, transform, and build upon the material for any purpose, 
  even commercially

Under the following terms:
  Attribution — You must give appropriate credit, provide a link to the 
  license, and indicate if changes were made. You may do so in any 
  reasonable manner, but not in any way that suggests the licensor 
  endorses you or your use.

No additional restrictions — You may not apply legal terms or technological 
measures that legally restrict others from doing the same.

Full license text: https://creativecommons.org/licenses/by/4.0/

SPDX-License-Identifier: CC-BY-4.0
```

---

## How to Deploy (3 Options)

### Option A — GitHub Web UI (Fastest, 2 Min)

1. Go to: github.com/bettercallzaal/ZAOOS
2. Click **Add file → Create new file**
3. Filename: `LICENSE`
4. Paste the content above
5. Commit message: `add CC-BY 4.0 LICENSE file to repository root`
6. Commit directly to `main` (or PR if the repo has branch protection)

### Option B — GitHub CLI (If Zaal Has Git Locally, 3 Min)

```bash
cd ~/zao-os
git checkout -b add-cc-by-license
cat > LICENSE << 'EOF'
Creative Commons Attribution 4.0 International (CC BY 4.0)
...
SPDX-License-Identifier: CC-BY-4.0
EOF
git add LICENSE
git commit -m "add CC-BY 4.0 LICENSE file to repository root"
git push -u origin add-cc-by-license
# Then open PR via gh pr create
```

**Note:** This doc's PR IS the CC-BY LICENSE deployment mechanism — no separate action needed if this doc's PR goes through the standard loop.

### Option C — Via Claude Code (Immediate)

Claude Code can create the file in the ZAOOS repo and open a PR in the same session.

---

## Post-Deploy Updates

After the LICENSE file is merged to main:

| Doc | Update |
|---|---|
| 1381 (CC-BY doc) | Update status to DONE |
| 1483 (press kit) | Change "CC-BY" to "[CC-BY license](github.com/bettercallzaal/ZAOOS/blob/main/LICENSE)" |
| 1430 (DAOstar) | Add `"license": "https://github.com/bettercallzaal/ZAOOS/blob/main/LICENSE"` to daoURI JSON |
| 1470 (OP RF) | Update evidence table — CC-BY license now verifiable |
| ZAOOS root README | If there's a README.md at root, add "Licensed under [CC BY 4.0](LICENSE)" badge |

---

## License Verification URL

After deploy, the license is verifiable at:
```
https://github.com/bettercallzaal/ZAOOS/blob/main/LICENSE
```

This URL can be cited in:
- DAOstar daoURI JSON `license` field
- OP RF submission evidence
- Grant applications (Fractured Atlas, Fisher, MAC)
- Wikipedia citations (if added to the WaveWarZ/ZAO article in doc 1505)
- Press kit (doc 1483)

---

## Why CC-BY 4.0 (Not CC-BY-SA or MIT)

| License | Why Not |
|---|---|
| CC-BY-SA | SA = ShareAlike forces derivative works to use the same license. If a researcher wants to incorporate ZAOOS docs into a proprietary report, SA blocks it. CC-BY is more permissive and better for academic/press adoption. |
| MIT | MIT is a software license. ZAOOS contains research documents and creative works, not code. CC-BY is the standard for creative/research works. |
| CC0 | CC0 = public domain dedication. Removes attribution requirement entirely. We want attribution (so ZAO gets cited). |

**CC-BY 4.0 is correct** — same license used by Wikipedia, OpenStreetMap, and most academic CC repositories.

---

## Related Docs

- 1381 — CC-BY License Background (earlier research on the license choice)
- 1430 — DAOstar Registration (needs LICENSE URL in daoURI JSON)
- 1470 — OP RF Submission Guide (license verifiability is evidence)
- 1483 — ZAO Press Kit (license link upgrades the "CC-BY" claim)
- 1505 — Wikipedia Stub Creation Guide (license makes citations citable)
