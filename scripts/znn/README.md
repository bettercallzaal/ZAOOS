# ZNN - the $0 MVP (ffmpeg -> YouTube Live)

The zero-cost lane for ZNN (ZAO's 24/7 channel): loop a playlist of local videos
straight to a YouTube Live stream with ffmpeg on the existing VPS. **No Livepeer
spend** until the channel earns it (Livepeer is the upgrade path - see
[research doc 1128](../../research/infrastructure/1128-znn-24-7-livepeer-channel/)).

**Loop-safe:** this folder holds NO keys and starts NO stream on its own. The
build loop wrote the script + this runbook; **Zaal starts the stream** by hand
with the real key (below).

## Files

- `znn-stream.sh` - the looper. `--dry-run` previews the exact ffmpeg command (key redacted) and validates inputs without streaming.
- `playlist.example.txt` - the ffmpeg concat-playlist format; copy to `playlist.txt`.

## One-time setup (Zaal)

1. **Install ffmpeg** (not on the VPS yet):
   ```
   sudo apt-get update && sudo apt-get install -y ffmpeg
   ```
2. **Get a YouTube stream key:** YouTube Studio -> Go Live -> Stream -> copy the stream key. (The account must have Live enabled - takes ~24h to activate on a new channel.)
3. **Store the key privately** (never in the repo):
   ```
   mkdir -p ~/.zao/private
   printf 'YOUTUBE_STREAM_KEY=%s\n' '<paste-key>' > ~/.zao/private/znn.env
   chmod 600 ~/.zao/private/znn.env
   ```
4. **Build the playlist:** copy `playlist.example.txt` to `playlist.txt` and point each `file '...'` line at real content (put clips in e.g. `~/znn-content/`).

## Preview (safe, no stream)

```
scripts/znn/znn-stream.sh --dry-run
```
Prints the ffmpeg command that would run (with the key redacted), the playlist entry count, and whether the key is set.

## Start the stream (Zaal)

```
scripts/znn/znn-stream.sh
```
It loops the playlist 24/7 (`-stream_loop -1`), re-encodes to a YouTube-friendly 720p/30fps H.264 + AAC, and **auto-restarts** if ffmpeg dies. Ctrl-C to stop.

For a persistent 24/7 service, run it under systemd (example unit):

```ini
# ~/.config/systemd/user/znn-stream.service
[Unit]
Description=ZNN 24/7 YouTube looper
[Service]
ExecStart=%h/zao-os/scripts/znn/znn-stream.sh
Restart=always
RestartSec=10
[Install]
WantedBy=default.target
```
```
systemctl --user daemon-reload && systemctl --user enable --now znn-stream
```

## Tuning (env, all optional, in `znn.env`)

| var | default | notes |
|-----|---------|-------|
| `ZNN_RESOLUTION` | `1280x720` | 720p keeps CPU + bitrate low (doc 1128) |
| `ZNN_FPS` | `30` | |
| `ZNN_VIDEO_BITRATE` | `4000k` | YouTube 720p30 sweet spot |
| `ZNN_PLAYLIST` | `scripts/znn/playlist.txt` | |
| `ZNN_RTMP_BASE` | `rtmp://a.rtmp.youtube.com/live2` | |

## Later

- **Embed** the stream at `thezao.xyz/tv` (a YouTube live-embed iframe) once it is running.
- **Upgrade to Livepeer** (multistream to YouTube/Twitch/X, `lvpr.tv` player) per doc 1128 when the channel justifies the ~$267/mo - not before.
