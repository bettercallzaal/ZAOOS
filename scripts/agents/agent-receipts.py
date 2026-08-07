#!/usr/bin/env python3
"""agent-receipts - hash-chained action receipts + scoped reputation for ZAO agents.

Brandon's "receiptable by design" (every consequential action emits a verifiable
receipt: who / what / evidence / outcome / prev-hash -> current-hash = an append-only
tamper-evident chain) made into a standalone off-chain primitive, shaped like the
ERC-8004 Reputation registry (context-scoped reputation derived from receipts). Pairs
with erc8004-agentcard.py (identity) - identity + receipts + reputation = the DreamNet
trust chain (docs 2184 / 2225 / 2226), off-chain.

OFF-CHAIN only: a JSONL ledger, no chain/wallet/spend. Anchoring the chain head
on-chain (a Merkle root / an ERC-8004 Reputation registry write) is a separate,
Zaal-gated step.

CLI:
  agent-receipts.py emit <agent_id> <action> <context> <success|fail> [evidence...] [--witness W]
  agent-receipts.py verify <agent_id>              # is the hash chain intact?
  agent-receipts.py rep <agent_id> [--context C] [--trust A B ...]  # reputation, optionally
                                                   # truster-scoped to a local web-of-trust
  agent-receipts.py --selftest
Env: AGENT_RECEIPTS_PATH (default ~/.zao/agent-receipts/ledger.jsonl)
"""
from __future__ import annotations
import argparse, hashlib, json, os, sys
from datetime import datetime, timezone

GENESIS = "0" * 64


def _path() -> str:
    return os.environ.get("AGENT_RECEIPTS_PATH") or os.path.join(
        os.path.expanduser("~"), ".zao", "agent-receipts", "ledger.jsonl")


def _read() -> list[dict]:
    try:
        with open(_path(), encoding="utf-8") as fh:
            out = []
            for l in fh:
                if l.strip():
                    try:
                        out.append(json.loads(l))
                    except ValueError:
                        continue  # skip a corrupt line, never crash the ledger
            return out
    except OSError:
        return []


def _hash(r: dict) -> str:
    # deterministic hash over the receipt's content + the previous hash (the chain link).
    # `witness` is inside the hash so who-vouched is tamper-evident, not forgeable after emit.
    payload = "|".join(str(r.get(k, "")) for k in
                       ("seq", "ts", "agent_id", "action", "context", "outcome",
                        "evidence_hash", "witness", "prev_hash"))
    return hashlib.sha256(payload.encode()).hexdigest()


def _chain_head(rows: list[dict], agent_id: str) -> str:
    mine = [r for r in rows if r["agent_id"] == agent_id]
    return mine[-1]["hash"] if mine else GENESIS


def emit(agent_id: str, action: str, context: str, outcome: str,
         evidence: str = "", now: str | None = None, witness: str = "") -> dict:
    """Emit a receipt. `witness` (optional) is a third party who vouches for this
    receipt - the address/id that makes it more than self-report. It feeds the
    truster-scoped reputation below (a local web-of-trust, per clawd claude-p-attest,
    doc 2229): a truster counts only receipts witnessed by someone it believes."""
    rows = _read()
    seq = sum(1 for r in rows if r["agent_id"] == agent_id) + 1
    r = {
        "seq": seq,
        "ts": now or datetime.now(timezone.utc).isoformat(),
        "agent_id": agent_id,
        "action": action,
        "context": context,
        "outcome": "success" if outcome == "success" else "fail",
        "evidence_hash": hashlib.sha256(evidence.encode()).hexdigest() if evidence else "",
        "witness": witness,  # third-party voucher (optional); tamper-evident via _hash
        "prev_hash": _chain_head(rows, agent_id),
    }
    r["hash"] = _hash(r)
    os.makedirs(os.path.dirname(_path()), exist_ok=True)
    with open(_path(), "a", encoding="utf-8") as fh:
        fh.write(json.dumps(r) + "\n")
    return r


def verify_chain(agent_id: str) -> tuple[bool, int | None]:
    """Return (ok, first_bad_seq). Detects a tampered receipt OR a broken link."""
    mine = [r for r in _read() if r["agent_id"] == agent_id]
    prev = GENESIS
    for r in mine:
        if r.get("prev_hash") != prev:
            return False, r["seq"]  # link broken (insert/delete/reorder)
        if _hash(r) != r.get("hash"):
            return False, r["seq"]  # content tampered
        prev = r["hash"]
    return True, None


def reputation(agent_id: str, context: str | None = None,
               trust_set: set[str] | None = None) -> dict:
    """Reputation derived from the receipts (ERC-8004 Reputation-shaped), context-scoped
    and optionally TRUSTER-SCOPED.

    Reputation is not a global score. clawd's claude-p-attest (doc 2229) makes trust
    LOCAL: "TRUSTED" means on YOUR trust list, there is no universal number. So when
    `trust_set` is given, only receipts whose `witness` is in that set are counted -
    the reputation of `agent_id` AS SEEN BY a truster who believes those witnesses.
    Without `trust_set`, this is the old global (self-reported) view - which is exactly
    why it can be gamed, and why a truster should pass a set."""
    mine = [r for r in _read() if r["agent_id"] == agent_id and (context is None or r["context"] == context)]
    if trust_set is not None:
        trust_set = {w.lower() for w in trust_set}
        mine = [r for r in mine if str(r.get("witness", "")).lower() in trust_set]
    total = len(mine)
    ok = sum(1 for r in mine if r["outcome"] == "success")
    chain_ok, _ = verify_chain(agent_id)
    return {"agent_id": agent_id, "context": context or "*", "receipts": total,
            "success": ok, "rate": round(ok / total, 3) if total else None,
            "chain_verified": chain_ok,
            "truster_scoped": trust_set is not None}


def _selftest() -> int:
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        os.environ["AGENT_RECEIPTS_PATH"] = os.path.join(td, "l.jsonl")
        r1 = emit("zoe", "open-pr", "code-review", "success", "pr#2911", now="2026-01-01T00:00:00Z")
        r2 = emit("zoe", "open-pr", "code-review", "fail", "pr#bad", now="2026-01-01T00:01:00Z")
        r3 = emit("zoe", "post", "social", "success", "cast", now="2026-01-01T00:02:00Z")
        emit("zol", "cast", "social", "success", now="2026-01-01T00:03:00Z")
        assert r2["prev_hash"] == r1["hash"], "chain link"
        assert r3["seq"] == 3, "per-agent seq"
        ok, bad = verify_chain("zoe")
        assert ok and bad is None, f"clean chain should verify: {bad}"
        # scoped reputation
        rep = reputation("zoe", context="code-review")
        assert rep["receipts"] == 2 and rep["success"] == 1 and rep["rate"] == 0.5, rep
        assert reputation("zoe")["receipts"] == 3, "all-context"
        assert reputation("zol", "social")["rate"] == 1.0, "zol"
        # TRUSTER-SCOPED reputation (local web-of-trust, doc 2229). New agent + witnesses.
        emit("dealer", "trade", "market", "success", witness="0xAAA", now="2026-01-02T00:00:00Z")
        emit("dealer", "trade", "market", "success", witness="0xAAA", now="2026-01-02T00:01:00Z")
        emit("dealer", "trade", "market", "fail",    witness="0xBBB", now="2026-01-02T00:02:00Z")
        emit("dealer", "trade", "market", "success", witness="",     now="2026-01-02T00:03:00Z")  # self-reported, no witness
        # global (self-reported) view: 3/4 = 0.75 - includes the unwitnessed one
        g = reputation("dealer", context="market")
        assert g["receipts"] == 4 and g["rate"] == 0.75 and g["truster_scoped"] is False, g
        # a truster who believes ONLY 0xAAA: sees 2 receipts, both success -> 1.0
        t_aaa = reputation("dealer", context="market", trust_set={"0xaaa"})
        assert t_aaa["receipts"] == 2 and t_aaa["rate"] == 1.0 and t_aaa["truster_scoped"] is True, t_aaa
        # a truster who believes 0xBBB: sees 1 receipt, a fail -> 0.0 (different truster, different view)
        t_bbb = reputation("dealer", context="market", trust_set={"0xBBB"})  # case-insensitive
        assert t_bbb["receipts"] == 1 and t_bbb["rate"] == 0.0, t_bbb
        # a truster who believes nobody relevant: sees 0 receipts (honest "unknown", rate None)
        assert reputation("dealer", context="market", trust_set={"0xZZZ"})["rate"] is None
        # the point: global 0.75 != truster(0xAAA) 1.0 != truster(0xBBB) 0.0 - trust is LOCAL
        assert g["rate"] != t_aaa["rate"] != t_bbb["rate"], "truster-scoping must change the score"
        # witness is tamper-evident: flipping a witness breaks the chain hash
        assert verify_chain("dealer")[0] is True, "dealer chain clean before tamper"
        # TAMPER: rewrite the ledger flipping zoe's failed receipt to success
        p = _path()
        lines = open(p).read().splitlines()
        rows = [json.loads(l) for l in lines]
        for row in rows:
            if row["agent_id"] == "zoe" and row["seq"] == 2:
                row["outcome"] = "success"  # tamper - hash no longer matches
        open(p, "w").write("\n".join(json.dumps(r) for r in rows) + "\n")
        ok2, bad2 = verify_chain("zoe")
        assert not ok2 and bad2 == 2, f"tamper must be caught at seq 2: {ok2},{bad2}"
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="agent-receipts - hash-chained receipts + scoped reputation")
    sub = ap.add_subparsers(dest="cmd")
    pe = sub.add_parser("emit")
    for f in ("agent_id", "action", "context", "outcome"):
        pe.add_argument(f)
    pe.add_argument("evidence", nargs="*", default=[])
    pe.add_argument("--witness", default="", help="third party who vouches for this receipt")
    pv = sub.add_parser("verify"); pv.add_argument("agent_id")
    pr = sub.add_parser("rep"); pr.add_argument("agent_id"); pr.add_argument("--context")
    pr.add_argument("--trust", nargs="*", default=None,
                    help="truster-scope: only count receipts witnessed by these (local web-of-trust)")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "emit":
        print(json.dumps(emit(a.agent_id, a.action, a.context, a.outcome, " ".join(a.evidence), witness=a.witness), indent=2)); return 0
    if a.cmd == "verify":
        ok, bad = verify_chain(a.agent_id)
        print("chain OK" if ok else f"TAMPERED at seq {bad}"); return 0 if ok else 1
    if a.cmd == "rep":
        ts = set(a.trust) if a.trust is not None else None
        print(json.dumps(reputation(a.agent_id, a.context, trust_set=ts), indent=2)); return 0
    ap.print_help(); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
