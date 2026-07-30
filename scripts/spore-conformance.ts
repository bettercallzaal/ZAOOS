/**
 * DreamNet Spore Phase 3 - executable conformance runner.
 *
 * Runs the full bidirectional cross-runtime verification against the
 * permanent fixtures (src/lib/spore/__tests__/fixtures/), and - when
 * SPORE_SDK_PATH points at a checkout of BrandonDucar/dreamnet-spore-sdk -
 * ALSO executes the DreamNet runtime live in both directions.
 *
 * Exists because the app-side vitest is currently broken (rolldown native
 * binding); this runner is the executable gate: `npx tsx scripts/spore-conformance.ts`.
 * Exit code 0 = conformant; 1 = any failure (fail closed).
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalize, sha256Hex, createObservation } from '../src/lib/eyes';
import { observationToSpore, sporeContentHash } from '../src/lib/spore/spore';
import { sporeToReceipt, verifyReceipt, computeReceiptDigest } from '../src/lib/spore/receipt';
import {
  toDreamNetReceipt,
  verifyDreamNetReceipt,
  verifyDreamNetArtifact,
  computeDreamNetReceiptDigest,
} from '../src/lib/spore/interop';
import { SPORE_HASH_ALG } from '../src/lib/spore/types';

const here = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(
  readFileSync(join(here, '..', 'src', 'lib', 'spore', '__tests__', 'fixtures', 'cross-runtime-vectors.json'), 'utf8'),
);

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

console.log(`Spore Phase 3 conformance - fixtures from SDK ${vectors._meta.sdkCommit}\n`);

// 1. Canonical bytes + hashes (DreamNet-generated, ZAO recomputes)
for (const v of vectors.canonicalization) {
  const bytes = canonicalize(v.input);
  check(`canonical bytes: ${v.name}`, bytes === v.dreamnetCanonicalJson, `got ${bytes}`);
  check(`sha256: ${v.name}`, sha256Hex(bytes) === v.dreamnetSha256);
}

// 2. Fail-closed on non-finite
for (const label of ['NaN', 'Infinity', '-Infinity']) {
  const v = label === 'NaN' ? NaN : label === 'Infinity' ? Infinity : -Infinity;
  let threw = false;
  try {
    canonicalize({ a: v });
  } catch {
    threw = true;
  }
  check(`fail-closed non-finite: ${label}`, threw);
}

// 3. DreamNet -> ZAO
check('ZAO verifies DreamNet proof-artifact.v1', verifyDreamNetArtifact(vectors.dreamnetArtifact).isValid);
check(
  'ZAO verifies DreamNet receipt.v1 (digest + content)',
  verifyDreamNetReceipt(vectors.dreamnetReceipt, vectors.dreamnetReceiptSubject).isValid,
);
check(
  'tamper reject: artifact payload',
  !verifyDreamNetArtifact({
    ...vectors.dreamnetArtifact,
    evidenceData: { ...vectors.dreamnetArtifact.evidenceData, task: 'FORGED' },
  }).isValid,
);
check(
  'tamper reject: receipt issuer',
  !verifyDreamNetReceipt({ ...vectors.dreamnetReceipt, issuerId: 'organism:attacker:evil' }, vectors.dreamnetReceiptSubject).isValid,
);
check(
  'tamper reject: receipt subjectHash',
  !verifyDreamNetReceipt({ ...vectors.dreamnetReceipt, subjectHash: 'f'.repeat(64) }, vectors.dreamnetReceiptSubject).isValid,
);
check(
  'tamper reject: receipt digest',
  !verifyDreamNetReceipt({ ...vectors.dreamnetReceipt, digest: 'f'.repeat(64) }, vectors.dreamnetReceiptSubject).isValid,
);
check(
  'fail closed: unsupported schema receipt.v2',
  !verifyDreamNetReceipt({ ...vectors.dreamnetReceipt, schemaVersion: 'receipt.v2' }, vectors.dreamnetReceiptSubject).isValid,
);

// 4. ZAO -> DreamNet (DreamNet-recomputed values pinned in fixtures)
const { subject, issuer, subjectHashByDreamnet, digestInputHashByDreamnet } = vectors.zaoDirection;
check(
  'DreamNet reproduced ZAO spore content hash',
  sporeContentHash(subject) === `${SPORE_HASH_ALG}:${subjectHashByDreamnet}`,
);
const obs = createObservation(
  {
    sensor: 'sensor:conformance',
    kind: subject.kind,
    subjectKey: subject.subjectKey,
    payload: subject.payload,
    confidence: 1,
    provenance: { method: 'api' },
    health: { status: 'healthy', latencyMs: 1, errorRate: 0, lastOkAt: null, consecutiveFailures: 0 },
  },
  { observerId: 'observer:conformance', now: '2026-07-30T00:00:00.000Z' },
);
const zaoReceipt = sporeToReceipt(observationToSpore(obs), issuer, { now: '2026-07-30T00:00:00.000Z' });
check('ZAO self-verify receipt', verifyReceipt(zaoReceipt));
check(
  'DreamNet reproduced ZAO receipt digest',
  computeReceiptDigest(zaoReceipt.spore, issuer) === `${SPORE_HASH_ALG}:${digestInputHashByDreamnet}`,
);
const dnShape = toDreamNetReceipt(zaoReceipt);
check(
  'ZAO receipt round-trips into SDK receipt.v1 shape and verifies',
  verifyDreamNetReceipt(dnShape, { kind: subject.kind, subjectKey: subject.subjectKey, payload: subject.payload }).isValid,
);
check(
  'interop digest deterministic',
  dnShape.digest === computeDreamNetReceiptDigest(issuer, subjectHashByDreamnet),
);

// 5. LIVE bidirectional (optional): execute the DreamNet runtime itself.
const sdkPath = process.env.SPORE_SDK_PATH;
async function liveSdk() {
  if (!sdkPath) {
    console.log('\n(SPORE_SDK_PATH not set - skipping live SDK execution; fixture proof stands.)');
    return;
  }
  const contracts = await import(join(sdkPath, 'src', 'contracts', 'index.ts'));
  // Live: DreamNet recomputes ZAO bytes for every vector.
  for (const v of vectors.canonicalization) {
    check(`LIVE sdk bytes match: ${v.name}`, contracts.canonicalJsonStringify(v.input) === canonicalize(v.input));
  }
  // Live: DreamNet recomputes the ZAO receipt digest input.
  const liveDigest = contracts.computeCanonicalHash({
    contentHash: zaoReceipt.spore.contentHash,
    issuer,
    kind: subject.kind,
    subjectKey: subject.subjectKey,
  });
  check('LIVE sdk recomputes ZAO receipt digest', `${SPORE_HASH_ALG}:${liveDigest}` === zaoReceipt.digest);
  // Live: DreamNet verifies the mapped receipt.v1 digest with its own hasher.
  const liveInteropDigest = contracts.computeCanonicalHash({ issuer, subjectHash: dnShape.subjectHash });
  check('LIVE sdk recomputes interop receipt.v1 digest', liveInteropDigest === dnShape.digest);
}

liveSdk()
  .catch((e: unknown) => {
    fail++;
    console.error(`FAIL  live SDK execution errored - ${e instanceof Error ? e.message : String(e)}`);
  })
  .finally(() => {
    console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
    if (fail > 0) process.exit(1);
  });
