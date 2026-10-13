import json,urllib.request,sys,time,concurrent.futures as cf
U="https://base.gateway.tenderly.co"
C="0x6eee0a8ebd1446a3a77a8f720bf37232fd88b255";F="0xd97409d949d032a12bd4b7af1f94f7d3222c8e72"
START=int(sys.argv[2]); SPAN=int(sys.argv[3]); out=sys.argv[1]
def rpc(m,p):
    err=None
    for i in range(10):
        try:
            req=urllib.request.Request(U,data=json.dumps({"jsonrpc":"2.0","id":1,"method":m,"params":p}).encode(),headers={"Content-Type":"application/json","User-Agent":"Mozilla/5.0"})
            r=json.load(urllib.request.urlopen(req,timeout=40))
            if "result" in r: return r["result"]
            err=r.get("error")
        except Exception as e: err=str(e)
        time.sleep(2*(i+1))
    raise RuntimeError(f"FAILED {m} {p} {err}")
head=int(rpc("eth_blockNumber",[]),16)
def job(a): return a,rpc("eth_getLogs",[{"address":[C,F],"fromBlock":hex(a),"toBlock":hex(min(a+SPAN-1,head))}])
starts=list(range(START,head+1,SPAN)); n=0
with open(out,"w") as fh, cf.ThreadPoolExecutor(4) as ex:
    for i,(a,res) in enumerate(ex.map(job,starts)):
        for l in res: fh.write(json.dumps(l)+"\n"); n+=1
        if i%200==0: print(i,len(starts),n,flush=True)
print("DONE chunks",len(starts),"logs",n,"head",head,"start",START,flush=True)
