# read-only: cost per wake for the seat, from its transcripts in the last 24h
import json,sys,glob,os,time,statistics as st,collections,re
R={("opus",5,5):(4,20,5,8,.20),("fable",5,1):(10,50,12.5,20,.25),("sonnet",5,5):(2,10,2.5,4,.10),("haiku",5,5):(1,5,1.25,2,.10)}
def rate(m):
    for (f,a,b),v in R.items():
        if f in m and f"{a}-{b}" in m: return v
    return None
cut=time.time()-86400; wakes=[]; cur=None; unpriced=set()
files=[f for f in glob.glob(sys.argv[1]+'/*.jsonl') if os.path.getmtime(f)>cut]
for f in files:
    msgs={}; order=[]
    for l in open(f):
        try:d=json.loads(l)
        except:continue
        ts=d.get('timestamp','')
        if d.get('type')=='user':
            c=d.get('message',{}).get('content')
            if isinstance(c,list) and any(isinstance(x,dict) and x.get('type')=='tool_result' for x in c): continue
            t=c if isinstance(c,str) else ' '.join(x.get('text','') for x in (c or []) if isinstance(x,dict))
            if not t.strip(): continue
            k='peer' if 'cross-session-message' in t or 'agent-message' in t else ('timer' if re.search(r'autonomous-loop|scheduled task|ScheduleWakeup|/loop|cron',t[:300],re.I) else 'other')
            cur={'k':k,'ts':ts,'ids':[],'tools':set()}; wakes.append(cur)
        elif d.get('type')=='assistant' and cur is not None:
            m=d.get('message',{}); i=m.get('id')
            if not i: continue
            if i not in msgs: cur['ids'].append(i)
            msgs[i]=m
            for x in m.get('content',[]) or []:
                if isinstance(x,dict) and x.get('type')=='tool_use': cur['tools'].add(x.get('name'))
    for w in wakes:
        if 'cost' in w: continue
        tot=0; cr=[]
        for i in w['ids']:
            m=msgs.get(i)
            if not m: continue
            r=rate(m.get('model','')); u=m.get('usage',{})
            if not r: unpriced.add(m.get('model')); continue
            tot+=(u.get('input_tokens',0)*r[0]+u.get('output_tokens',0)*r[1]+u.get('cache_creation_input_tokens',0)*r[3]+u.get('cache_read_input_tokens',0)*r[4])/1e6
            cr.append(u.get('cache_read_input_tokens',0))
        w['cost']=tot; w['calls']=len(w['ids']); w['cr']=cr
wakes=[w for w in wakes if w['ts'] and time.mktime(time.strptime(w['ts'][:19],'%Y-%m-%dT%H:%M:%S'))-time.timezone>cut]
print('files',len(files),'wakes',len(wakes),'unpriced',unpriced)
g=collections.defaultdict(list)
for w in wakes: g[w['k']].append(w)
allcr=[c for w in wakes for c in w['cr']]
for k,ws in g.items():
    cs=[w['cost'] for w in ws]
    print(f"{k:6} n={len(ws):4} total=${sum(cs):7.2f} median=${st.median(cs):.2f} p90=${sorted(cs)[int(len(cs)*.9)]:.2f} medcalls={st.median([w['calls'] for w in ws])}")
msgonly=[w for w in g['peer'] if w['tools'] and w['tools']<= {'SendMessage','ListAgents','ToolSearch'} or (w['k']=='peer' and not w['tools'])]
print('peer wakes with messaging-only or no tools:',len(msgonly),f"${sum(w['cost'] for w in msgonly):.2f}")
print('total',f"${sum(w['cost'] for w in wakes):.2f}",'median cache read per call',int(st.median(allcr)) if allcr else None,'max',max(allcr) if allcr else None)
