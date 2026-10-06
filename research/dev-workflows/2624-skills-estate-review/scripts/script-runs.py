import json,os,sys,collections
from datetime import datetime,timedelta,timezone
from multiprocessing import Pool
ROOT=os.path.expanduser("~/.claude/projects"); NOW=datetime.now(timezone.utc)
CUT=(NOW-timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%S")
MARK=[b"clipboard-emit.sh",b"zao-tclip",b"handoff-build.sh",b"zao-skill-audit",b"zao-fleet-status"]
def scan(p):
    out=[]
    try: fh=open(p,"rb")
    except OSError: return out
    with fh:
        for line in fh:
            if b'"name":"Bash"' not in line: continue
            hit=[m for m in MARK if m in line]
            if not hit: continue
            try: r=json.loads(line)
            except Exception: continue
            if (r.get("timestamp") or "")[:19]<CUT: continue
            m=r.get("message") or {}
            for it in (m.get("content") or []):
                if isinstance(it,dict) and it.get("type")=="tool_use" and it.get("name")=="Bash":
                    cmd=str((it.get("input") or {}).get("command",""))
                    for mk in MARK:
                        k=mk.decode()
                        if k in cmd: out.append((k,it.get("id"),r.get("timestamp","")[:10],p.split(os.sep)[len(ROOT.split(os.sep))], cmd[:160] if k=="zao-tclip" else ""))
    return out
if __name__=="__main__":
    cm=(NOW-timedelta(days=31)).timestamp()
    files=[os.path.join(b,f) for b,_,fs in os.walk(ROOT) for f in fs if f.endswith(".jsonl") and os.path.getmtime(os.path.join(b,f))>=cm]
    with Pool(8) as pool: res=pool.map(scan,files,chunksize=20)
    seen=set(); c=collections.Counter(); proj=collections.defaultdict(collections.Counter); days=collections.defaultdict(collections.Counter); sub=collections.Counter()
    for rs in res:
        for k,i,d,p,cmd in rs:
            if (k,i) in seen: continue
            seen.add((k,i)); c[k]+=1; proj[k][p.split("-")[-1]]+=1; days[k][d]+=1
            if k=="zao-tclip":
                import re; m=re.search(r"zao-tclip\s+(?:--\S+\s+)*([a-z]+)",cmd); sub[m.group(1) if m else "?"]+=1
    print("files",len(files)); print(c)
    for k in ("clipboard-emit.sh","zao-tclip"):
        print(k,"projects:",proj[k].most_common(8)); print("  first/last day:",min(days[k]) if days[k] else None,max(days[k]) if days[k] else None,"| distinct days",len(days[k]))
    print("zao-tclip subcommands:",sub.most_common()); print("zao-tclip by day:",sorted(days["zao-tclip"].items()))
