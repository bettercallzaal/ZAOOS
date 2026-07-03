# Newsletter Draft -- Friday July 4, 2026

*ZOE Nightly | Draft for Zaal's review | Year of the ZABAL*

---

## Draft

**12 PRs open. 0 merged today. That is not a problem.**

The PR queue went from 2 to 12 in one day. That is the correct shape of a research sprint: you fan out before you converge. Docs 935 and 936 went deep on ZAO's monetary policy and fractal governance design -- 7 research threads on how Respect should work when ZAO has 1,000 members instead of 188. The burn/decay proposal is in #1048. The whitepaper outline v2 corrects the version 1 error that would have printed "2% weekly decay" as fact when the actual code runs a raw sum with no decay at all. Docs before prose. Code is ground truth.

The other thing that landed: three security fixes from a real audit. An account impersonation vector (unsigned FID trusted by the miniapp route, could write sessions for any of 40 allowlisted users), a CSV formula injection path, and a fail-open rate limiter that quietly stopped enforcing when Redis went down. All three fixed, typecheck green, sitting in PR #1045. Security debt is the kind of thing you pay before it collects interest.

Sistla from Creator Studio reached out. His platform does AI video for creators -- he wants to run a joint workshop and has offered compute credits to test privately first. Meeting recap is in doc 940, PR #1047. The overlap with the ZAO media stack (Juke, Livepeer pilot, the 30-60s highlight clip pipeline) is real. DevCon India is also on the table as a venue. Keeping the thread warm.

---

## MINDFUL MOMENT

Today is July 4. Independence Day in the US is a strange holiday to celebrate when you are building onchain infrastructure for a community that governs itself. The ZAO Fractal is not a patriotic project. But the underlying idea -- that a group of people can build rules for themselves, that the group's decisions are legitimate because the people who live under them made them -- is exactly what the whitepaper is trying to formalize.

Doc 935 (monetary policy for merit) ends with a question: "what does it mean to earn your way in a community that runs on Respect?" The answer the research points toward is: it means showing up, shipping, and accumulating a score that reflects both history and recency -- not just who was there first, not just who is loudest today.

The Respect Game has been running for 90+ weeks. The rules were designed by the same people who play it. That is the experiment. The whitepaper is the write-up.

Build your own governance. That is the ZAO version of independence.

---

*Draft -- Zaal to review, edit, publish. Voice: specific, build-in-public, never use em-dashes.*
