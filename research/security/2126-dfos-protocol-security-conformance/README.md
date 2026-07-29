---
topic: security
type: audit
status: research-complete
last-validated: 2026-07-29
superseded-by:
related-docs: "2122, 2124, 123"
original-query: "lets keep researching more and more (DFOS deep research wave 2 - protocol internals: threat model, credentials, conformance, and what ZAO would be signing up for)"
tier: DEEP
---

# 2126 - DFOS Protocol: threat model, credentials, conformance, and what ZAO would actually be signing up for

> **Goal:** Read the DFOS protocol as an engineer deciding whether to integrate, not as a reader of marketing. Cover the trust boundaries, adversary classes, credential model, and conformance obligations - and state plainly what breaks and who can read what.

## Key Decisions

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Treat DFOS content as "undisclosed," never as "encrypted."** The spec is explicit: "**The relay operator can read what it stores.**" There is no end-to-end encryption anywhere in the protocol. | NEVER put anything in a DFOS space that ZAO would not put in a Google Doc shared with the platform operator. Treasury figures, member PII, unreleased masters - all readable by whoever runs the relay. |
| 2 | **If ZAO ever runs identity on DFOS, use the sovereign signing path, not managed.** A compromise of the platform's KMS is **full impersonation and is undetectable on-chain** - the forged signature is a valid Ed25519 signature from a key declared in your identity chain. | HOLD. This is the single most important operational fact in the spec, and it is stated by Metalabel themselves, not inferred. |
| 3 | **Do NOT countersign anything private.** A countersignature is a public proof-plane object that permanently links witness DID to target. | HARD RULE if ZAO ever uses countersignatures: "If the fact of the attestation is itself sensitive, do not countersign" - their words. |
| 4 | **Self-hosting a relay does not buy ZAO sovereignty over content it does not hold.** Relays cannot forge, but they can withhold, reorder, equivocate, censor, and serve stale state. | RUN A RELAY only if ZAO wants a verified copy of its own chains. It is not a censorship-resistance play. |
| 5 | **Conformance is a real, three-tier obligation - budget accordingly.** Verifier, Signer, Relay tiers each carry an explicit MUST set with deterministic test vectors. Even Tier 1 (verify only) requires the full Signature Verification Profile, identity + content chain verification, services projection, and CID derivation. | SCOPE any integration as Tier 1 minimum. This is not a two-day SDK drop-in; it is implementing a spec against a conformance corpus. |
| 6 | **Protocol-layer rate limiting does not exist.** `POST /proof/v1/operations` is unauthenticated by design; operations self-authenticate. Rate limiting is "explicitly deferred to the deployment layer." | IF ZAO runs a relay, rate limiting and abuse handling are ZAO's problem from day one. |

## Two Planes, Two Trust Models

This is the whole architecture in one idea, and it is genuinely well-executed.

### Proof plane - self-authenticating, trustless

- Identity chains, content chains, artifacts, countersignatures, credentials, and revocations are all signed, content-addressed objects
- Anyone verifies with a public key and any standard EdDSA + dag-cbor library
- No privileged registry, no blockchain, no consensus. **The identifier is the trust anchor** - a `did:dfos` is verified by re-deriving it from the genesis CID
- All proof-plane relay routes are **unauthenticated**; the operations carry their own authentication
- "Everything below the crypto core is cryptographically verified. Nothing above it needs to be trusted to verify a proof."

### Content plane - honest-host, undisclosed-by-default

- The protocol commits to content **hashes**, not plaintext. It does not encrypt
- Confidentiality is enforced at the application layer by whoever serves the documents
- **"The relay operator can read what it stores."**
- The content plane never gossips - blobs stay with the relay that received them and are served only to authorized readers
- Access is gated by an auth token plus, for non-creators, a read credential

> "The security posture of a document is therefore the security posture of the relay operator that holds it."

That sentence is the honest summary of DFOS privacy. It is a well-designed honest-host system, not a zero-trust one. Metalabel says so directly rather than hiding behind "encrypted" - which is more than most platforms do - but ZAO must plan against the actual property, not the vibe.

## Adversary Classes (from the spec's own table)

| Adversary | Can | Cannot |
|-----------|-----|--------|
| Malicious / Byzantine relay | Withhold, reorder, equivocate, censor, serve stale state, **read stored content blobs** | Forge a chain or operation |
| Malicious peer | Push invalid/spam operations to peers | Have them accepted - every peer re-verifies, no inter-relay trust |
| Unauthenticated submitter | POST arbitrary JWS to `/proof/v1/operations`, imposing CPU and storage cost | Have malformed or unsigned ops accepted |
| Compromised custody / KMS key | **Full, indistinguishable impersonation of the user** | Be detected on-chain - the signature is valid Ed25519 |
| Lost key | - | - (1-of-N availability vs total loss) |

### The equivocation gap

A relay can serve **different views to different clients** and this is not detectable from within the protocol. There is no consensus layer whose job is to prevent it. Convergence is deterministic (highest `createdAt` among tips, lexicographic CID as tiebreaker), but only across the operations you actually receive. **If a relay withholds an operation, your convergence is correct and wrong at the same time.** For ZAO's purposes: DFOS proves authorship, it does not prove completeness.

### The KMS impersonation gap

Worth restating because it is the practical risk for any real user. In SIWD's managed path the platform holds the key in a KMS and signs on the user's behalf. If that custody is compromised, the attacker produces signatures that are **indistinguishable from the real user's** - same key, declared in the same identity chain, verifying under the same profile. There is no on-chain artifact of the compromise.

The sovereign path (local CLI holds the key, platform never touches it) avoids this entirely. It also reintroduces exactly the key-management burden that Metalabel's own post-crypto essay identified as hostile to normal users (see [Doc 2124](../../business/2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/), strike 3 - Yancey's own wallet drain). **DFOS has not solved key custody; it has made the tradeoff explicit and offered both sides of it.** That is a more honest position than most, and it is still an unsolved problem sitting in ZAO's path if ZAO ever onboards musicians onto sovereign keys.

## Credentials: UCAN with the serial numbers filed off

DFOS credentials are signed authorization tokens answering "does this DID have permission to do this thing?" Two mechanisms are taken **explicitly from UCAN**:

1. **Delegation chains** - a credential embeds its parent in a `prf` field, forming a verifiable linear chain from root issuer to leaf holder
2. **Monotonic attenuation** - each hop can only narrow scope, never widen. Fewer resources, fewer actions, shorter expiry

Payload shape:

```json
{
  "version": 1,
  "type": "DFOSCredential",
  "iss": "did:dfos:cnnnft9f8a2rn938d6nkz38r847v2kr",
  "aud": "did:dfos:nzkf838efr424433rn2rzkdv8h7t9ae",
  "att": [{ "resource": "chain:cv7n8vkvr64cctf3294h9k4eanhff8z", "action": "write" }],
  "prf": [],
  "exp": 1798761600,
  "iat": 1772841600
}
```

Credentials are content-addressed via CID (same dag-cbor + SHA-256 scheme as every other object), making each one a stable, revocable artifact. Unknown top-level fields are **preserved-and-ignored** for forward compatibility, and the CID still commits to the exact bytes.

**This is the crypto-primitive continuity worth noting.** UCAN came out of the IPFS/Fission web3 world. DFOS kept UCAN's authorization model, W3C DIDs, Ed25519, and content addressing - and dropped only the ledger. Reinforces the Doc 2124 finding: the pivot was away from **chains and their fee markets**, not away from cryptographic self-sovereignty.

## Conformance: what implementing this actually costs

Three composing tiers, each with a normative MUST set bound to deterministic test vectors.

### Tier 1 - Verifier (the minimum for any integration)

- **Signature Verification Profile** - `alg: "EdDSA"` exact match, `crit` rejection, **no header-key-trust** (`jwk`/`x5c` rejected), canonical scalar `S < L`, 64-byte length. Applies to every verification path
- **Identity chain verification** - genesis bootstrap, signer validity against prior controller state, `previousOperationCID` linkage, `createdAt` ordering, `header.cid` consistency, terminal-state enforcement
- **Content chain verification** - EdDSA validity, `kid`-DID matches payload `did`, CID integrity, chain linkage, terminal state, creator-sovereignty authorization when `enforceAuthorization` is on
- **Services projection** - project the identity chain's `services` array into verified state: max 256 entries, unique `id`s, 32768-byte CBOR cap, recognized-type structure, preserve-but-ignore unknown types
- **Derivation** - dag-cbor canonical encoding with **integer (not float) number encoding**, CIDv1 construction, the 19-char/31-length ID alphabet, W3C Multikey
- **Credential verification** (if consuming credentials) - delegation walk, monotonic attenuation, linear single-parent `prf`, expiry narrowing against a deterministic time basis, depth limit, revocation at every level

### Tier 2 - Signer

JWS envelope construction (derive CID **before** signing, embed in protected header), `kid` rules (bare key ID for identity genesis, DID URL otherwise; content ops always DID URL), `cid` header present on every operation/artifact/countersignature/credential/revocation but **absent on auth-token JWTs**, and canonicalization discipline - integer number bounds, no Unicode normalization, no duplicate keys.

### Tier 3 - Relay

Ingestion verification, peering (gossip / read-through / sync), convergence, and the frozen `/proof/v1/*` route surface.

**Honest read for ZAO:** Tier 1 alone is a serious piece of work - canonical CBOR encoding, CID derivation, and a strict JWS profile are all places where "almost right" means "silently incompatible." The mitigation is that Metalabel ships deterministic test vectors and five reference implementations (TypeScript, Go, Python, Rust, Swift) that all pass the same corpus. If ZAO integrates, **use `@metalabel/dfos-protocol`, do not reimplement.**

## Version Stability: what is actually frozen

| Surface | Clock | Frozen? |
|---------|-------|---------|
| Core wire - chain mechanics, DAG-CBOR encoding, identifier derivation, validity bounds | Protocol v1 | **Frozen.** "Will not change in shape" |
| Proof plane routes `/proof/v1/*` | Protocol v1 | **Frozen.** A relay MUST serve them at exactly these paths |
| Revocation status `/revocations/v1` | Own v1 | Frozen |
| Content schema vocabulary | Own 0.x | Not frozen - additive |
| Document gateway `/content/:contentId/blob*` | Own 0.x | Not frozen |
| Relay ingestion ergonomics, peering, content plane | Reference impl | **Not frozen** |
| Universal resolver `/1.0/identifiers/:did` | DIF driver 1.0 | Tracks DIF, not DFOS |
| **Sign In With DFOS** | Own 0.1 | **Not frozen, and no reference verifier exists** |
| `@metalabel/dfos-protocol` npm package | Own 0.x semver | Not frozen - "freezing v1 commits the **wire**, not yet a library API" |

Two things follow. First, "v1 frozen" is a narrower claim than it sounds - it covers the wire, and the library you would actually import is still 0.x. Second, they took one **deliberate pre-adoption breaking change** to the non-frozen relay surfaces specifically to close the window before external adopters existed: "Breaking once now, while there are no external adopters, protects future adopters from integrating against transient shapes." That is disciplined engineering and a good sign - but it also confirms ZAO would be among the first external adopters, with whatever that implies.

## Verdict for ZAO

| Question | Answer |
|----------|--------|
| Is the protocol well-built? | **Yes.** Clear trust boundaries, an explicit threat model that names its own weaknesses, deterministic test vectors, five language implementations, disciplined versioning |
| Is it private? | **No, not in the cryptographic sense.** Undisclosed-by-default with an honest host. Plan accordingly |
| Should ZAO implement SIWD now? | **No.** 0.x, no reference verifier, ZAO would be the first external implementer (see [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/) decision #3) |
| Should ZAO run a relay? | **Only as a spike.** It gets a verified copy of ZAO's own chains. It does not get censorship resistance |
| Does this replace Farcaster for ZAO? | **No.** It is explicitly "not a social protocol" - no feeds, no graph, no federation |
| Is there anything ZAO should copy? | **Yes - the proof/content split as a design pattern.** Publish verifiable proofs publicly while keeping content access-controlled. ZAO could apply that shape to Respect and contribution records without adopting DFOS at all |

## Also See

- [Doc 2122](../../farcaster/2122-dfos-platform-deep-july-2026/) - DFOS platform deep dive, SIWD flow detail
- [Doc 2124](../../business/2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/) - why the ledger was removed but the primitives kept
- [Doc 123](../../farcaster/123-dfos-dark-forest-protocol/) - original protocol notes (superseded by 2122)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Write ZAO's DFOS data-handling rule: what may and may not go in a DFOS space, given the relay operator can read stored blobs - one-pager in repo | @Zaal | Doc | 2026-08-16 |
| Run the Tier-3 spike: `dfos serve` on the Pi, ingest one identity + one content chain, confirm verification - findings appended here | @Zaal | Spike | 2026-08-31 |
| Prototype the proof/content split for ZAO Respect records (public verifiable proof, access-controlled detail) - design doc in repo | @Zaal | Doc | 2026-10-15 |
| Re-check whether a SIWD reference verifier has shipped and whether v1 has been declared final | @Zaal | Research | 2026-11-30 |

## Sources

- DFOS Protocol `llms-full.txt` (356,645 bytes, fetched 2026-07-29) [FULL] - the complete specification. Sections read in full for this doc: Why This Exists, Protocol Overview, Status, Philosophy, DID Method, Content Model, Web Relay, Document Gateway, Credentials, Sign In With DFOS, **Threat Model**, **Conformance**, CLI. The protocol site itself is a JS SPA that returns its shell to fetchers - `llms-full.txt` is the escalation Metalabel publishes for exactly this purpose
- [protocol.dfos.com](https://protocol.dfos.com/) [PARTIAL - SPA shell only via fetchers; all substantive content read from `llms-full.txt` above, which is the same corpus]
- [github.com/metalabel/dfos](https://github.com/metalabel/dfos) [FULL via GitHub API] - MIT, 29 stars, 2 forks, pushed 2026-07-21
- [Doc 2124](../../business/2124-metalabel-post-crypto-pivot-vs-zao-onchain-thesis/) [FULL] - key-custody context from Metalabel's own wallet-drain experience
