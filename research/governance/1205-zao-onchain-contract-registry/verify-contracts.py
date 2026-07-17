import json, urllib.request
UA={"User-Agent":"Mozilla/5.0"}
def get(url):
    try:
        with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=20) as r: return json.load(r)
    except Exception as e: return {"_err":str(e)[:60]}
# (label, addr, chain, blockscout base)
OP="https://explorer.optimism.io/api/v2"; BASE="https://base.blockscout.com/api/v2"
C=[
 ("OG Respect","0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957","Optimism",OP,"token"),
 ("ZOR Respect","0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c","Optimism",OP,"token"),
 ("OREC executor","0xcB05F9254765CA521F7698e61E0A6CA6456Be532","Optimism",OP,"addr"),
 ("ZOUNZ (ZABAL Nouns DAO)","0xCB80Ef04DA68667c9a4450013BDD69269842c883","Base",BASE,"token"),
 ("ZABAL token","0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07","Base?",BASE,"token"),
]
for label,addr,chain,base,kind in C:
    if kind=="token":
        d=get(f"{base}/tokens/{addr}")
        if "_err" in d or not d.get("type"):
            # maybe wrong chain - try optimism for the ZABAL '?'
            d2=get(f"{OP}/tokens/{addr}") if base==BASE else {}
            if d2.get("type"): d,chain=d2,"Optimism"
        print(f"{label:26} {addr}  {chain:9} type={d.get('type')} name={d.get('name')} holders={d.get('holders_count')} supply={d.get('total_supply')}")
    else:
        d=get(f"{base}/addresses/{addr}")
        print(f"{label:26} {addr}  {chain:9} is_contract={d.get('is_contract')} verified={d.get('is_verified')} name={d.get('name')}")
