# FFX private-beta access request

**To:** Cassie Heart (@cassie, FID 1325) / Quilibrium
**From:** ZAO / $ZABAL community (BetterCallZaal - bettercallzaal/ZAOOS)
**Re:** FFX serverless exec - private beta access (offered in Bootcamp #10)

## What we are building
A sovereign, multi-agent Farcaster presence for the ZAO/$ZABAL community, orchestrated by our
agent ZOE, running on the Quilibrium stack end to end:

- **Reads/events:** self-hosted Hypersnap node (read-only, gRPC event stream).
- **Signer custody:** QKMS (Ed25519, verifying key-spec).
- **Safety/classification:** Klearu (davit-infer for images, SLIDE/LLaMA classifier for text)
  - wrapped as a CLI/socket subprocess; we would like to run it as an FFX function for the
  pre/post safety gate.
- **Reasoning:** OpenRouter today, moving to x402-metered (Router402) reasoning.
- **Serverless exec (the ask):** **FFX** - we want to run each ranked per-agent action as one
  FFX invocation, so the agent execution layer is sovereign rather than running on a single
  centralized box.

## Why FFX specifically
The multi-agent layer (per doc 318 from your bootcamp) ranks candidate actions with a softmax
over 5 factors and runs each surviving action through a guard battery. Moving each action
execution onto FFX gives us: isolation per action, no always-on server for the exec plane,
and a clean place to host the Klearu safety function. It fits the "sovereign agent" design we
took from your bootcamp material directly.

## What we are asking for
1. Private-beta access to FFX for the operator FID / account.
2. Pointers to the current FFX function-authoring + invocation docs (the published docs are
   login-walled; we have been building against inferred shapes and flagging them as
   unverified in our code).
3. Confirmation of the QKMS key-spec for Ed25519 signing keys
   (`ECC_NIST_EDWARDS25519` or equivalent) - we have a `@noble/ed25519` in-process fallback
   wired, but would prefer QKMS custody if Ed25519 is supported.

## Contact
- GitHub: bettercallzaal (you noted you prefer GitHub over DMs)
- Repo: bettercallzaal/ZAOOS, branch `ws/zao-farcaster-multiagent`
- Architecture doc: research/agents/761-zao-farcaster-multiagent-quilibrium-stack/README.md

Thank you - the Hypersnap + HAATZ work has already let us cut our Farcaster read costs to
zero; FFX is the next piece.
