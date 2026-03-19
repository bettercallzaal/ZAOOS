#!/bin/bash
# Score recent research docs against 6 quality assertions
# Tests the OUTPUT quality of the zao-research skill
# Returns: total pass count across all docs scored

SCORE=0
TOTAL=0
DOCS="research/62-autoresearch-skill-improvement/README.md research/63-autoresearch-deep-dive-zao-applications/README.md"

for DOC in $DOCS; do
  if [ ! -f "$DOC" ]; then
    continue
  fi

  # Assertion 1: Recommendations/decisions table at the top (within first 30 lines)
  TOTAL=$((TOTAL + 1))
  if head -30 "$DOC" | grep -qi "Key Decisions\|Recommendations\|Decision.*Recommendation"; then
    SCORE=$((SCORE + 1))
  fi

  # Assertion 2: References ZAO OS tech stack (at least 2 of: Next.js, Supabase, Neynar, Farcaster, XMTP)
  TOTAL=$((TOTAL + 1))
  TECH=0
  grep -qi "next\.js\|nextjs" "$DOC" && TECH=$((TECH + 1))
  grep -qi "supabase" "$DOC" && TECH=$((TECH + 1))
  grep -qi "neynar" "$DOC" && TECH=$((TECH + 1))
  grep -qi "farcaster" "$DOC" && TECH=$((TECH + 1))
  grep -qi "xmtp" "$DOC" && TECH=$((TECH + 1))
  if [ "$TECH" -ge 2 ]; then
    SCORE=$((SCORE + 1))
  fi

  # Assertion 3: Includes specific numbers, versions, or dates
  TOTAL=$((TOTAL + 1))
  if grep -qE "[0-9]{4}|v[0-9]+|[0-9]+\.[0-9]+|[0-9]+%" "$DOC"; then
    SCORE=$((SCORE + 1))
  fi

  # Assertion 4: Sources linked with URLs at the bottom
  TOTAL=$((TOTAL + 1))
  if grep -qi "## Sources" "$DOC" && grep -qE "https?://" "$DOC"; then
    SCORE=$((SCORE + 1))
  fi

  # Assertion 5: Cross-references existing research doc by number
  TOTAL=$((TOTAL + 1))
  if grep -qE "doc [0-9]+|Doc [0-9]+|research/[0-9]+" "$DOC"; then
    SCORE=$((SCORE + 1))
  fi

  # Assertion 6: Actionable language (USE/DO/INSTALL not consider/might/could)
  TOTAL=$((TOTAL + 1))
  ACTIONABLE=0
  grep -qi "\bUSE\b.*because\|\bINSTALL\b\|\bRUN\b\|\bDO\b.*not" "$DOC" && ACTIONABLE=$((ACTIONABLE + 1))
  VAGUE=0
  # Check ratio - penalize if vague words dominate
  VAGUE_COUNT=$(grep -oi "consider using\|you might\|you could\|it would be good" "$DOC" | wc -l | tr -d ' ')
  if [ "$ACTIONABLE" -ge 1 ] && [ "$VAGUE_COUNT" -le 2 ]; then
    SCORE=$((SCORE + 1))
  fi
done

echo "$SCORE/$TOTAL"
