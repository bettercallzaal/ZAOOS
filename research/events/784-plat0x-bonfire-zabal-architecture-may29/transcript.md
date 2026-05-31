# Transcript - Plat0x (Carlos, Bonfires) x Zaal, 2026-05-29 12:06 EDT

Attendees: Zaal, Plat0x (Carlos, Bonfires team). Source: `Plat0x x Zaal - 2026_05_29 12_06 EDT - Recording.mp4`. Single-feed recording (Zaal's camera); Plat0x audio-only. Diarization skipped (2-person); speakers attributed from content - Plat0x is the technical voice (Bonfire architecture), Zaal is the one who'll build it into the ZABAL Games repo. The heavy looping intro/outro ("Thank you" x20, "Bye" x16) was auto-trimmed by trim-loops.sh (56 lines collapsed).

---

[Plat0x] I think this is hype. There are several things we could do. The GitHub idea is really nice. Imagine this: I'm the user, I want to join, and you don't need to - your GitHub can be your submission. So you say, just register your GitHub. I saw there was a spot for that on the agent in the config, and that's what I also wanted to have a longer conversation about.

[Zaal] A lot of what I really want to do with one of my other projects in combo with this is, we use the Fractal Respect - the asynchronous games, people sharing weekly, and then actually voting on other people's contributions to pick the top. It would be great to do that with agents and say, here's the criteria we're looking for, you're looking at everyone's data, can you just rank everyone this month? So they're not coming in and voting.

[Plat0x] Yeah, we already have the judging pipeline you can use. What I really like about that pipeline is it's very agnostic about what it's judging - it can judge a person, or a project, or a joke, or a contribution in a very abstract way. All you have to do is set up the rubric of what good means for that evaluation. So with that rubric you can define: this is a bunch of contributions, and what I want is uniqueness, integrity, whatever you want. That's already very doable.

[Plat0x] The idea I had, and this is something I've always told Josh, is that the most interesting thing about Bonfires is not Bonfires in itself, but what you can do with it as a backend.

[Zaal] I don't want to cut you off, but I have a specific idea I forgot to mention. The idea is that on July 1st, before the open submission, there's an LLMS.txt that is all of our brand info, all of our brand assets. You use your harness of choice, point it at this, and say, hey, what's interesting for what we've built and what we want to build. It'd be really cool to combine there. And one of the things that would be nice with Bonfires is if on my website I could have it - instead of people having to go to Telegram, not just a chatbot, but: you use your GitHub or Farcaster profile or wallet as your login account, but then you can add information to your submission using the graph, or using the bot as an interactive piece with the graph. Kind of like what we were thinking of doing with the hackathon at ETH Boulder.

[Plat0x] Let me draw something. Hermes, Codex, Claude - right? And then maybe it's at an app level. The user brings their own harness and the user gets a skill file. But the skill - we don't need this skill to call the Bonfires API. If we don't want to, it's not needed. So what we can say is, the skill says: push to GitHub with this hash, or your wallet address, in your MD file. And then you create a server that people - maybe you make it call the server and register. So this call goes to your server and says, user 0x2 has GitHub repo /several-beatbox, whatever. So your server just keeps a list of addresses and repos. And then you have a daily or hourly cron job to check each one of those for new commits and create a new episode on Bonfires.

[Zaal] That's exactly what I would like. That's something around what I would like.

[Plat0x] Because this way you have this nice separation where people bring their own tokens and keys - they're spending money - and you tell them, hey, just use GitHub, create a log where you're recording your progress, put as much information there, because you know this information is going to be read and indexed by the main thing. It's not like you're developing to avoid it. Usually if people think they're not going to be heard, they're not going to say anything. But if you tell them, hey, on the knowledge-gathering phase we don't even want you to make code, but rather make a GitHub repo and write reports -

[Zaal] Exactly.

[Plat0x] - and then we'll index all those reports into a centralized thing, so you can talk about all the reports to the agent. And then you can even play this game of whose reports are used more often. So you make it a knowledge game: who brings the most interesting information, measured by whose information is used in the queries or in the summaries the agent does daily. And then you add the hyper-block thing, where people ask about different things - you make remixes of all these reports: "tell me what the DeFi reports say," and the agent has examples of different people talking about DeFi, and it gives you a cited thing.

[Plat0x] So your job becomes this part only, because the graph-making is already kind of solved - you just push it to Bonfires. You're just creating that small scheduled push. The user brings their Hermes or codex or whatever, they have a skill which they use to push to GitHub, and a single call to register. That's all you have to care about, because the data is stored on GitHub, the graph is stored on Bonfires, and all you have to do is keep this list.

[Zaal] Perfect. I'm going to start building that into the ZABAL Games repo and then send it over to you.

[Plat0x] Perfect. Amazing. Thank you for your time. I'm going to probably ping you again later today - find a time that works for you in the first week of June. If you've got your calendar up, we can schedule it.

[Zaal] My calendar is empty, so just make it the same time. I'm good at getting to meetings as long as they're scheduled a day in advance.

[Plat0x] Okay, let's plan for the first then - Monday. And if it's 30 minutes, I'd like to have at least three, because we could do one on different days.

[Zaal] Yeah, for sure. That's why I'm trying to schedule you early so we can push out the content, and as soon as we push it out, schedule the next one. I want to do as many with everyone in June - first half more workshop styles, second half more panel styles. After we've done two or three, you have an AMA: come in, ask questions about us using it.

[Plat0x] Nice. I'm ready for all that. I'll do a five-to-six Monday.

[Zaal] Good. That's good.

[Plat0x] All right, I'm going to send you an email. Cheers, thanks for your time.

[Zaal] No problem. Bye.
