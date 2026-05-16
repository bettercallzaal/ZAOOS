---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-16
related-docs: 657, 657a
tier: STANDARD
parent-doc: 657
---

# 657d — dembrane (note: NOT "Dembrain")

> **Goal:** dembrane is the "QR code, phone on the table, AI listens + transcribes + anonymizes + summarizes the conversation" tool. Recommended as Maine Plural Event primary tool — lowest cognitive load for participants + facilitator. Note: transcript repeatedly spells it "Dembrain" — correct spelling is **dembrane**, by dembrane B.V. Netherlands.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Maine Plural Event primary capture tool | **dembrane** | Bastien (Berlin host) on call: "easiest tool of all of them." Conceptualized for any-socioeconomic-field accessibility. Only need a phone + the QR code. |
| ZAOstock Oct 3 capture during festival | YES if sponsor seat secured | Multiple stations / phones across festival areas, all aggregating into one dashboard. Matches the festival's distributed-conversation reality. |
| Ongoing ZOE captures (replace voice memo flow) | NOT YET | ZOE has its own `bot/src/zoe/posts/voicememo.ts` (PR #533). dembrane is for *group conversations*, not solo captures. Keep distinct. |
| Use for any non-EU data | CHECK FIRST | EU-hosted servers + ISO 27001 + GDPR. Excellent if Maine event captures EU citizens or sensitive content; verify if any US data residency concerns apply. |

## What It Is

**Company:** dembrane B.V., KVK 89391438, Sint Janssingel 88, 5211DA, Netherlands.
**Pitch:** "Makes it easier to make sense of big, messy conversations, so everyone can shape what happens next."
**Mechanism:** Stakeholder engagement platform that listens to multiple simultaneous small-group conversations and turns each into actionable outcomes via real-time AI synthesis.

## How It Works (from Bastien on the call)

1. Host generates a QR code per event, displays it on a screen / on the table.
2. Participants scan it on their phone → agree to GDPR / privacy notice → conversation starts.
3. The phone stays **on** with mic active (config it to "always on" — Bastien's specific warning).
4. Multiple phones can join the same session — each phone = one breakout group. Barcelona event planned 1 central phone + 1 extra per breakout room for a ~25-person multi-group event.
5. dembrane transcribes live + strips identifying information automatically (names, etc.) so the transcript is anonymous.
6. **Live AI synthesis** populates the dashboard with emerging themes.
7. Facilitator can **verify topics** during or after — dembrane proposes "you talked about X; agree?" → confirm or fine-tune.
8. **"Echo"** feature gives back deeper questions to guide the conversation while it's happening.
9. Dashboard aggregates *all* groups in real time — Jess Scully called it a "mega-dashboard" for events with many parallel rooms.

## Privacy Architecture (specifically called out)

- All processing follows **German + European privacy law** (Bastien's specific language).
- Live transcription **strips identifying information** before it lands in the analysis layer. The recording captures audio, but the *content surface inside the tool* is identity-free.
- EU-hosted infrastructure, ISO 27001 certified.
- "Source available" today, transitioning to fully open-source per company statement Feb 2025.

## Cost

Paid (no public pricing). **However:** dembrane sponsored a free seat for the RadxChange Plural Event pilots — meaning Zaal's Maine event can almost certainly claim a sponsor slot via Nicolene at Hubs Network. **Action:** DM Nicolene on the Hubs Network Telegram (link Nicolene shared during the call) and request the dembrane sponsor seat for the Maine event.

## Strengths

- **Lowest participant friction of any tool.** No login, no app install, no opinion-typing. Just talk.
- **Lowest facilitator cognitive load.** "QR code on table, forget about it, look at dashboard later" (Nicolene).
- Anonymity by construction — participants speak freely.
- Multilingual support out of the box.
- ISO 27001 + EU hosting = strong privacy posture for international Plural Events spanning EU + non-EU participants.

## Limitations

- **Paid product** (need to claim sponsor seat).
- Requires every phone in the conversation to have battery + always-on mic — Bastien's specific operational warning. UDK Berlin event is planning to use **two professional microphones plugged into a PC** instead of phones, for reliability.
- Audio recording (even with anonymized transcript) may not fit certain venues' policies — verify with Parklet / City of Ellsworth before the Maine event if it's outdoor / public.
- AI summaries can be off — facilitator must verify-topic during/after, not just trust the output.
- "Echo" auto-generated questions felt "very AI-generated" to Nicolene — useful but don't lean on them as primary facilitation.

## ZAO Integration Path

- **Maine Plural Event:** primary tool. Pre-event: claim sponsor seat via Nicolene, configure session name = "Cosmo Localism — Ellsworth Maine 2026", tag = city name (so multi-event aggregation works), test one phone at home first.
- **ZAOstock Oct 3:** if sponsor seat available, multi-phone setup across festival zones, dashboard reviewed in post-event debrief (Cassie's Oct 10 retrospective pattern, Doc 547).
- **Internal team meetings:** could test at Mon 11:30 cobuild or Tue 10am ZAOstock standup for low-stakes practice.

## What dembrane Won't Do

- Doesn't do voting — pair with Polis or RadxChange QV for ratification.
- Doesn't do live cluster analysis the way Polis does — it does **theme extraction**, which is qualitative not quantitative.
- Doesn't preserve speaker identity (by design) — so individual contribution tracking is impossible. Trade-off accepted.

## Sources

- [dembrane homepage](https://www.dembrane.com/)
- [dembrane contact form](https://forms.dembrane.com/contact)
- [dembrane dashboard](https://dashboard.dembrane.com)
- Meeting transcript — Bastien Berlin walkthrough segment from ~42:00 onwards
- KVK registration 89391438 (Netherlands company registry)

**Spelling correction:** the meeting transcript repeatedly uses "Dembrain" and "Zembrain" — these are auto-transcription errors. The canonical name is **dembrane**, all lowercase. Use that spelling in any ZAO doc or social post.
