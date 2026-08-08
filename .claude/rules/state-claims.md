# State Claims - name the source, or do not make the claim

Established 2026-08-08 after a single session produced EIGHT wrong statements
about this repo's own state. Not predictions, not opinions - claims about files
sitting on the disk. Zaal: "There's a lot of times u say correction, saying it's
built. I feel like visibility is a big challenge."

`confirm-before-claiming-absence.md` already existed and said to verify. It did
not prevent any of the eight, and understanding WHY is the whole rule.

## Why the existing rule failed

**Every wrong answer came from a proxy that was cheaper to reach than the truth.**

| The claim | What was read | Where the truth was |
|---|---|---|
| "we're on grammy ^1.29.0" | the package.json range | `package-lock.json` |
| "21 files can't find grammy" | tsc's output | an empty `node_modules` |
| "3 pre-existing test failures" | the test runner | the same empty directory |
| "the Heart's only consumer is a canary" | the canary file itself | a grep for call sites |
| "seven things we should build" | a sense of the repo | the code |
| "boot-verify passed" | esbuild's exit code | which commit it checked out |
| "no new typecheck errors" | a diff against a baseline | whether that baseline was current |
| flags set to `true` | assuming true means true | the `=== '1'` in the source |

package.json was already in context; the lockfile was one more read. tsc
volunteered 183 errors; nobody thinks to ask an empty directory whether it is
empty. **The proxy always wins on effort, and it is usually right - which is what
makes it dangerous. It is wrong exactly when the answer matters.**

A rule that says "check the lockfile" loses to "package.json is already open".
So the rule cannot be about diligence. It has to change the cost.

## The rule (behavior-changing)

**1. A state claim carries its source, in the sentence.**

Not "we're on 1.42.0" but "**the lockfile pins** 1.42.0". Not "nothing imports it"
but "**a grep for call sites outside the module and its tests found** nothing".

This is cheap and it is the whole mechanism: naming the source makes a WRONG
source visible to the reader, and - more often - visible to yourself as you type
it. Half of the eight would have died at the moment of writing "the package.json
range says we're on...".

**2. Use `zao-verify` - it is faster than the proxy.**

```
zao-verify dep <name>      installed version vs the range vs what is on disk
zao-verify wired <module>  what actually imports it, excluding itself and tests
zao-verify flag <NAME>     the literal the code accepts - `true` is not universal
zao-verify exists <term>   what already covers this, before building a second one
zao-verify env             is the toolchain installed at ALL
```

Every answer prints its source. If a question is not covered, name the source by
hand - the naming is the requirement, the tool is the convenience.

**3. Before believing ANY tool, confirm the tool can run.**

`zao-verify env` first, whenever a tool reports something surprising. 183
typecheck errors on a healthy repo is not a finding, it is a missing
`node_modules` - and it cost a day of "no NEW errors" instead of "no errors".

**4. Measuring a DELTA instead of an ABSOLUTE means you have already adapted to a
broken instrument.** "No new errors", "same failures as main", "no new warnings" -
each is legitimate ONLY once you have established what the baseline is and why.
Otherwise the baseline is where the real problems live. And re-derive the baseline
against the CURRENT target; one captured before an intervening merge invents
phantom deltas.

**5. "Merged" is not "running".** A feature has four independent states - BUILT,
WIRED, FLAGGED, LIVE - and only the first is visible from the code. Use
`zoe-liveness --remote`. A flag set to a value the code rejects reads as done and
does nothing, which is worse than unset.

## The tell

If you are about to write "it's built", "nothing does X", "we're on version Y", or
"that's already deployed" - stop and ask **which file would prove me wrong?** Then
open that file. If you cannot name one, the claim is a memory, not a fact, and it
should be phrased as one.

## Guards

- This is not a licence to slow everything down. Four of the five checks are one
  command and under a second; the rule is cheap precisely so it survives a tired
  session.
- Honest uncertainty is always allowed and always better: "I did not check" beats
  a confident wrong answer, and `anti-fabrication.md` rule 4 already says grade
  down when unsure.
- Applies hardest to autonomous and overnight work, where nobody is reading over
  your shoulder and a wrong state claim becomes a wrong build.

## Source

Zaal 2026-08-07/08, from eight wrong state claims in one session and the
observation that visibility was the common cause. Siblings:
`confirm-before-claiming-absence.md` (absence claims - this generalises it to all
state), `anti-fabrication.md` (evidence or UNVERIFIED),
`noisy-signal-guard.md` (a check that always fires is a check nobody reads),
`silent-failure-guard.md`. Tools: `scripts/agents/zao-verify.py`,
`scripts/agents/zoe-liveness.py`.
