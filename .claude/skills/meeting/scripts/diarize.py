#!/usr/bin/env python3
"""diarize.py - speaker diarization for meeting recordings, via sherpa-onnx.

Two modes:
  diarize - run offline speaker diarization on a 16kHz mono wav, write a
            TSV of [start, end, speaker] segments.
  merge   - merge a diarization TSV with an mlx-whisper JSON transcript into
            a speaker-labeled transcript (consecutive same-speaker turns
            collapsed into one block).

Invoked by diarize.sh, not meant to be run directly. The diarize mode runs
inside an ephemeral `uv run --with sherpa-onnx` env so sherpa_onnx imports;
the merge mode is pure stdlib and runs under plain python3.
"""
import argparse
import json
import os
import sys


def log(msg):
    print(f"[diarize.py] {msg}", file=sys.stderr)


def read_wav(path):
    """Read a 16-bit PCM mono wav into a float32 numpy array in [-1, 1).

    sherpa-onnx 1.13.2 does not expose a top-level read_wave helper, so we read
    the wav ourselves. diarize.sh always feeds us 16kHz mono pcm_s16le.
    """
    import wave

    import numpy as np

    with wave.open(path, "rb") as w:
        if w.getsampwidth() != 2:
            raise ValueError(f"expected 16-bit PCM wav, got {w.getsampwidth() * 8}-bit")
        if w.getnchannels() != 1:
            raise ValueError(f"expected mono wav, got {w.getnchannels()} channels")
        sample_rate = w.getframerate()
        raw = w.readframes(w.getnframes())
    samples = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return samples, sample_rate


def run_diarize(wav_path, seg_model, emb_model, out_tsv, num_speakers, threshold):
    import sherpa_onnx

    for path, label in ((seg_model, "segmentation"), (emb_model, "embedding")):
        if not os.path.isfile(path):
            log(f"ERROR: {label} model not found: {path}")
            sys.exit(6)

    config = sherpa_onnx.OfflineSpeakerDiarizationConfig(
        segmentation=sherpa_onnx.OfflineSpeakerSegmentationModelConfig(
            pyannote=sherpa_onnx.OfflineSpeakerSegmentationPyannoteModelConfig(
                model=seg_model
            ),
        ),
        embedding=sherpa_onnx.SpeakerEmbeddingExtractorConfig(model=emb_model),
        clustering=sherpa_onnx.FastClusteringConfig(
            # num_clusters > 0 forces an exact speaker count; -1 = auto-detect
            # by similarity threshold (the usual case - we rarely know upfront).
            num_clusters=num_speakers if num_speakers > 0 else -1,
            threshold=threshold,
        ),
        min_duration_on=0.3,
        min_duration_off=0.5,
    )

    try:
        sd = sherpa_onnx.OfflineSpeakerDiarization(config)
    except Exception as exc:  # noqa: BLE001 - surface any model/config failure
        log(f"ERROR: could not init diarizer: {exc}")
        sys.exit(6)

    samples, sample_rate = read_wav(wav_path)
    if sample_rate != sd.sample_rate:
        log(f"ERROR: wav is {sample_rate}Hz, model needs {sd.sample_rate}Hz")
        sys.exit(7)

    result = sd.process(samples).sort_by_start_time()
    with open(out_tsv, "w") as f:
        for seg in result:
            f.write(f"{seg.start:.3f}\t{seg.end:.3f}\t{seg.speaker}\n")

    speakers = sorted({seg.speaker for seg in result})
    log(f"diarization done - {len(result)} segments, {len(speakers)} speaker(s)")
    print(len(speakers))  # stdout: speaker count, for the calling shell


def load_segments(tsv_path):
    segs = []
    with open(tsv_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            start, end, spk = line.split("\t")
            segs.append((float(start), float(end), int(spk)))
    return segs


def speaker_for(seg_start, seg_end, diar):
    """Pick the diarization speaker with the most timestamp overlap."""
    best_spk, best_overlap = None, 0.0
    for d_start, d_end, spk in diar:
        overlap = min(seg_end, d_end) - max(seg_start, d_start)
        if overlap > best_overlap:
            best_overlap, best_spk = overlap, spk
    return best_spk


def label(spk):
    # speaker ids are 0-indexed ints; humans read 1-indexed.
    return f"Speaker {spk + 1}" if spk is not None else "Speaker ?"


def run_merge(whisper_json, segments_tsv, out_txt):
    diar = load_segments(segments_tsv)
    if not diar:
        log("WARNING: empty diarization - transcript will be unlabeled")

    with open(whisper_json) as f:
        data = json.load(f)
    segments = data.get("segments", [])
    if not segments:
        log("ERROR: whisper JSON has no segments - cannot label")
        sys.exit(8)

    # Collapse consecutive same-speaker whisper segments into one turn block.
    lines, cur_spk, buf = [], None, []
    for s in segments:
        text = (s.get("text") or "").strip()
        if not text:
            continue
        spk = speaker_for(float(s["start"]), float(s["end"]), diar)
        if buf and spk != cur_spk:
            lines.append(f"[{label(cur_spk)}] " + " ".join(buf))
            buf = []
        cur_spk = spk
        buf.append(text)
    if buf:
        lines.append(f"[{label(cur_spk)}] " + " ".join(buf))

    with open(out_txt, "w") as f:
        f.write("\n\n".join(lines) + "\n")
    log(f"merge done - {len(lines)} speaker turns -> {out_txt}")


def main():
    ap = argparse.ArgumentParser(description="meeting speaker diarization")
    sub = ap.add_subparsers(dest="mode", required=True)

    d = sub.add_parser("diarize", help="diarize a 16kHz mono wav")
    d.add_argument("--wav", required=True)
    d.add_argument("--seg", required=True, help="segmentation model .onnx")
    d.add_argument("--emb", required=True, help="speaker-embedding model .onnx")
    d.add_argument("--out", required=True, help="output segments .tsv")
    d.add_argument("--num-speakers", type=int, default=0,
                   help="exact speaker count; 0 = auto-detect")
    d.add_argument("--threshold", type=float, default=0.5,
                   help="clustering similarity threshold (auto-detect mode)")

    m = sub.add_parser("merge", help="merge diarization TSV with whisper JSON")
    m.add_argument("--whisper-json", required=True)
    m.add_argument("--segments", required=True, help="diarization .tsv")
    m.add_argument("--out", required=True, help="output labeled transcript .txt")

    args = ap.parse_args()
    if args.mode == "diarize":
        run_diarize(args.wav, args.seg, args.emb, args.out,
                    args.num_speakers, args.threshold)
    else:
        run_merge(args.whisper_json, args.segments, args.out)


if __name__ == "__main__":
    main()
