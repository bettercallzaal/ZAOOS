---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-08-05
superseded-by:
related-docs: 2135, 606
original-query: "/zao-research the best way to add media to a drive and index it"
tier: DEEP
---

# 2207 - Media to drive, indexed four ways (archive + catalog + transcript search + graph)

> **Goal:** Get 48.6 GB of scattered A/V off the Mac onto the SANDISK, and make it findable by name, by spoken content, and from ZOE - without turning one copy into zero copies.

## Key Decisions (recommendations first)

| # | Decision | Why | Owner |
|---|----------|-----|-------|
| 1 | **COPY, do not MOVE. One drive is not an archive.** Keep media on the Mac until a second copy exists. The Mac is currently the ONLY copy of ~30 GB (doc 2135, task 928). Moving it to one SANDISK does not reduce risk - it relocates a single point of failure onto the more fragile device. | A single external drive in any format is not an archive - archival requires multiple verified copies on separate media ([mdrepairs](https://mdrepairs.com/blog/exfat-vs-ntfs-vs-apfs/)). Doc 2135 Decision 1 already flagged this content as actively bleeding. | @Zaal |
| 2 | **Format the SANDISK as APFS**, not exFAT. Mac-only archive, and APFS is materially faster on writes - which matters when the payload is 48.6 GB of video. | APFS is the recommended choice for Mac-only SSDs and is significantly faster than exFAT, especially for writing ([Setapp](https://setapp.com/how-to/apfs-mac-os-extended-exfat-whats-the-difference)). exFAT only wins if a Windows machine must read the drive - not the case here. | @Zaal |
| 3 | **Index with `gocatcli` v1.3.1**, NOT catcli. Catalog is JSON/TOML, lives on the Mac, commits to git - so the drive stays searchable while unplugged. | catcli is ARCHIVED (last push 2024-02-17) and explicitly superseded. gocatcli v1.3.1 shipped 2026-07-24 - 12 days old, actively maintained. JSON catalog is git-versionable, which matches how every other ZAO surface is tracked. | @Zaal |
| 4 | **Content search = reuse `zao-ingest.sh`, build nothing new.** Every A/V file gets a `.txt` transcript sidecar written NEXT TO the media on the drive AND mirrored to the Mac. Transcripts are ~50 KB each; 423 files is ~20 MB - it all stays local and greppable with `rg` when the drive is in a bag. | The transcription pipeline already exists and already writes `.meta.json` sidecars (`~/bin/zao-ingest.sh`, mlx-whisper at `~/.local/bin/mlx_whisper`). Building a second one would duplicate a working brain. | @Zaal |
| 5 | **Do NOT rely on Spotlight for the drive.** You are on macOS 26.5.2 (Tahoe), where Spotlight external-drive indexing is actively buggy - `mds_stores` has been reported consuming up to 60 GB RAM. Your machine already runs at 8.1/9.2 GB swap. | The gocatcli catalog replaces Spotlight for this job and costs zero background CPU. Leaving Spotlight to index a 48 GB external on a swap-saturated Tahoe machine invites the exact memory leak documented on [macos-tahoe.com](https://macos-tahoe.com/blog/spotlight-rebuild-guide-fix-search-not-working-2025/). | @Zaal |
| 6 | **Checksum at copy time, not later.** `shasum` manifest written during the copy is the only way to later prove bit rot happened. Retrofitting checksums onto already-corrupted files certifies the corruption. | Bits flip spontaneously without the OS raising an error. A manifest made at copy time is the reference; one made a year later is worthless. | @Zaal |

## The payload - what actually moves

Measured 2026-08-05 on this Mac:

| Source | Total size | Video files | Audio files |
|--------|-----------|-------------|-------------|
| `~/Downloads` | 33,687 MB | 33 | 16 |
| `~/Desktop/downloads` | 21,986 MB | 90 | 213 |
| `~/Movies` | 13,781 MB | 42 | 5 |
| `~/Pictures` | 4,877 MB | 24 | 0 |
| **Media files only (all four)** | **49,797 MB (48.6 GB)** | **189** | **234** |

Single largest item: a 15 GB `twitter-2026-07-22-*.zip` archive export in `~/Downloads` - 31% of the media payload in one file.

Note the gap between "folder total" (74.3 GB) and "media files" (48.6 GB): ~26 GB in those folders is non-media (zips, installers, docs). Only the 48.6 GB is in scope for the media archive.

## The four index layers

The request was "index it" with all four goals. They are four different mechanisms, not one tool.

| Layer | Goal | Tool | Where it lives | Works unplugged? |
|-------|------|------|----------------|------------------|
| 1. Name / date / type | Find fast | `gocatcli` | `~/zao-archive/catalog.json` (Mac, in git) | YES |
| 2. Spoken content | Search what was said | `zao-ingest.sh` -> `.txt` sidecars + `rg` | Drive + `~/zao-archive/transcripts/` | YES (mirror) |
| 3. Knowledge graph | ZOE can reference it | Bonfire episodes | zabal.bonfires.ai | YES |
| 4. Browse visually | Library feel | `gocatcli nav` / `tree` | Terminal TUI | YES |

The unifying trick: **every layer's index is small and lives on the Mac.** The drive holds bytes; the Mac holds knowledge about the bytes. That is what makes the whole thing work when the drive is in a drawer.

## Findings

### Filesystem: APFS wins, with one caveat

APFS is correct here because this is a Mac-only archive and write speed dominates a 48.6 GB transfer. The caveat: APFS is **not** readable by Windows without third-party software. If a collaborator ever needs to read the drive directly, that is a re-format, not a setting. Given the ZAO stack is Mac-and-cloud, accept the tradeoff.

Do not use HFS+ (legacy) and do not use FAT32 (4 GB per-file limit - your 15 GB zip and 2.2 GB mp4s would be rejected outright).

### Catalog tool: gocatcli, and the trap I nearly fell into

Search results surface **catcli** prominently - it appears in PyPI listings and DataHoarder threads. It is dead. The repository was archived and its own README states it "has been superseded by gocatcli which provides all features of catcli and more."

| | catcli | gocatcli |
|---|---|---|
| Status | ARCHIVED | Active |
| Last activity | 2024-02-17 | v1.3.1 on 2026-07-24 |
| Language / install | Python, `pip3 install catcli` | Go binary |
| Catalog format | JSON | JSON + TOML |
| License | GPLv3 | GPLv3 |

**Install note specific to this Mac:** Go is NOT installed and there is no Homebrew formula (`brew info gocatcli` returns "No available formula"). So installation is a binary download from [the releases page](https://github.com/deadc0de6/gocatcli/releases), not `go install`. Do not follow the README's Go path without installing Go first.

gocatcli commands that matter:

```bash
gocatcli index /Volumes/SANDISK sandisk    # build catalog
gocatcli find "wavewarz"                   # search unplugged
gocatcli ls sandisk/streams                # navigate
gocatcli nav                               # TUI browser (layer 4)
gocatcli tree                              # whole-hierarchy view
```

### GUI alternatives, and why to skip them

[NeoFinder](https://www.cdfinder.de/) and DiskCatalogMaker (v9.2.7) both do this well and add thumbnail previews - genuinely nicer for visual browsing of video. Both are paid, GUI-only, and store catalogs in proprietary formats that do not commit to git.

Skip them **for now** because the git-versionable JSON catalog is what lets ZOE and future automation read the archive. If visual browsing turns out to be the daily need rather than search, revisit NeoFinder - it is the stronger tool for layer 4 specifically, and it explicitly supports APFS and offline drives.

### Content search: the pipeline already exists

`~/bin/zao-ingest.sh` (12,025 bytes) is a universal source-to-transcript engine that already handles local files, YouTube, Spotify, RSS, and direct audio URLs. It calls `~/.claude/skills/meeting/scripts/transcribe.sh`, which uses **mlx-whisper** natively on Apple Silicon - offline, no GPU server. Confirmed present at `~/.local/bin/mlx_whisper`.

This means layer 2 is a loop, not a project:

```bash
find /Volumes/SANDISK -type f \( -iname '*.mp4' -o -iname '*.mov' -o -iname '*.wav' -o -iname '*.m4a' \) \
  | while read -r f; do
      [ -f "${f%.*}.txt" ] && continue        # idempotent, skip done
      ~/bin/zao-ingest.sh "$f"
    done
```

Then search everything ever said, drive unplugged:

```bash
rg -i "wavewarz" ~/zao-archive/transcripts/
```

**Runtime warning, stated honestly:** 423 media files through mlx-whisper is not a coffee break. mlx-whisper runs roughly 10-30x realtime on M-series depending on model. If the 423 files average 20 minutes each (~140 hours of audio), expect **5-14 hours of wall-clock**. Run it overnight in batches, not in one blocking session. The `[ -f ... ] && continue` guard makes it resumable.

### Integrity: the part most people skip

Bits flip on disk without the OS reporting an error. The defense is a checksum manifest created **at copy time**:

```bash
# copy with verification
rsync -avh --progress ~/Movies/ /Volumes/SANDISK/media/movies/

# manifest, made once, at copy time
cd /Volumes/SANDISK && find media -type f -exec shasum -a 256 {} \; > MANIFEST.sha256

# verify later (quarterly)
cd /Volumes/SANDISK && shasum -a 256 -c MANIFEST.sha256 | grep -v ': OK$'
```

gocatcli can also store checksums in the catalog itself, giving a second independent record. Tools purpose-built for this exist ([sumcheck](https://github.com/rselph/sumcheck), [rotten_bites](https://pypi.org/project/rotten_bites/)) but `shasum -c` is already on the machine and needs no install.

### The three-tier model (from r/DataHoarder practice)

The community pattern is hot / warm / cold: SSD for active projects, spinning disk or NAS for recent archives, tape or offline media for cold. Every cold volume gets a unique label recorded in a digital catalog tracking ID, contents, date written, and location.

Mapped to this situation:

- **Hot:** Mac internal - only what is actively being edited
- **Warm:** SANDISK, APFS, gocatcli-indexed - the 48.6 GB
- **Cold:** the second copy that does not exist yet (see Decision 1) - cloud, a second drive, or Arweave for ZAO-canon material per doc 2135

## Risks and honest limitations

| Risk | Reality |
|------|---------|
| **Single copy** | The biggest one. Until a second copy exists, this plan improves findability and frees Mac space - it does NOT improve safety. Do not let "it's on the drive now" feel like a backup. |
| **Transcription runtime** | 5-14 hours estimated, not verified on this corpus. The estimate assumes 20-min average length; actual distribution unmeasured. |
| **gocatcli maturity** | v1.3.1 with a small maintainer base (one developer, same author as the archived catcli). The catalog is plain JSON, so lock-in is low - but do not assume long-term maintenance. The JSON format is the insurance policy. |
| **Spotlight on Tahoe** | Buggy per multiple reports. Recommendation is to avoid depending on it, not to disable it - disabling system-wide affects the Mac's own search. |
| **APFS and Windows** | Drive becomes Mac-only. Reformatting later means moving 48.6 GB off and back. |

## Also See

- [Doc 2135](../../cross-platform/2135-zaal-media-channels-inventory/) - the inventory this implements. Its Decision 2 ("one archive, not scattered") is what this doc executes.
- Tracker task `inbox:erase-zusb` - ZUSB already backed up to SANDISK, confirms drive exists and is in use
- `~/bin/zao-ingest.sh` - the transcript engine (layer 2)
- `~/.claude/skills/meeting/scripts/transcribe.sh` - mlx-whisper wrapper
- `/bonfire` skill - knowledge graph posting (layer 3)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Attach SANDISK, confirm free space >= 60 GB, format APFS if not already (Disk Utility). Shipped: `diskutil info /Volumes/SANDISK` reports APFS | @Zaal | Manual | 2026-08-07 |
| `rsync -avh` the 48.6 GB from Downloads/Movies/Desktop-downloads/Pictures to `/Volumes/SANDISK/media/`. Shipped: rsync exits 0, `du -sh` on drive matches source | @Zaal | Manual | 2026-08-08 |
| Write `MANIFEST.sha256` at copy time. Shipped: file exists on drive with 423+ lines | @Zaal | Manual | 2026-08-08 |
| Install gocatcli v1.3.1 binary from GitHub releases (NOT `go install` - Go absent). Shipped: `gocatcli --version` prints 1.3.1 | @Zaal | Manual | 2026-08-08 |
| `gocatcli index /Volumes/SANDISK sandisk`, commit `catalog.json` to a git repo. Shipped: `gocatcli find` returns hits with drive unplugged | @Zaal | PR | 2026-08-09 |
| Run the transcript loop overnight in batches. Shipped: `.txt` sidecar count >= 400 in `~/zao-archive/transcripts/` | @Zaal | Manual | 2026-08-15 |
| DECIDE the second copy: cloud, second drive, or Arweave. Until then media is single-copy. Shipped: written decision in doc 2135 or a follow-up doc | @Zaal | Decision | 2026-08-12 |
| Only after second copy exists: delete originals from Mac to reclaim 48.6 GB. Shipped: `df -h` shows free space up ~48 GB | @Zaal | Manual | 2026-08-16 |
| Quarterly `shasum -c` integrity check. Shipped: calendar recurring event created | @Zaal | Calendar | 2026-08-12 |

## Sources

- [gocatcli - GitHub](https://github.com/deadc0de6/gocatcli) - `[FULL]` - install methods, CLI commands, catalog format, GPLv3. Version v1.3.1 / 2026-07-24 confirmed via `gh api repos/deadc0de6/gocatcli/releases/latest`
- [catcli - GitHub](https://github.com/deadc0de6/catcli) - `[FULL]` - archived status confirmed via `gh api repos/deadc0de6/catcli` (`archived: true`, `pushed: 2024-02-17`)
- [APFS vs HFS+ vs exFAT - Setapp](https://setapp.com/how-to/apfs-mac-os-extended-exfat-whats-the-difference) - `[FULL]` - APFS recommended for Mac-only SSDs, faster writes
- [exFAT vs NTFS vs APFS - mdrepairs](https://mdrepairs.com/blog/exfat-vs-ntfs-vs-apfs/) - `[FULL]` - "a single external drive in any format is not an archive"
- [NeoFinder / CDFinder](https://www.cdfinder.de/) - `[FULL]` - offline drive cataloging, APFS/exFAT/NTFS support, thumbnails
- [Spotlight rebuild guide, macOS Tahoe](https://macos-tahoe.com/blog/spotlight-rebuild-guide-fix-search-not-working-2025/) - `[PARTIAL - headline claims read, full troubleshooting body not fetched]` - `mds_stores` memory leak up to 60 GB on Tahoe
- [How to search offline storage with indexing apps - AppleInsider](https://appleinsider.com/inside/macos-monterey/tips/how-to-search-offline-storage-with-indexing-apps-for-macos-monterey) - `[PARTIAL - summary via search, article body not fetched]` - offline indexing app landscape
- [catcli - PyPI](https://pypi.org/project/catcli/0.6.0) - `[PARTIAL - listing metadata only]` - confirms PyPI still serves the dead package, which is why the trap exists
- [sumcheck](https://github.com/rselph/sumcheck), [rotten_bites](https://pypi.org/project/rotten_bites/) - `[PARTIAL - tool descriptions via search]` - bit-rot detection tooling
- **Community source (r/DataHoarder practice via [Digital Biz Talk 2026 archiving guide](https://digitalbiztalk.com/article/tape-life-home-the-2026-guide-to-affordable-data-archiving))** - `[FULL]` - hot/warm/cold three-tier model, per-volume labelled catalog with ID/contents/date/location
- **Local ground truth** - `[FULL]` - `~/bin/zao-ingest.sh`, `~/.claude/skills/meeting/scripts/transcribe.sh`, `~/.local/bin/mlx_whisper`, `sw_vers` (macOS 26.5.2), media inventory measured 2026-08-05
