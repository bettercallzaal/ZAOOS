---
topic: infrastructure, security
type: operational-protocol
status: URGENT — 64GB single-copy, zero offsite; execute Step 1 tonight
last-validated: 2026-07-18
related-docs: None
board-tasks: 8f14ad65 (media backup — URGENT)
action-owner: Zaal (executes; no assistant action possible — filesystem access)
---

# 1560 — ZAO Media Vault: Emergency Backup Protocol

> **The risk:** 64GB of ZAO media — 30GB+ of which is irreplaceable live performance recordings — exists as a single copy on Zaal's Mac. Hard drive failure, theft, or accidental deletion = permanent loss. ZAOville (Jul 25) and ZAOstock (Oct 3) will add another 50GB+. Zero offsite backups exist as of Jul 15, 2026 (per asset scan).

---

## What's at Risk

| Location | Contents | Estimated Size | Replaceable? |
|----------|----------|---------------|-------------|
| `~/Movies/` | COC Concertz recordings, WaveWarZ battle footage, ZAOville prep sessions | ~30GB | **NO** — live performances, no other copy |
| `~/Desktop/downloads/` | Downloaded media, ZAO session exports, screen recordings | ~15GB | Partially — depends on file |
| `~/Downloads/` | Misc media, clips, source files | ~10GB | Mostly yes — redownloadable |
| `~/Documents/ZAO OS V1/` | Research sessions, AI exports, session handoffs | ~10GB | Partially — some unique content |

**Priority order:** `~/Movies/` first (irreplaceable recordings), then `~/Documents/ZAO OS V1/`, then rest.

---

## Step 1 — Tonight: Local Redundancy (30 minutes)

The fastest protection against drive failure. Options in order of speed:

### Option 1A: Time Machine to External Drive (Recommended — if external drive available)

```bash
# 1. Plug in external drive
# 2. Open System Preferences → General → Time Machine
# 3. Click "Add Backup Disk" → select the drive
# 4. Time Machine will start backing up automatically
# 5. Force immediate backup:
tmutil startbackup

# Verify backup includes your Movies folder:
tmutil listbackups
```

Time Machine backs up everything incrementally. Once started, future backups are automatic.

### Option 1B: rsync to External Drive (Manual — if you want selective control)

```bash
# Mount external drive first, then:
DEST="/Volumes/YourDriveName/ZAO-Backup"
mkdir -p "$DEST"

# Priority 1: Irreplaceable recordings
rsync -av --progress ~/Movies/ "$DEST/Movies/"

# Priority 2: Research sessions
rsync -av --progress ~/Documents/ZAO\ OS\ V1/ "$DEST/ZAO-OS-V1/"

# Priority 3: Downloads
rsync -av --progress ~/Desktop/downloads/ "$DEST/Desktop-downloads/"
rsync -av --progress ~/Downloads/ "$DEST/Downloads/"

echo "Done. Verify with: du -sh $DEST"
```

### Option 1C: iCloud Drive (If no external drive available tonight)

```bash
# Create a ZAO-Backup folder in iCloud Drive
mkdir -p ~/Library/Mobile\ Documents/com~apple~CloudDocs/ZAO-Backup

# Copy critical Movies folder
cp -R ~/Movies/ ~/Library/Mobile\ Documents/com~apple~CloudDocs/ZAO-Backup/Movies/
```

iCloud sync to Apple's servers happens automatically in background. 200GB iCloud plan ($2.99/mo) covers 64GB. **This is not a permanent archive** — monthly subscription, Apple can theoretically remove access. Use for Step 1 only; do Step 2 for permanence.

---

## Step 2 — This Week: Permanent Offsite Archive (ArDrive / Arweave)

Arweave is a permanent decentralized storage network — one payment, stored forever (200-year endowment). ArDrive is the Arweave file management layer.

### Why Arweave for ZAO Media

- **Permanent:** One upload fee, stored indefinitely. No subscription, no renewal.
- **Decentralized:** Not dependent on any company (no AWS S3, no iCloud, no Google Drive).
- **ZAO-aligned:** Onchain, permanent, public. Consistent with ZAO's onchain identity.
- **Public by default:** Anyone can verify the files are stored. Good for COC Concertz archive ("permanent public record of ZAO performances").

### Cost Estimate (July 2026)

Arweave storage cost fluctuates with AR token price. Current rough estimate:
- AR token price: ~$10-$15 (varies)
- Storage cost per GB: ~$0.05-$0.10 in AR token terms (at current rates)
- 64GB total: ~$3-$7 in AR tokens

**At current rates, archiving all ZAO media permanently costs less than one month of iCloud 2TB plan.**

Use the ArDrive web app (ardrive.io) or CLI for upload.

### ArDrive CLI Setup

```bash
# Install ArDrive CLI
npm install -g ardrive-cli

# Create or import an Arweave wallet
# Option A: Create new wallet
ardrive create-wallet --output ~/Documents/zao-arweave-wallet.json

# Option B: Import existing wallet (if Zaal has AR tokens already)
# Use ardrive.io web app instead — easier for one-off upload

# Check AR balance
ardrive balance --wallet-file ~/Documents/zao-arweave-wallet.json
```

### Upload via ArDrive Web (Easiest for One-Off)

1. Go to `app.ardrive.io`
2. Connect or create Arweave wallet (generate a keyfile)
3. Fund wallet with AR tokens (buy via Binance, Coinbase, or Uniswap)
4. Create a private drive called "ZAO Media Vault"
5. Upload `~/Movies/` folder first (highest priority)
6. Upload remaining folders in priority order

**Make the drive Public** for COC Concertz recordings (permanent public archive of performances). Keep **Private** for unpublished raw session footage you might not want publicly indexed.

### ArDrive CLI Batch Upload (After wallet is funded)

```bash
WALLET=~/Documents/zao-arweave-wallet.json

# Create a drive for ZAO media
DRIVE_ID=$(ardrive create-drive \
  --wallet-file $WALLET \
  --drive-name "ZAO Media Vault" \
  --private | jq -r '.created[0].driveId')

echo "Drive ID: $DRIVE_ID"

# Upload Movies folder (irreplaceable recordings first)
ardrive upload-file \
  --wallet-file $WALLET \
  --parent-folder-id $DRIVE_ID \
  --local-path ~/Movies/

# Upload ZAO OS V1 research sessions
ardrive upload-file \
  --wallet-file $WALLET \
  --parent-folder-id $DRIVE_ID \
  --local-path ~/Documents/ZAO\ OS\ V1/
```

---

## Step 3 — Monthly: Verify and Extend

| Check | Command / Action | Frequency |
|-------|-----------------|-----------|
| Time Machine last backup date | System Prefs → Time Machine → "Latest Backup" | Weekly |
| ArDrive upload confirmation | app.ardrive.io → check drive contents | After each event |
| New recordings after ZAOville | Upload `~/Movies/ZAOville-Jul25/` to ArDrive | Jul 26 |
| New recordings after ZAOstock | Upload `~/Movies/ZAOstock-Oct3/` to ArDrive | Oct 4 |
| ArDrive wallet balance | Check before large uploads | Before each event upload |

---

## Post-Event Media Protocol (ZAOville Jul 25 and ZAOstock Oct 3)

Both events will generate 20-30GB of new footage. Build the upload into the day-after protocol:

**Day After Each Event:**
1. Copy all new footage from recording devices to `~/Movies/[EventName-Date]/`
2. Verify Time Machine captured it (check Last Backup time)
3. Upload new folder to ArDrive "ZAO Media Vault"
4. Tag the upload in ZAOOS board as done

**Pre-ZAOville Checklist (Jul 24):**
- [ ] External drive plugged in and Time Machine running
- [ ] ArDrive wallet funded with ≥5 AR tokens (covers ZAOville footage)
- [ ] Upload existing ~/Movies/ to ArDrive before the event (eliminates existing risk)

---

## Quick Reference: What You Need

| Item | Source | Time |
|------|--------|------|
| External drive (≥128GB) | Any USB-C drive, Best Buy/Amazon | 2h to receive or existing |
| Time Machine running | macOS built-in | 5 min to configure |
| ArDrive account | app.ardrive.io | 10 min |
| AR tokens (~10 AR = ~$100-$150) | Coinbase → withdraw to Arweave wallet | 30 min |
| ArDrive CLI (optional) | `npm install -g ardrive-cli` | 5 min |

**Tonight's minimum viable action:** Enable Time Machine on an existing external drive. That alone eliminates the single-copy risk for the price of zero dollars.

---

## Sources

- Board task `8f14ad65`: "URGENT: back up 64GB single-copy ZAO media (30GB+ irreplaceable recordings in ~/Movies, ~/Desktop/downloads, ~/Downloads)"
- Arweave storage costs: arwiki.wiki/Cost (updated live with AR price)
- ArDrive documentation: docs.ardrive.io
- ZAOville backup priority: doc 1228 (day-of runbook)
