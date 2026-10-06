---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-10-06
superseded-by:
related-docs: "agents/2623-zaal-manual-task-handoff-map"
original-query: "lets reserach best options for this i have lots of drive space (Zaal, 2026-10-06, Grill, board card 9859: Mac backup)"
tier: QUICK
---

# 2626 - Backing up the Mac: the options, with what Zaal already has

> **Goal:** This Mac has no backup. Pick one from what is already owned: lots of Google Drive space, a Pi, and a VPS. It matters now because the estate's federation keypair is not to be generated until the Mac is backed up (vault BLACKBOARD: "The federation keypair is not generated until this Mac is backed up"), and because the disk hit 4 GB free today.

## Measured on this Mac, 2026-10-06

| Fact | Value | How |
|---|---|---|
| Data volume | 460 GiB total, 379 GiB used, 48 GiB free | `df -h /System/Volumes/Data` |
| Time Machine | "No destinations configured." | `tmutil destinationinfo` |
| Attached drive | ZUSB, 128.4 GB, exFAT, 2.9 GB free | `diskutil info /Volumes/ZUSB` |
| RAM | 24 GB | from the orchestrator's brief, not re-measured |

ZUSB cannot be the backup disk. It is smaller than the data (128 GB against 379 GiB) and it is full.

## Key decisions (recommendation first)

| # | Decision | Why |
|---|---|---|
| 1 | **Two layers, not one.** Use (a) an encrypted off-site backup of the irreplaceable folders to Google Drive, starting now, and (b) Time Machine to an external disk when one is bought. | (a) uses space he already pays for and needs no purchase. (b) is the only Apple-supported full-machine restore. Either one alone leaves a gap. |
| 2 | **Layer (a) tool: restic through rclone to Google Drive.** | Both are open source and free. restic's own docs say Google Drive is reached "via rclone". Backups are encrypted and versioned. It runs from a cron, so it costs nothing per run. |
| 3 | **Google Drive for desktop is not a backup.** | It syncs. Google's page describes streaming and mirroring ("mirroring downloads a full copy directly to your computer"). A deleted or corrupted file is deleted or corrupted in the mirror too. |
| 4 | **Do not point Time Machine at Google Drive.** | Apple's supported destinations are an external storage device, a Mac shared as a network destination, a NAS, and AirPort hardware. Cloud storage is not on the list. |

## The options

| Option | What it is | Cost | Uses his Drive space | Full-machine restore | Notes |
|---|---|---|---|---|---|
| **A. restic + rclone to Google Drive, plus Time Machine to an external disk later** | Scripted, encrypted, versioned backup of chosen folders now; Apple's backup once a disk exists | $0 now; a disk later (price not researched) | Yes | Yes, once the disk exists | Recommended. Needs a one-time Google sign-in for rclone and a passphrase he keeps |
| **B. Arq 7 to his own cloud storage** | A Mac app that does encrypted, versioned backups to "a cloud account you already have" | $59.99 per computer, one-time (Arq pricing page) | Probably | No (file-level) | Arq's site says it "integrates with many different cloud providers". That Google Drive is one of them was **not confirmed** from the pages fetched. Verify before buying |
| **C. Backblaze Personal** | Unlimited hosted backup, set and forget | $99 per year (Backblaze pricing page) | No | No (file-level) | Simplest. Pays for storage he does not need, given his Drive space |
| **D. Time Machine to the Pi as a network disk** | Pi shares a disk over the network; the Mac backs up to it | a disk for the Pi | No | Yes | Apple lists "Network-attached storage (NAS) device" as supported. Whether a Pi share qualifies, and how big the Pi's disk is, were **not verified** here |

The VPS is not a candidate. 379 GiB will not fit on a small VPS disk, and it already had a disk-full incident (memory: `project_vps_disk_hygiene`).

## What layer (a) would cover first

The folders whose loss cannot be undone by re-cloning:
- `~/zao-vault`
- `~/.zao` (including `~/.zao/private`, which holds keys, so the backup **must** be encrypted, which restic does by default)
- `~/zaal-dotfiles`
- `~/Documents`
- the ZAOstock media on the Desktop

Code repos that are fully pushed can be left out. This list is a proposal; sizes were not measured.

## Risks

- A backup nobody has restored from is a hypothesis (`vanishing-dependencies.md` rule 5). The first run ends with a test restore of one folder.
- The restic passphrase is a single point of loss. It goes in his password manager, entered by him (`/secret`), never in a repo.
- Google Drive has upload limits. The first full upload of hundreds of gigabytes may take days. Not measured.
- A scripted backup that fails silently is worse than none. It writes a beat file and reports a failure on the morning card (`silent-failure-guard.md`).

## Sources

| Source | Method | Status |
|---|---|---|
| Apple, "Back up your Mac with Time Machine" (support.apple.com/en-us/104984) | `curl`, HTML stripped, raw text read | FULL |
| Apple, "Backup disks you can use with Time Machine" (support.apple.com/en-us/102423) | same | FULL |
| Arq pricing (arqbackup.com/pricing) and home page | same | FULL for price and "own cloud account"; Google Drive support NOT confirmed (a features page returned 404) |
| restic docs, "Preparing a new repository" | same | FULL ("Google Cloud Storage is not the same service as Google Drive - to use the latter, please see Other Services via rclone") |
| rclone Google Drive docs (rclone.org/drive) | same | PARTIAL (page fetched; limits not extracted) |
| Backblaze computer backup pricing | same | FULL ("Personal backup $99 /year", "Unlimited data backup") |
| Google, Drive for desktop help (support.google.com/drive/answer/10838124) | same | FULL for streaming versus mirroring |
| This Mac | `df`, `tmutil destinationinfo`, `diskutil info` | FULL |

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Rule on A, B, C or D (sent to the Grill) | Zaal | Decision | next grill window |
| If A: one PR to zaal-dotfiles with the backup script, beat file and test-restore step | dotfiles lane | Build | after the ruling |
| If A: sign rclone in to Google Drive and set the restic passphrase | Zaal | Setup | with the PR |
| Buy an external disk larger than the 460 GiB internal disk for Time Machine (Apple's sizing guidance was not in the text fetched) | Zaal | Purchase | his call |
