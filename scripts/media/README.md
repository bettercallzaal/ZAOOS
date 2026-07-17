# ZAO media tools

Small, loop-safe local media utilities (pure ffmpeg - no keys, no upload; they
write files, and publishing is a separate gated step).

## `mp3-to-mp4.sh`

Turn an audio file into a YouTube-ready mp4:

```
mp3-to-mp4.sh <input.mp3> [output.mp4] [--image cover.jpg] [--title "..."] [--dry-run]
```

- **`--image FILE`** - hold a still cover image for the whole track (podcast/fireside).
- **no image** - render a live **waveform** over ZAO-navy with a gold wave (the "random audio video" default). Optional `--title` overlays gold text.
- **`--dry-run`** - print the exact ffmpeg command without running (verify safely; ffmpeg is not yet installed on the VPS - `sudo apt-get install -y ffmpeg`).

Where it fits: firesides, Spaces, and the customer-service loops become mp4s for
YouTube and for the **ZNN 24/7 looper** (`scripts/znn`) - this tool produces the
video content the looper's playlist plays. Feeds the content pipeline described in
research doc 1128.
