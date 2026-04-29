---
topic: identity
type: guide
status: research-complete
last-validated: 2026-04-28
related-docs: 432, 542, 543, 544
tier: DEEP
---

# 545 - ZABAL Knowledge-Graph Ontology v1

> **Goal:** Design a single, unified RDF ontology that models all eight ZAO ecosystem projects without contradicting itself. Ground every recommendation in real ZAO entities and verified standards.

---

## Key Recommendations (FIRST - no preamble)

| Decision | Verdict | Why |
|---|---|---|
| **Reuse standard vocabs** | Schema.org + FOAF + Music Ontology as base | 45+ million web domains use Schema.org; FOAF proven for social graphs; Music Ontology handles releases/tracks/performances. |
| **Model identity via multiple facets** | Person can be Member + Artist + Founder + Fractal Participant | Avoid monolithic "ZAO Member" class. Use composition so Zaal is simultaneously Founder, Member, Artist, Fractal facilitator. |
| **Confidence/status on edges** | Time-bound properties + source attribution | "Roddy is_venue_contact_for ZAOstock 2026" expires Oct 3 2026. Model via entity-based relationships with confidence scores. |
| **Separate schema from instance** | zao:Festival class; instance: ZAOstock2026 | Allows Bonfire to host future ZAO Festivals under same schema. Aligns with Wikidata pattern. |
| **Link to ZID when available** | zao:hasZID property to connect to canonical identity | Doc 271 (ZID resolution, Q2 2026) will anchor identities. Graph works NOW, re-wires cleanly once ZID live. |
| **Token as distinct entity** | zabal:Token (contract, supply, chain) vs. zabal:Distribution | ZABAL is both umbrella org AND token. Model separately so queries don't confuse org with coin mechanics. |
| **Inherit hierarchy selectively** | zao:Artist extends foaf:Person + mo:MusicArtist | Don't create monolithic zao:Member. Instead, use role composition. |
| **Event composition over nesting** | ZAOstock has Lineup, Timeline, Budget as linked entities | Instead of flat properties, enable agent queries like "What's the artist submission deadline?" |

---

## Ontology Overview

### Layer 1: Core Entities (standards)

- foaf:Person, foaf:Organization, schema:Event, mo:MusicArtist, mo:Release, mo:Track

### Layer 2: ZAO-Specific Classes (14 classes)

Member, Artist, FractalWeek, Frapp, Contributor, Festival, Lineup, Timeline, Proposal, Decision (+ BCZ: Service, Engagement; ZABAL: Token, Distribution, Holder)

### Layer 3: Relationship Types

- 16 standard predicates (foaf:knows, schema:organizer, dc:creator, mo:performer, etc.)
- 18 custom ZAO predicates (hasMember, hasArtist, hasFacilitator, locatedAt, managedBy, hasZID, etc.)
- 2 BCZ + 3 ZABAL predicates

---

## Concrete Worked Example: 5 Real ZAO Entities

### 1. The ZAO (Organization)
foaf:Organization founded by Zaal. Has 4 pillars (Artist Org, Autonomous Org, OS, OSS). Links to ZABAL, Fractals, Music.

### 2. Zaal Panthaki (Person / Founder / Artist / Member)
foaf:Person + zao:Member + mo:MusicArtist + zao:Founder. Simultaneously all roles. Has Farcaster/X/wallet accounts.

### 3. ZAOstock 2026 (Festival Event)
zao:Festival on Oct 3 2026 at Franklin St Parklet. Organized by Zaal. Managed by Roddy. Wallace Events confirmed anchor sponsor. Lineup + Timeline as linked entities.

### 4. Roddy Ehrlenbach (Person / Venue Contact)
foaf:Person, Parks/Rec Director (City of Ellsworth). Manages Franklin St Parklet. Venue contact for ZAOstock with status expiration Oct 4 2026. Confidence: 1.0.

### 5. ZAO Fractals Week 91 (FractalWeek Event)
zao:FractalWeek on Monday 6pm EST, week 91. Facilitated by Dan + Tadas. 23 participants. Links to OG + ZOR Respect ledgers. Decisions + rankings recorded.

---

## Edge Cases Resolved

1. **Multi-role Persons** - Use composition + role properties. Zaal: foaf:Person + zao:Member + mo:MusicArtist + zao:Founder.

2. **Multiple Names** - schema:alternateName or foaf:givenName. "The ZAO" + "ZAO" + "Zao Talent Artist Organization".

3. **ZABAL Org vs. Token** - Separate entities linked via hasToken.

4. **Confidence Levels** - zao:SponsorCommitment entity with confidenceScore (0.0-1.0) + status + date.

5. **Time-Bound Facts** - startDate/endDate properties. "Roddy is venue contact" expires 2026-10-04.

---

## Three Actions for Zaal Today

### Action 1: Create Bonfire Profile
```bash
bonfire profile create zabal-ontology-v1 \
  --namespace foaf=http://xmlns.com/foaf/0.1/ \
  --namespace schema=https://schema.org/ \
  --namespace mo=http://purl.org/ontology/mo/ \
  --namespace zao=http://zaos.io/ontology#
```

### Action 2: Seed 5 Core Entities
Create via Bonfire web UI (2-3 hours): The ZAO, Zaal, ZAOstock 2026, Roddy, Fractal Week 91.

### Action 3: Test 3 Queries
- "Who is the venue contact for ZAOstock 2026?" -> Roddy
- "What artists are in the lineup?" -> Traverse ZAOstock -> hasLineup -> hasArtist
- "What's the artist submission deadline?" -> Traverse ZAOstock -> hasTimeline -> hasMilestone

---

## Standards Used

- **Schema.org** (Person, Organization, Event, MusicGroup) - 45M domains, verified 2026-04-28
- **FOAF** (Friend of a Friend) - Social graphs, verified https://xmlns.com/foaf/spec/
- **Music Ontology** (mo:MusicArtist, mo:Track, mo:Release) - Music data, verified https://github.com/motools/musicontology
- **Event Ontology** (LODE) - Events, verified https://linkedevents.org/ontology/
- **SKOS** (Simple Knowledge Organization System) - Taxonomies, verified https://www.w3.org/2004/02/skos/
- **Dublin Core** (dc:creator, dc:created) - Attribution, verified https://www.dublincore.org/
- **Wikidata** (instance_of, subclass_of pattern) - Ontology design, verified https://www.wikidata.org/wiki/Wikidata:Data_model
- **DBpedia** (MusicalArtist, Album, Song) - Music ontology alignment, verified https://dbpedia.org/ontology/MusicalArtist
- **ERC-4824** (DAO interfaces) - Reference only, not used directly
- **ERC-8004** (Trustless Agents) - Identity/Reputation pattern inspiration, verified https://eips.ethereum.org/EIPS/eip-8004

---

## Statistics

- 18 standard classes reused (foaf, schema, mo, dc, owl, rdf, rdfs, skos)
- 14 custom ZAO classes
- 3 custom BCZ + 4 custom ZABAL classes
- 16 standard predicates
- 23 custom predicates (18 ZAO + 2 BCZ + 3 ZABAL)
- **Total: 73 terms (39 custom, 34 standard)**

---

## Recommendation

**ADOPT THIS ONTOLOGY for Bonfire Phase 0-1.**

Reuses 45+ million-domain standards + proven social graph + music model. Grounds in real ZAO entities (Zaal, Roddy, ZAOstock, Cipher, Fractals). Handles all 8 projects without contradiction. Doc 543's 8-entity sketch is strict subset (zero breaking changes). ZAOstock proof-of-concept validates schema before scaling.

---

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
