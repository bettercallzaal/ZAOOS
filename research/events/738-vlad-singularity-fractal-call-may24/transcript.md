# Transcript - Vlad (singularity.diy) x Zaal Restream call - 2026-05-24

Source media: `/Users/zaalpanthaki/Downloads/5_24_26-May-24-2026-restream.m4a` (91MB, 46.8 min raw).

## Critical caveat: catastrophic Whisper loop

mlx-whisper-large-v3-turbo locked into a "So yeah." / "I'm not sure." / "Thank you." loop for approximately 33 of the 46 minutes. Root cause: long silences (>2sec stretches below -40dB) in the Restream recording cause the turbo model to loop.

**Workaround applied:** `ffmpeg silenceremove` pre-process dropped 46min -> 13min (33min was silence). Re-transcribed the cleaned WAV. Recovered ~6.5 min of unique real content vs ~2 min from the first run. Roughly 49% of segments in the cleaned re-transcription are still loop-junk and have been stripped from the curated transcript below.

**Lost forever:** the live screen-share demo of Singularity (~minute 5-9 by Vlad's reference: "Was I sharing it right now? Did you see it?"). The pitch description survived; the visual demo did not.

**Speaker attribution:** content-based only (no successful diarization run on this file). Two-speaker call:
- **Speaker A = Vlad** (founder, singularity.diy; built Respect Game / DAO OF THE APES on Base; Eden Fractal lineage)
- **Speaker B = Zaal**

Vlad identity confirmed post-call from Telegram thread:
- Handle: `Vlad | singularity.diy`
- Calendly: https://calendly.com/vlad-singularity/30min
- GitHub: https://github.com/n0umen0n
- Respect Game repo: https://github.com/n0umen0n/base-respect-game
- Respect Game live: https://www.respectgame.app/
- Singularity platform: https://www.singularity.diy/

Raw transcripts:
- First attempt (heavily looped): `/tmp/meeting-20260524-121229.txt` (1484 lines, 17KB)
- Re-transcription post-silence-removal: `/tmp/meeting-20260524-124120.txt` (453 lines, 9.6KB)
- Cleaned WAV: `/tmp/restream-may24-silence-removed.wav` (25MB, 13 min)
- Telegram thread context: `~/.zao/private/vlad-singularity-telegram-2026-05-24.json` (chmod 600, off-repo per PR #666)

---

## Curated transcript (loop-junk removed, attributed)

[Vlad] It is just, I found that it is not so easy to implement [fractal] immediately in a community.

[Vlad] I find that more simple. I still think the fractal system is the best government system there is, like a decentralized one.

[Vlad] So yeah, and right now I'm focused on Singularity. And this is a project that enables other organizations to raise funds. And this is just sort of a beginning.

[Vlad] I also understood that it is difficult to just offer communities a governance system. If you give them this funding source and then on top of that you give them the governance system, this is something powerful, I think. So that's why I'm now focusing more on fundraising part in order for that to be a hook into this governance thing.

[Vlad] So yeah, that's briefly about me. But curious to hear where you are at. You said 100th event. What's your fractal about?

[Zaal] So yeah, so we do the fractal governance system. We kind of adapted it just slightly. We have a soul bound and liquid, non non liquid illiquid and soul bound token as the governance token. So yeah, so basically do the same like the Eden fractals kind of break within the groups and then we do the level six vote.

[GAP - audio loop; per Vlad's later mention, Zaal described Zoll's custom Discord bot used for ZAO Fractal in-Discord voting]

[Vlad - approximate 178s] So, is this just the ball [unclear - likely a specific term, marked confidence:low] or it actually executes the transaction?

[Vlad / Zaal exchange] [Zaal] No, it's just... [Vlad] You want to go into asynchronous fractals? Is that so?

[Vlad] Well, one way how to, in my view, how to attract people and make them do various things, for example, to rank the contributions or to just submit contribution, it's good to incentivize.

[Vlad] So, I've been part of fractals where there was a, like, a normal budget, even, I would say. It was on EOS. I don't even remember the name. But anyway, we had a budget and we were able to distribute it to build, like, apps. And people just came constantly in because they knew that every meeting we distribute actual liquid valuable token.

[Vlad] Have you thought about that, to incentivize with liquid token? And people just came constantly in because they knew that they were able to do that.

[GAP - audio loop ~30 seconds]

[Vlad - approximate 298s] I would say there's two things that I have worked on that might be useful for you.

[Vlad] One is, have you seen the Respect game, Respect game app? Let me share it now. I see you here.

[GAP - long loop; this is the screen-share demo of Singularity, lost to transcription failure]

[Vlad - approximate 525s, post-loop, pitching Singularity mechanics] And it's easy to create. You just input mission description, socials. And so there are two parts. First, there is this bonding curve. And once 15,000 [USDC/SOL, denomination unclear] gets into that bonding curve, there is graduation and it automatically goes into the AMM. So market is created. And yeah, that's essentially it.

[Vlad] And once it's graduated, once it's in the market, then the treasury gets unlocked. Then the counselors are able to vote.

[Vlad] And so, and I think it's not intrusive in a sense, if you even have your own token or you don't have a token, it doesn't oblige you to anything. You don't give up any equity. So if there are investors, if they believe in your mission, you might get a chance to receive some funding. So it's sort of zero risk to whoever creates this mission.

[Vlad] So yeah, that's the idea. What do you think? How does it sound?

[Vlad] It's live. So it's in [unclear - URL fragment]. Was I sharing it right now? Did you see it? Oh, ah, shit. I was. Let me wait. Why is it there? I'll snap.

[Zaal] No, I like it. I like it. I agree.

[Vlad] So it's, I'm at the beginning. Currently there's just a community that I created and I was able to onboard one another. So I just, last week I started with onboarding the projects and yeah. Idea is to first onboard around 20 projects and then I would start the push to the investors. Sort of to show them that yeah.

[Zaal] No, no.

[Vlad] There is something.

[Zaal] No, I'm good. I'm good.

[Vlad] And you just, yeah, there's this button create mission. And that's it.

[Vlad] But if you plan to create, I would need to fund your Solana account a little bit because I haven't implemented the gas subsidies yet. So I just cover your costs to deploy the token and so on. So if you plan to create a mission, just let me know. I will fund your account a bit.

[Vlad] But yeah, the idea, as I said, is initially, I think this council is a good thing, but I don't like still the token weighted voting and I don't like the idea that somebody with just money can control the community, can control the project. That's why I like the fractal process. And that's why, why in the future I would offer those communities a way to switch, a way to switch from this council to this contribution based system. Because yeah, I think it's much, much better.

[Zaal] Yeah, sounds good. Let's keep in touch then. I will send you the GitHub.

[end]
