import json, urllib.request, time, datetime, urllib.parse
BASE="https://explorer.optimism.io/api/v2"; UA={"User-Agent":"Mozilla/5.0"}
TOK={"OG":"0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957","ZOR":"0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c"}
def get(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=25) as r: return json.load(r)
def scan(addr):
    weeks=set(); txs=set(); tss=[]; url=f"{BASE}/tokens/{addr}/transfers"; pages=0; npp=True
    while pages<200:
        d=get(url)
        for it in d.get("items",[]):
            txs.add(it.get("transaction_hash")); ts=it.get("timestamp")
            if ts:
                tss.append(ts); dt=datetime.datetime.fromisoformat(ts.replace("Z","+00:00")); w=dt.isocalendar(); weeks.add((w[0],w[1]))
        npp=d.get("next_page_params"); pages+=1
        if not npp: break
        q="&".join(f"{k}={urllib.parse.quote(str(v))}" for k,v in npp.items()); url=f"{BASE}/tokens/{addr}/transfers?{q}"; time.sleep(0.35)
    return {"weeks":weeks,"txs":len(txs),"earliest":min(tss) if tss else None,"latest":max(tss) if tss else None}
og=scan(TOK["OG"]); zor=scan(TOK["ZOR"])
union=og["weeks"]|zor["weeks"]
out={
 "verified":"2026-07-17 via Blockscout explorer.optimism.io token transfers (enumerated)",
 "og_erc20":{"distinct_weeks":len(og["weeks"]),"distinct_txs":og["txs"],"span":[og["earliest"],og["latest"]]},
 "zor_erc1155":{"distinct_weeks":len(zor["weeks"]),"distinct_txs":zor["txs"],"span":[zor["earliest"],zor["latest"]]},
 "combined_distinct_weeks_onchain_settlement":len(union),
 "overlap_weeks":len(og["weeks"]&zor["weeks"]),
}
print(json.dumps(out,indent=2))
