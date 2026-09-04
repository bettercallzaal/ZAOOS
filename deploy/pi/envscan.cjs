// deploy/pi/envscan.cjs - exact process.env inventory over the ZOE import graph.
// Regenerate (from bot/):
//   ../node_modules/.bin/esbuild src/zoe/index.ts --bundle --platform=node --format=esm \
//     --packages=external --outfile=/dev/null --metafile=/tmp/meta.json
//   node -e "const m=require(\"/tmp/meta.json\");require(\"fs\").writeFileSync(\"/tmp/graph.txt\",Object.keys(m.inputs).filter(k=>!k.includes(\"node_modules\")).join(\"\\n\"))"
//   node ../deploy/pi/envscan.cjs /tmp "$PWD"      # reads /tmp/graph.txt, writes /tmp/env-exact.tsv
// Used 2026-08-27 to build requirements.md section 4. Read-only.
const fs = require('fs');
const path = require('path');
const S = process.argv[2];
const BOT = process.argv[3];
const files = fs.readFileSync(path.join(S, 'graph.txt'), 'utf8').split('\n').filter(Boolean);
const re = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\])/g;
const byVar = new Map();
let dynamic = [];
for (const f of files) {
  const src = fs.readFileSync(path.join(BOT, f), 'utf8');
  let m;
  while ((m = re.exec(src))) {
    const v = m[1] || m[2];
    if (!byVar.has(v)) byVar.set(v, new Set());
    byVar.get(v).add(f);
  }
  // dynamic reads like process.env[n]
  const dyn = src.match(/process\.env\[[a-zA-Z_]/g);
  if (dyn) dynamic.push(`${f} (${dyn.length})`);
}
const secretRe = /(KEY|TOKEN|SECRET|PRIVATE|PASSWORD|CREDENTIAL)/;
const rows = [...byVar.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([v, fs_]) => {
  const files_ = [...fs_].sort().map(x => x.replace(/^src\//, '')).join(', ');
  return `${v}\t${secretRe.test(v) ? 'SECRET' : '-'}\t${files_}`;
});
fs.writeFileSync(path.join(S, 'env-exact.tsv'), rows.join('\n') + '\n');
console.log('distinct vars:', byVar.size, ' secrets-by-name:', rows.filter(r => r.includes('\tSECRET\t')).length);
console.log('dynamic process.env[...] reads:', dynamic.join('; ') || 'none');
console.log(rows.join('\n'));
