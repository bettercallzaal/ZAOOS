---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-07-11
superseded-by:
related-docs: 1028
original-query: "https://github.com/runwayml/avtensor - research this repo (STANDARD tier). High-performance media decoding straight into PyTorch tensors, by Runway ML. Assess what it is, how it works, maturity, and relevance to ZAO's media/video pipelines (ZAOVideoEditor, audio/WaveWarZ, transcription)."
tier: STANDARD
---

# 1029 - avtensor: FFmpeg -> PyTorch Media Decoding (Runway ML)

> **Goal:** Assess runwayml/avtensor - a Rust+Python library that decodes video/audio/images straight into torch.Tensors - and whether it belongs in ZAO's media pipelines (ZAOVideoEditor, transcription, WaveWarZ media).

## Key Decisions (recommendations first)

| # | Decision | Recommendation | Why |
|---|----------|----------------|-----|
| 1 | Adopt now? | **NO - WATCH it, do not adopt yet** | Created 2026-07-10 (1 day old at time of research), 34 stars, 0 forks, zero community discussion. Source-only install that compiles against a pinned PyTorch (2.11) + FFmpeg >= 7.1. Too new + too heavy to put in a live ZAO pipeline. |
| 2 | Where it WOULD help ZAO | **Transcription audio preprocessing is the one real fit** | ZAO transcribes via FFmpeg + mlx-whisper (`~/.claude/skills/meeting/scripts/transcribe.sh`). avtensor decodes audio to a `float32 [C, T]` tensor with decode-time 16 kHz resample + EBU R128 loudness normalization in one pass - exactly whisper's preferred input. But the current shell+whisper path already works and is far simpler to run. |
| 3 | vs torchcodec | **If ZAO ever needs FFmpeg->tensor, start with torchcodec, not avtensor** | torchcodec is PyTorch's OFFICIAL decoder (Meta), currently 0.14, on PyPI as wheels, documented, and adds encoding. avtensor's edges (native `gs://`/`s3://` inputs, single-pass video+audio, HDR tone-map, 1.7-6x faster decode-time resize) only matter at training-data-loading scale ZAO does not operate at yet. |
| 4 | Revisit trigger | **Re-check when avtensor ships PyPI wheels + crosses ~500 stars OR ZAO builds a GPU ML training loop on media** | Until then the install cost (Rust toolchain, FFmpeg 7.1 shared build, matching libtorch) outweighs the benefit for a 188-member community's media needs. |

## Findings

### What it is
- **Rust core + Python bindings**, decodes video, audio, and images into `torch.Tensor`s using FFmpeg. Built specifically for **ML data-loading pipelines** - frames move from FFmpeg straight into tensors, no intermediate copy.
- **Inputs:** local files, `gs://` / `s3://` objects, or any HTTP(S) URL (native cloud input is its headline differentiator).
- **Output shapes:** video = `uint8` tensor `[T, C, H, W]` (RGB); audio = `float32` tensor `[C, T]`.
- **Decode-time transforms (inside FFmpeg, one pass):** resize, frame-rate resampling, audio resampling, EBU R128 loudness normalization.
- **Correctness:** YUV->RGB follows the stream's color metadata; HDR sources tone-mapped to sRGB; windowed decode of a start/end time range.
- **GPU path:** NVDEC hardware decode, optionally with GPU-resident output tensors (frames never copied to system memory when `device="cuda"`).

### Maturity (the deciding factor)
- **Created 2026-07-10, last push 2026-07-11** - literally new. **34 stars, 0 forks.** No HN/Reddit/blog discussion exists yet (web search returned only torchcodec, not avtensor).
- **License Apache-2.0.** Has CI, benchmarks/, a CLAUDE.md, and a typed `.pyi` - so it is a serious, well-structured release, just unproven.
- **Install is heavy:** `pip install avtensor` compiles from source at install time. Needs a Rust stable toolchain, FFmpeg >= 7.1 (shared build, with `zscale`/`tonemap`/libzimg for HDR), and a PyTorch matching the `tch` pin (0.24.x <-> torch 2.11). Deployment realistically means building a wheel with maturin.

### avtensor vs torchcodec (verified, torchcodec 0.14 current)
| | avtensor | torchcodec |
|---|---|---|
| Maturity | 1 day old, source install | Official PyTorch (Meta), 0.14, PyPI wheels |
| cloud inputs (`gs://`, `s3://`) | native | no |
| video + audio | one decode pass | separate decoders |
| HDR | tone-mapped to SDR | float32, no tone-map (beta) |
| encoding | no | audio + video |
| decode-time resize | 1.7-6x faster | baseline |
| whole-clip decode | within +/-1% | within +/-1% |
Benchmark basis: median wall time, 30 s 1080p H.264 clip, Xeon 8481C + H100, identical FFmpeg builds.

### Relevance to ZAO (honest)
- **ZAOVideoEditor / audiograms:** avtensor decodes video frames to tensors for ML, but ZAOVideoEditor's job is mp3->mp4 audiogram rendering + metadata, not tensor ML - no fit today.
- **Transcription (`transcribe.sh`, mlx-whisper):** the one genuine overlap - avtensor's audio decode + 16 kHz resample + loudness norm is ideal whisper preprocessing. But the current FFmpeg+whisper shell path already produces this and needs no Rust/libtorch build. Not worth swapping.
- **WaveWarZ media:** no ML-media-decode workload exists yet; nothing to accelerate.
- **Net:** avtensor is a training-data-loading tool for teams decoding thousands of clips into GPU tensors. ZAO is not that workload today. File it as WATCH.

## Also See
- [Doc 1028](../../dev-workflows/1028-rdxmin-claude-code-token-optimizer/) - the other Rust-tool assessment from this session (same "new Rust tool, pilot-before-adopt" posture).

## Next Actions
| Action | Owner | Type | By When |
|--------|-------|------|---------|
| No adoption - leave transcription on FFmpeg + mlx-whisper as-is (this doc is the "watch, don't adopt" record) | @Zaal | Decision | 2026-07-11 |
| Re-validate avtensor maturity (PyPI wheels? star growth? forks?) if a GPU media-ML training loop is ever planned | @Zaal | Research | 2026-10-01 |
| If ZAO ever needs FFmpeg->tensor before then, spike torchcodec (official, wheels) first - one afternoon | @Zaal | Spike | wontfix until a real media-ML need exists |

## Sources
- runwayml/avtensor README `[FULL]` - https://github.com/runwayml/avtensor - fetched via gh API 2026-07-11, full content read (features, install, quickstart, torchcodec comparison, benchmarks).
- runwayml/avtensor `avtensor.pyi` Python API `[FULL]` - the typed request/stream interface (VideoStreamRequest, AudioStreamRequest, dtype/device/dimension_order).
- runwayml/avtensor repo metadata `[FULL]` - gh API: created 2026-07-10, 34 stars, 0 forks, Rust, Apache-2.0, pushed 2026-07-11.
- meta-pytorch/torchcodec + PyTorch blog + 0.14 release `[FULL]` - https://github.com/meta-pytorch/torchcodec , https://pytorch.org/blog/torchcodec/ - confirmed torchcodec is the official decoder, 0.14 adds HDR + fast WavDecoder (the version avtensor benchmarks against).
- Web search "runwayml avtensor" for community reception `[FAILED - no results, brand new]` - WebSearch returned only torchcodec; avtensor has no HN/Reddit/blog coverage as of 2026-07-11. Documented as a maturity signal, not a fetch failure.
- ZAO grounding `[FULL]` - `~/.claude/skills/meeting/scripts/transcribe.sh` (FFmpeg + mlx-whisper) confirms the transcription pipeline avtensor would touch.
