# Daily Newsletter Draft — Friday June 19, 2026

*Zaal's voice | Build-in-public | Year of the ZABAL*

---

Six pull requests. One Thursday.

Started with FxTwitter. Turns out reading X long-form Articles has always been free — you don't need Premium+, a scraper, or even an account. Swap x.com for fxtwitter.com, and the full body is right there. 81 blocks verified on a live article. We documented the pattern (doc 873), then built it into src/ as a proper library util with Zod validation and 10 passing tests (PR #883). Now every ZAO tool that needs to read an X Article can do it with one function call. Two PRs, one method, zero subscriptions needed.

The AgentMail inbox had 7 unread forwards. They came out as 4 research docs: Hermes agent architecture, A-Corps Colorado formation (that Aug 12 effective date is real — the LLC clock is already running), Plurality coordination hubs, and AI music marketing automation. That last one — doc 878 — is the research companion to Arun's workshop that's happening tomorrow on June 20. The STORM research method also landed as 4 paste-ready Claude prompts (doc 874) — useful any time a deep session needs structure before it starts writing. The lab's memory is getting denser.

ZAOstock got operational. Doc 871 (Phase Two) was already the plan. PR #886 turns it into things you actually paste and fill: the kickoff post for the team channel, the owner board, the week-1 checklist with the accountability holes named (Sponsors has no confirmed main — that's the one to resolve first). Sep 3 artist cutoff is 77 days out. The /overview page also got live heartbeat data for the bot fleet — no more SSH to check if the boys are alive. That's PR #887, one Vercel env var away from going live.

---

**MINDFUL MOMENT**

The STORM research method builds a comprehensive view by simulating a conversation between perspectives before you write anything. You don't start with a blank page — you start with experts questioning each other, edges mapped, gaps named. The same pattern is what's been going into ZOE: before it replies, four Haiku readers fan out and extract people, decisions, and commitments from the context it's holding. Don't answer until you understand the shape of what you're working with. That's not slowness — that's how you stop writing the wrong thing confidently.

---

*Draft — review before sending*
