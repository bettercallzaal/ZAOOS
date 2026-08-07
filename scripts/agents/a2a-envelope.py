#!/usr/bin/env python3
"""a2a-envelope - MAC-authenticated agent-to-agent message envelope (off-chain).

The message layer of the ZAO swarm trust chain. An agent seals a message that
references BOTH its identity (an ERC-8004 agent-card ref, from erc8004-agentcard.py
#2912) AND the receipt of the action the message is about (a receipt hash from
agent-receipts.py #2913). The receiver verifies the envelope is untampered and
originates from a holder of the shared key, then can follow card_ref -> who, and
receipt_hash -> what/whether it really happened.

identity (#2912) + receipts+reputation (#2913) + THIS envelope = a message you can
trust: you know who sent it, that it wasn't altered, and the action it claims is
receipted. That is the DreamNet trust chain applied to a single message.

AUTH MODEL - be honest about it: this is a shared-key MAC (HMAC-SHA256), i.e. origin
authentication + tamper-evidence between parties who share a key. It is NOT a
public-key signature - anyone with the key can both seal and verify. The public-key /
on-chain upgrade (ed25519 keypair per agent, verify with the agent-card's public key)
is a separate, Zaal-gated step; the envelope shape is designed so `mac` swaps to `sig`
without changing the payload. OFF-CHAIN only: no wallet, no spend, no network.

CLI:
  a2a-envelope.py seal <from> <to> <body> --key K [--card-ref R] [--receipt-hash H]
  a2a-envelope.py open <envelope.json> --key K
  a2a-envelope.py --selftest
"""
from __future__ import annotations
import argparse, hashlib, hmac, json, sys
from datetime import datetime, timezone

VERSION = "a2a/1"


def _canonical(env: dict) -> bytes:
    # the exact, ordered set of fields the MAC covers - everything but the mac itself
    parts = [env["v"], env["from"], env["to"], env["body"],
             env.get("card_ref", ""), env.get("receipt_hash", ""), env["ts"]]
    return "\x1f".join(parts).encode()  # unit-separator: unambiguous, can't collide via body content


def _mac(env: dict, key: str) -> str:
    return hmac.new(key.encode(), _canonical(env), hashlib.sha256).hexdigest()


def seal(from_id: str, to_id: str, body: str, key: str,
         card_ref: str = "", receipt_hash: str = "", now: str | None = None) -> dict:
    if not key:
        raise ValueError("a shared key is required to seal an envelope")
    env = {
        "v": VERSION,
        "from": from_id,
        "to": to_id,
        "body": body,
        "card_ref": card_ref,      # ERC-8004 agent-card ref (identity, #2912)
        "receipt_hash": receipt_hash,  # receipt chain hash the msg is about (#2913)
        "ts": now or datetime.now(timezone.utc).isoformat(),
    }
    env["mac"] = _mac(env, key)
    return env


def open_env(env: dict, key: str) -> tuple[bool, str | None]:
    """Return (ok, body). ok is True only if the MAC verifies with `key`.
    Uses constant-time compare so a bad key/tamper leaks no timing signal."""
    if not isinstance(env, dict) or env.get("v") != VERSION or "mac" not in env:
        return False, None
    try:
        expected = _mac(env, key)
    except KeyError:
        return False, None  # malformed envelope missing a MAC'd field
    if not hmac.compare_digest(expected, env["mac"]):
        return False, None
    return True, env["body"]


def _selftest() -> int:
    KEY = "shared-secret-zoe-zol"
    env = seal("zoe", "zol", "review of PR #2913 passed",
               key=KEY, card_ref="icm_zoe_card", receipt_hash="abc123",
               now="2026-01-01T00:00:00Z")
    # 1. right key opens, returns the body
    ok, body = open_env(env, KEY)
    assert ok and body == "review of PR #2913 passed", (ok, body)
    # 2. wrong key fails closed
    ok2, _ = open_env(env, "wrong-key")
    assert not ok2, "wrong key must fail"
    # 3. tampered body fails (MAC no longer matches)
    tampered = dict(env); tampered["body"] = "review of PR #2913 FAILED"
    ok3, _ = open_env(tampered, KEY)
    assert not ok3, "tampered body must fail"
    # 4. tampered receipt_hash fails (the action-reference is MAC'd, not just the body)
    t2 = dict(env); t2["receipt_hash"] = "deadbeef"
    ok4, _ = open_env(t2, KEY)
    assert not ok4, "tampered receipt_hash must fail"
    # 5. stripped mac / wrong version fails
    assert open_env({"v": VERSION, "from": "x", "to": "y", "body": "b", "ts": "t"}, KEY)[0] is False
    assert open_env({**env, "v": "a2a/0"}, KEY)[0] is False, "version mismatch must fail"
    # 6. two different bodies never share a MAC (sanity on canonicalization)
    e_a = seal("a", "b", "hello", key=KEY, now="2026-01-01T00:00:00Z")
    e_b = seal("a", "b", "hellp", key=KEY, now="2026-01-01T00:00:00Z")
    assert e_a["mac"] != e_b["mac"], "distinct bodies must produce distinct MACs"
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="a2a-envelope - MAC-authenticated agent message envelope")
    sub = ap.add_subparsers(dest="cmd")
    ps = sub.add_parser("seal")
    for f in ("from_id", "to_id", "body"):
        ps.add_argument(f)
    ps.add_argument("--key", required=True)
    ps.add_argument("--card-ref", default="")
    ps.add_argument("--receipt-hash", default="")
    po = sub.add_parser("open")
    po.add_argument("envelope")
    po.add_argument("--key", required=True)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "seal":
        env = seal(a.from_id, a.to_id, a.body, a.key, a.card_ref, a.receipt_hash)
        print(json.dumps(env, indent=2)); return 0
    if a.cmd == "open":
        with open(a.envelope, encoding="utf-8") as fh:
            env = json.load(fh)
        ok, body = open_env(env, a.key)
        if ok:
            print(json.dumps({"verified": True, "from": env["from"], "body": body,
                              "card_ref": env.get("card_ref"), "receipt_hash": env.get("receipt_hash")}, indent=2))
            return 0
        print(json.dumps({"verified": False}, indent=2)); return 1
    ap.print_help(); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
