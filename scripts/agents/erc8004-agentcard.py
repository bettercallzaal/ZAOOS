#!/usr/bin/env python3
"""erc8004-agentcard - build + validate an ERC-8004 agent registration card for a ZAO
swarm agent. OFF-CHAIN only: it produces/validates the JSON that would live at an
agent's `agentURI` (the registration file). It does NOT touch a chain, a wallet, or
spend anything - registering on-chain (Identity Registry, ERC-721) is a separate,
Zaal-gated step.

ERC-8004 (Trustless Agents) gives each agent a portable ERC-721 identity + a
resolvable registration file, plus Reputation + Validation registries. This is the
concrete standard for Brandon's DreamNet trust layer (Identity -> Reputation ->
Validation) - see research docs 2225 (clawd/Austin Griffith) + 2184 (DreamNet).

Registration fields (per the EIP): type, name, description, image, services[]
(web/A2A/MCP/OASF/ENS/DID/email), x402Support, active, registrations[], supportedTrust.

CLI:
  erc8004-agentcard.py preset <zoe|zol|zai>        # a ready ZAO agent card
  erc8004-agentcard.py validate <file.json>        # check a card against ERC-8004
  erc8004-agentcard.py --selftest
"""
from __future__ import annotations
import argparse, json, sys

SERVICE_KINDS = {"web", "A2A", "MCP", "OASF", "ENS", "DID", "email"}
TRUST_MODELS = {"reputation", "crypto-economic", "TEE-attestation"}


def build_card(name: str, description: str, services: list[dict],
               x402: bool = False, active: bool = True,
               trust: list[str] | None = None, image: str | None = None) -> dict:
    """Build a well-formed ERC-8004 registration file (off-chain agent card)."""
    return {
        "type": "https://eips.ethereum.org/EIPS/eip-8004",
        "name": name,
        "description": description,
        "image": image or "",
        "services": services,
        "x402Support": bool(x402),
        "active": bool(active),
        # registrations[] is filled in AT REGISTRATION TIME (on-chain, gated):
        # {agentRegistry: "eip155:<chainId>:<contract>", agentId, agentWallet}
        "registrations": [],
        "supportedTrust": trust or ["reputation"],
    }


def validate(card: dict) -> list[str]:
    """Return a list of problems; empty list = a valid ERC-8004 card."""
    errs: list[str] = []
    for f in ("type", "name", "description", "services", "x402Support", "active", "supportedTrust"):
        if f not in card:
            errs.append(f"missing required field: {f}")
    if not isinstance(card.get("name"), str) or not card.get("name"):
        errs.append("name must be a non-empty string")
    svc = card.get("services")
    if not isinstance(svc, list):
        errs.append("services must be an array")
    else:
        for i, s in enumerate(svc):
            if not isinstance(s, dict) or "type" not in s or "url" not in s:
                errs.append(f"services[{i}] needs {{type, url}}")
            elif s["type"] not in SERVICE_KINDS:
                errs.append(f"services[{i}].type '{s['type']}' not in {sorted(SERVICE_KINDS)}")
    for t in card.get("supportedTrust", []):
        if t not in TRUST_MODELS:
            errs.append(f"supportedTrust '{t}' not in {sorted(TRUST_MODELS)}")
    if not isinstance(card.get("x402Support"), bool):
        errs.append("x402Support must be a boolean")
    # registrations, if present, must carry the on-chain triple
    for i, r in enumerate(card.get("registrations", [])):
        if not all(k in r for k in ("agentRegistry", "agentId")):
            errs.append(f"registrations[{i}] needs agentRegistry + agentId")
    return errs


PRESETS = {
    "zoe": lambda: build_card(
        "ZOE", "The ZAO orchestrator agent - concierge + autonomous fix-PR pipeline, PR-only and human-gated.",
        [{"type": "A2A", "url": "https://thezao.xyz/agents/zoe"},
         {"type": "web", "url": "https://useicm.com/api/objects/<zoe-box>/llm.txt"}],
        x402=False, trust=["reputation", "TEE-attestation"]),
    "zol": lambda: build_card(
        "ZOL", "The ZAO Farcaster social agent - reads free (keyless), drafts casts, writes via x402 micro-payment.",
        [{"type": "A2A", "url": "https://thezao.xyz/agents/zol"},
         {"type": "web", "url": "https://farcaster.xyz/zaal"}],
        x402=True, trust=["reputation"]),
    "zai": lambda: build_card(
        "ZAI", "The ZAO community agent - grounded public answers about the ZAO ecosystem.",
        [{"type": "A2A", "url": "https://thezao.xyz/agents/zai"}],
        x402=False, trust=["reputation"]),
}


def _selftest() -> int:
    for name, mk in PRESETS.items():
        card = mk()
        errs = validate(card)
        assert not errs, f"{name} card invalid: {errs}"
    # a broken card is caught
    bad = {"type": "x", "name": "", "services": [{"type": "carrier-pigeon", "url": "u"}],
           "x402Support": "yes", "active": True, "supportedTrust": ["vibes"]}
    errs = validate(bad)
    assert any("name must be" in e for e in errs), errs
    assert any("carrier-pigeon" in e for e in errs), errs
    assert any("x402Support must be a boolean" in e for e in errs), errs
    assert any("vibes" in e for e in errs), errs
    # round-trip a preset through JSON
    zoe = PRESETS["zoe"]()
    assert validate(json.loads(json.dumps(zoe))) == []
    # x402 + registrations round-trip
    zol = PRESETS["zol"]()
    zol["registrations"] = [{"agentRegistry": "eip155:8453:0xabc", "agentId": 42, "agentWallet": "0xdead"}]
    assert validate(zol) == [], validate(zol)
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="ERC-8004 agent-card builder/validator (off-chain, ZAO swarm)")
    sub = ap.add_subparsers(dest="cmd")
    pp = sub.add_parser("preset"); pp.add_argument("agent", choices=list(PRESETS))
    pv = sub.add_parser("validate"); pv.add_argument("file")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "preset":
        print(json.dumps(PRESETS[a.agent](), indent=2))
        return 0
    if a.cmd == "validate":
        try:
            card = json.load(open(a.file, encoding="utf-8"))
        except (OSError, ValueError) as e:
            print(f"could not read/parse {a.file}: {e}", file=sys.stderr); return 1
        errs = validate(card)
        if errs:
            print("INVALID ERC-8004 card:"); [print(f"  - {e}") for e in errs]; return 1
        print("valid ERC-8004 agent card"); return 0
    ap.print_help(); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
