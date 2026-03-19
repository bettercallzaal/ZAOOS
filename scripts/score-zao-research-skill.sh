#!/bin/bash
# Score the zao-research skill against 6 binary assertions
# Returns a single number: pass count out of 6

SKILL_FILE=".claude/skills/zao-research/SKILL.md"
SCORE=0

# Assertion 1: Does skill instruct to put recommendations/decisions at top?
if grep -qi "recommendations.*top\|decisions.*top\|Key Decisions.*first\|put.*recommend.*top\|recommend.*at the TOP" "$SKILL_FILE"; then
  SCORE=$((SCORE + 1))
fi

# Assertion 2: Does skill reference ZAO OS tech stack specifically?
# Must mention at least 2 of: Next.js, Supabase, Neynar, Farcaster, XMTP
TECH_HITS=0
grep -qi "next\.js\|nextjs" "$SKILL_FILE" && TECH_HITS=$((TECH_HITS + 1))
grep -qi "supabase" "$SKILL_FILE" && TECH_HITS=$((TECH_HITS + 1))
grep -qi "neynar" "$SKILL_FILE" && TECH_HITS=$((TECH_HITS + 1))
grep -qi "farcaster" "$SKILL_FILE" && TECH_HITS=$((TECH_HITS + 1))
grep -qi "xmtp" "$SKILL_FILE" && TECH_HITS=$((TECH_HITS + 1))
if [ "$TECH_HITS" -ge 2 ]; then
  SCORE=$((SCORE + 1))
fi

# Assertion 3: Does skill require specific numbers/versions/dates?
if grep -qi "numbers.*versions\|versions.*dates\|specific numbers\|include.*dates\|include.*version" "$SKILL_FILE"; then
  SCORE=$((SCORE + 1))
fi

# Assertion 4: Does skill require linked sources with URLs?
if grep -qi "sources.*link\|link.*source\|sources.*URL\|URL.*source\|NEVER omit sources" "$SKILL_FILE"; then
  SCORE=$((SCORE + 1))
fi

# Assertion 5: Does skill require cross-referencing existing research?
if grep -qi "cross-reference\|cross reference\|existing research\|check.*research.*doc\|compare.*research.*code" "$SKILL_FILE"; then
  SCORE=$((SCORE + 1))
fi

# Assertion 6: Does skill enforce actionable language (USE/DO not consider/might)?
if grep -qi "actionable\|USE.*because\|tells you what to do\|NEVER.*vague\|NEVER.*consider" "$SKILL_FILE"; then
  SCORE=$((SCORE + 1))
fi

echo "$SCORE"
