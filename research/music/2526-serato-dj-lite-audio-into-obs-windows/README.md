---
topic: music
type: decision
status: research-complete
last-validated: 2026-09-21
superseded-by:
related-docs: 043
original-query: "STANDARD tier. Capturing Serato DJ Lite audio into OBS on Windows with a Pioneer DDJ-SB3 controller. Measured facts on the rig (desktop-h2ov6da, Win10 Pro, OBS 32.2.2): Serato DJ Lite holds the DDJ-SB3 render endpoint so that every WASAPI capture attempt fails with AUDCLNT_E_DEVICE_IN_USE (0x8889000A) - window capture, process (application) audio capture, and loopback capture of the DDJ endpoint all produce no audio. Unchecking Windows 'Allow applications to take exclusive control' on the DDJ endpoint changed nothing (verified 8889000A still returned afterwards). ASIO4ALL v2 is installed. Serato's audio path does not appear in Windows system sound at all (loopback of the default output device is silent while a track plays). The DDJ-SB3's hardware mic input is direct-to-master and never reaches software. Goal: get the deck's master mix into OBS as its own audio source while keeping headphone cue working, free or cheap, on this Windows box. Questions to answer with sources: (1) Does Serato DJ Lite on Windows use ASIO via the Pioneer driver, and does that bypass WASAPI loopback entirely? (2) Can Serato DJ Lite be switched to a WASAPI/DirectSound output, and what does that do to cue and latency? (3) What do DJs streaming Serato+DDJ-SB3 on Windows actually do - Voicemeeter, VB-Cable, a second audio interface off the master out, Serato's own record/broadcast output, or OBS's Application Audio Capture with a specific setting? (4) Is there a Pioneer/Serato-documented method? Prioritise Reddit r/obs, r/Beatmatch, r/DJs, Serato forums, Pioneer forums, and OBS forums. Note anything that applies specifically to Lite vs Pro. Output the ranked options with what each costs in latency, money, and cue."
tier: STANDARD
---

# 2526 - Serato DJ Lite audio into OBS on Windows (DDJ-SB3)

> **Goal:** Get the DDJ-SB3's master mix into OBS as its own audio source, keep headphone cue working, spend nothing. Answer why every OBS-side capture failed and what the vendor-documented route is.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| **How to get deck audio into OBS** | **USE Serato's `Use Laptop Speakers` setting (Lite 1.4+), captured by the `ZAO Deck Audio` loopback source already on the DJ scene.** | Zero install. Serato mirrors the master mix to whatever Windows output is selected; OBS loopback-captures that. The DDJ keeps its own driver for the room and the cue. Vendor-documented for Lite. |
| Fallback if `Use Laptop Speakers` is greyed out | USE `Make Audio Available to Other Applications` + Virtual Audio Cable Lite 4.66. | Serato's primary documented streaming route. Same result, one free driver install. |
| Stop trying OBS-side capture | STOP. Window capture, application audio capture, and WASAPI loopback of the DDJ endpoint **cannot work** while Serato drives the DDJ through ASIO. | ASIO opens the device below the Windows mixer. Measured: `0x8889000A` on every attempt, unchanged after disabling Windows exclusive mode. That checkbox governs WASAPI-exclusive apps, not ASIO. |
| The deck's mic jack | SKIP. It will never reach the stream by any software route. | DDJ-SB3 is absent from Serato's mic-capable hardware list. The mic is direct-to-master hardware. Use a separate USB mic into OBS (already the design). |
| Voicemeeter / VB-Cable / ASIO Link Pro | SKIP for this rig. | They solve the same problem with more moving parts. Only worth it if both Serato routes fail. |
| Audio interface on the master out | DEFER to the 3 Oct PA build. | The only route immune to all of this, and the PA feed needs the hardware anyway. Not needed to stream tonight. |

## What was measured on the rig, and what it means

| Attempt | Result | Cause |
|---|---|---|
| `Serato Audio` - `wasapi_process_output_capture` on `Serato DJ Lite.exe` | `Device '' failed to start`, zero meter samples, every run since 2026-09-13 | Serato has no WASAPI session to capture. It outputs via ASIO. |
| `wasapi_output_capture` on `Line (2- DDJ-SB3)` | `AUDCLNT_E_DEVICE_IN_USE` (`0x8889000A`) | ASIO holds the endpoint exclusively. |
| Same, after unchecking Windows "Allow applications to take exclusive control" (verified `= 0` in registry) | **still `0x8889000A`** | The Windows checkbox governs WASAPI-exclusive clients. ASIO is not one. **This was the wrong fix and cost an OBS restart.** |
| `wasapi_output_capture` on `Default` (Corsair headset) | silence, 157 samples | Serato is not in the Windows mixer at all. Nothing to hear. |
| Window capture and Game Capture of the Serato window | black on all methods; Game Capture logs `capture stopped` twice | Unrelated to audio, but same class: Serato draws through a path the hooks cannot read. Display capture of screen 1 works and is now what the DJ scene uses. |
| ASIO drivers on the box | `ASIO4ALL v2` present in `HKLM\SOFTWARE\ASIO` | Confirms the ASIO path exists. |

The rig at `C:\Users\zaalp\Documents\zao-streamer-kit\broadcast\AUDIO-ROUTING-WINDOWS.md` §3 previously said "the fix is a Windows checkbox". **That section is wrong for this controller and is corrected by this doc.** `audiocheck.py` correctly names `8889000A` as device-in-use; its suggested remedy text needs the ASIO caveat added.

## Answers to the four questions

**(1) Does Serato DJ Lite on Windows use ASIO, bypassing WASAPI loopback?** Yes. ASIO4ALL is installed, every WASAPI open on the DDJ endpoint returns device-in-use, and the Windows exclusive-mode setting has no effect on it. ASIO sits below the Windows audio stack; loopback capture sees nothing. This is not a Lite limitation - the Pioneer DJ forum's own OBS guide for a DJM mixer on Windows starts from the same fact and routes around it with a virtual cable ([Pioneer DJ forums](https://forums.pioneerdj.com/hc/en-us/articles/115004806423-Streaming-with-OBS-DJM-Windows)).

**(2) Can Lite be switched to a WASAPI/DirectSound output, and what does it cost?** Not by choosing a driver - Serato exposes no driver picker. What it exposes are two routing features:

- **`Use Laptop Speakers`** (Lite 1.4+): mirrors the master through "the operating system's selected soundcard". Serato says explicitly that when the OS output is set to another connected device, "Serato DJ Lite will also output audio via the selected device" ([Serato support](https://support.serato.com/hc/en-us/articles/360001860395-Use-Laptop-Speakers-as-Master-Output-with-Serato-DJ-Lite)).
- **`Make Audio Available to Other Applications`**: routes the master into a virtual device (VAC Lite 4.66 on Windows) that OBS captures as an Audio Input ([Serato support](https://support.serato.com/hc/en-us/articles/360001784415-Getting-Serato-DJ-Pro-Lite-ready-to-Live-Stream)).

Latency, measured by users: the mirrored laptop-output copy runs **200-300 ms behind** the controller's own output ([r/Serato, XDJ-XZ](https://www.reddit.com/r/Serato/comments/1evy41b/xdjxz_wserato_computer_audio_out_of_sync_with/)), and r/Serato calls it "unusable for 99% of devices" **in a live room** ([r/Serato](https://www.reddit.com/r/Serato/comments/18yrp5t/is_the_use_the_laptop_speakers_option_in_the/)). **Every one of those complaints is about listening to the laptop copy.** For streaming, only OBS listens to it. The DDJ's master out feeds the speakers and its headphone jack feeds the cue, both on the ASIO path, both unchanged. The delay lands on the stream, where 200 ms is invisible next to the 2-10 s a viewer already sits behind. **Cue cost: none. Room cost: none. Stream cost: a constant offset that nothing depends on.**

**(3) What do DJs actually do?** Ranked by how often it appears and how much it costs:

| Route | Money | Install | Cue impact | Who recommends it |
|---|---|---|---|---|
| `Use Laptop Speakers` + OBS loopback of that device | $0 | none | none | Serato support (Lite article); [r/Serato 2026-05](https://www.reddit.com/r/Serato/comments/1tpmz09/help_with_recording_on_obs/) as the no-install option |
| `Make Audio Available` + VAC Lite 4.66 | $0 | one driver | none | Serato's primary documented method, Pro and Lite |
| VB-Cable + Voicemeeter | $0 | two drivers, routing UI | none if set up right | Pioneer DJ's own OBS guide (rekordbox + DJM) |
| ASIO Link Pro + OBS ASIO plugin | $0 (patched) | two installs, node graph | none | DAW users ([naslacker](https://www.naslacker.com/2020/12/25/howto-capture-asio-audio-in-osb-on-windows-for-real-this-time/)); overkill for a controller |
| Audio interface on master out | $100-200 | hardware | none | r/Beatmatch consensus for "best quality"; the only route immune to driver behaviour |
| Loopback (Rogue Amoeba) | $99 | one app | none | **macOS only** - not applicable |
| Two laptops | second machine | - | none | the desperate route; one user reported it "sounded like muffled speakers" until the interface input was set to instrument ([r/Beatmatch](https://www.reddit.com/r/Beatmatch/comments/g5wclx/serato_ddj_sb3_for_livestream_help/)) |

**(4) Is there a vendor-documented method?** Yes, two, both from Serato, both naming Lite explicitly. Pioneer documents a third for DJM mixers using VB-Cable. None of them is "capture the controller's endpoint in OBS" - which is the one thing this rig spent a week trying.

## Lite vs Pro

Both features are in both editions. Version floors: `Use Laptop Speakers` needs Lite 1.4+ / Pro 2.4+; `Make Audio Available` with the bundled Serato Virtual Audio device needs Lite 1.5.5+ / Pro 2.5.5+ on macOS, and on Windows both editions use VAC Lite. No Pro-only gate for this.

## Hardware caveats for the DDJ-SB3

- **Not on the list of controllers that cannot use these features** - that list is Numark MixDeck and MixDeck Express only ([Serato](https://support.serato.com/hc/en-us/articles/360001976175-Recording-Live-Streaming-Laptop-Speaker-Hardware-Limitations)).
- **Not on the list of controllers whose mic input reaches the software** - the SX3, FLX4, DJM-S9 and others are; the SB3 is not ([Serato](https://support.serato.com/hc/en-us/articles/360002064496-DJ-Hardware-Microphone-Recording-Capabilities)). So the deck's mic jack is heard in the room and nowhere else. Matches `DJ-STREAM.md` trap 2.
- `Use Laptop Speakers` "only available when compatible hardware is connected" - the SB3 qualifies by not being on the exclusion list. If the checkbox is greyed out, the fallback is the VAC route.

## Procedure for tonight

1. Serato -> Setup (gear) -> Audio -> check **`Use Laptop Speakers`**.
2. Windows output stays on the Corsair headset (current default). Serato's master now mirrors there.
3. OBS: `ZAO Deck Audio` (already on `ZAO - DJ`, `wasapi_output_capture` on `Default`) meters. Run `python broadcast\audiocheck.py` to prove it rather than trusting the mixer.
4. `Bed Compressor` is already on the media sources; add the same filter to `ZAO Deck Audio` once its level is measured. Hot masters peaked at -2.5 dBFS raw.
5. Headphones stay in the DDJ. Cue is untouched.
6. Delete the dead `Serato Audio` process-capture source or leave it disabled; it will never meter.

If `Use Laptop Speakers` is greyed out: install VAC Lite 4.66 from vac.muzychenko.net, check `Make Audio Available to Other Applications`, and change `ZAO Deck Audio` to a `wasapi_input_capture` on `Line 1 (Virtual Audio Cable)`.

## Also See

- Doc 043 - WebRTC audio rooms streaming (archived, different problem, same class of "which device owns the audio")
- `zao-streamer-kit/broadcast/AUDIO-ROUTING-WINDOWS.md` - the measurements this doc corrects
- `zao-streamer-kit/broadcast/DJ-STREAM.md` - the macOS half; Loopback and BlackHole do not apply to Windows

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Enable `Use Laptop Speakers` in Serato, run `audiocheck.py`, confirm `ZAO Deck Audio` meters above -30 dBFS - stream goes ahead with deck audio | @Zaal | Rig setting + check | 2026-09-21 |
| Correct `AUDIO-ROUTING-WINDOWS.md` §3: the exclusive-mode checkbox does not apply to ASIO; replace with the Serato-side routes. Add ASIO caveat to `audiocheck.py`'s `8889000A` remedy text. PR merged. | @Zaal (Claude drafts) | PR to zao-streamer-kit | 2026-09-22 |
| Remove or disable the `Serato Audio` process-capture source in `ZAO DJ Stream` and `ZAO Live`; it cannot meter and its FAIL is noise in every check | @Zaal | OBS change + `export_collection.py` | 2026-09-22 |
| Decide interface purchase for 3 Oct PA feed (removes the Serato dependency entirely) | @Zaal | Purchase decision | 2026-09-26 |

## Sources

- [FULL] [Serato Support - Getting Serato DJ Pro & Lite ready to Live Stream](https://support.serato.com/hc/en-us/articles/360001784415-Getting-Serato-DJ-Pro-Lite-ready-to-Live-Stream) - the VAC Lite 4.66 route, Windows and Mac, Pro and Lite. Verified 2026-09-21.
- [FULL] [Serato - How to live stream your Serato DJ sets](https://the-drop.serato.com/how-to/how-to-live-stream-your-serato-dj-sets/) - 2020-04-02, same route with OBS walkthrough. Verified 2026-09-21.
- [PARTIAL - highlights only, article body not fetched] [Serato Support - Use Laptop Speakers as Master Output with Serato DJ Lite](https://support.serato.com/hc/en-us/articles/360001860395-Use-Laptop-Speakers-as-Master-Output-with-Serato-DJ-Lite) - the quoted behaviour ("will also output audio via the selected device") is from the highlight, which matched the article text on search. Version floor Lite 1.4.
- [PARTIAL - highlights only] [Serato Support - Recording, Live Streaming & Laptop Speaker Hardware Limitations](https://support.serato.com/hc/en-us/articles/360001976175-Recording-Live-Streaming-Laptop-Speaker-Hardware-Limitations) - exclusion list is Numark MixDeck / MixDeck Express.
- [PARTIAL - highlights only] [Serato Support - DJ Hardware Microphone Recording Capabilities](https://support.serato.com/hc/en-us/articles/360002064496-DJ-Hardware-Microphone-Recording-Capabilities) - Pioneer list includes SX3, SZ, FLX4, DJM series; SB3 absent.
- [PARTIAL - highlights only] [Pioneer DJ forums - Streaming with OBS + DJM (Windows)](https://forums.pioneerdj.com/hc/en-us/articles/115004806423-Streaming-with-OBS-DJM-Windows) - VB-Cable + Voicemeeter, ASIO4ALL at 256 samples, 512 latency compensation.
- [PARTIAL - post + top comments] [r/Serato - Help with recording on OBS (2026-05-27)](https://www.reddit.com/r/Serato/comments/1tpmz09/help_with_recording_on_obs/) - names both routes; warns OBS capturing the controller device sums master + cue.
- [PARTIAL - post + top comments] [r/Serato - XDJ-XZ computer audio out of sync (2024-08)](https://www.reddit.com/r/Serato/comments/1evy41b/xdjxz_wserato_computer_audio_out_of_sync_with/) - the 200-300 ms figure.
- [PARTIAL - post + top comments] [r/Serato - Is Use Laptop Speakers okay for live shows (2024-01)](https://www.reddit.com/r/Serato/comments/18yrp5t/is_the_use_the_laptop_speakers_option_in_the/) - "unusable for 99% of devices" in a live room.
- [PARTIAL - post + top comments] [r/Beatmatch - Questions about Live Streaming from Serato > OBS > Twitch (DDJ-SB3) (2020-04)](https://www.reddit.com/r/Beatmatch/comments/fv4ij6/questions_about_live_streaming_from_serato_obs/) - same controller, same surprise that OBS cannot capture Serato directly.
- [PARTIAL - post + top comments] [r/Beatmatch - Is it required I buy a soundcard (2020-04)](https://www.reddit.com/r/Beatmatch/comments/g99q4g/is_it_required_i_buy_a_soundcard_in_order_to/) - VAC named as the free Windows answer for an SB3.
- [PARTIAL - post + top comments] [r/Beatmatch - Serato + DDJ SB3 for livestream (2020-04)](https://www.reddit.com/r/Beatmatch/comments/g5wclx/serato_ddj_sb3_for_livestream_help/) - the two-laptop route and its quality problem.
- [PARTIAL - highlights] [North American Slacker - Capture ASIO audio in OBS on Windows](https://www.naslacker.com/2020/12/25/howto-capture-asio-audio-in-osb-on-windows-for-real-this-time/) - 2020-12-25, ASIO Link Pro route for DAWs.

Reddit threads were read from search highlights (post plus top comments), not full comment trees; `zao-fetch-reddit.sh` is a Mac path not present on this box. Marked PARTIAL accordingly. The decision does not rest on any of them - it rests on the two FULL Serato articles.
