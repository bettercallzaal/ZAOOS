# ZAO Daily — May 31, 2026

*Draft prepared by ZOE Nightly — in Zaal's voice. Edit before sending.*

---

Today was the day we audited ZOE before trusting her.

The ZOE orchestrator has been getting smarter for weeks — plan decomposition, dispatch loops, the reflexion memory writes, the weekly learning cycle over telemetry. But "smarter" without a safety review is just faster failure. So we ran the audit. Doc 770 went in, and five HIGH findings came back out. Not catastrophic, but real: a command-prefix bypass that could swallow a `plan:` in the wrong state. A budget that stopped *after* a $10 wave instead of before it. An unbounded `Promise.allSettled` that could spawn 40 parallel subtasks on a single message. You don't hand a system cost-incurring autonomy until you've actually read the code and patched the holes.

PR #733 fixes all five. Eighty-two ZOE tests pass. The TypeScript compiles clean. After this lands and the VPS redeploys, the smoke test is one line: send `plan: test routing` and watch whether ZOE routes or just ACKs. If she routes, she's trusted. If not, we diagnose. That's the bar. Audit → fix → smoke test → trust. No shortcuts.

The other thing that happened today is a reminder that research is falsifiable. Doc 771 — the Bonfires procedural memory kernel piece — landed with a wrong claim baked in: that NERDDAO's `trimtab` repo was the likely home of the FCG kernel. A four-agent DEEP cross-reference came back and said no. Trimtab is Tracery plus n-gram plus HDBSCAN plus a ladybug vector store. It's real and it's interesting, but it's not the FCG kernel. The FCG kernel is proprietary — zero public hits across fifty NERDDAO repos. The only hook into what Bonfires is actually building is through their fork of `getzep/graphiti` with GLiNER examples. PR #736 corrects the record. The system worked: the research flywheel generated a claim, the verification pass falsified it, the doc gets updated. That's the point of doing research in public — claims don't survive contact with the code.

---

**MINDFUL MOMENT**

There's a quiet discipline in today's work: you don't promote a thing until you've stress-tested it.

ZOE didn't get autonomous authority because she was impressive — she got it after someone read her orchestrator code line by line and found the five places where it could go sideways. The Bonfires kernel doc didn't stay wrong — the cross-reference caught it within a day. The CRM isn't getting a migration until Zaal signs off on the SQL.

Every one of those is the same move: check before you commit.

That's not slowness. That's how you build things that compound. A bug in an autonomous agent isn't a bug in a function — it's a bug that makes decisions while you sleep. A wrong claim in a research doc doesn't just mislead one person; it gets cited, linked, and baked into other docs. A schema migration you can't roll back is permanent.

The Year of the ZABAL is a build-in-public story. Building in public means being willing to correct yourself in public too. Doc 771 has a correction callout now. ZOE has five new tests. The CRM has a proposal, not a schema. That's the discipline.

Ship it when it's ready. Not before.

— Z

---

*[Farcaster / newsletter thread — edit as needed before posting]*
