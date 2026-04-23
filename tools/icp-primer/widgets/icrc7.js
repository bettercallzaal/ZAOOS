import { Actor } from 'https://esm.sh/@dfinity/agent@2';
import { IDL } from 'https://esm.sh/@dfinity/candid@2';
import { getAnonymousAgent } from './state.js';
import { wrapCall } from './error.js';

// Candidate mainnet ICRC-7 canisters. If a given canister doesn't implement
// the full ICRC-7 surface the widget will show the error for that collection
// and let the user pick another. Update this list during manual verification.
const COLLECTIONS = [
  { id: '6uwoh-vaaaa-aaaap-ahjvq-cai', label: 'ICRC-7 collection A (verify live)' },
  { id: 'vvimt-yqaaa-aaaal-amjda-cai', label: 'ICRC-7 collection B (verify live)' },
  { id: 'jzg4e-6iaaa-aaaal-ajvsa-cai', label: 'ICRC-7 collection C (verify live)' },
];

const idlFactory = ({ IDL }) => {
  // Minimal Value variant - covers the common metadata payloads we render.
  const Value = IDL.Rec();
  Value.fill(
    IDL.Variant({
      Nat: IDL.Nat,
      Int: IDL.Int,
      Text: IDL.Text,
      Blob: IDL.Vec(IDL.Nat8),
      Array: IDL.Vec(Value),
      Map: IDL.Vec(IDL.Tuple(IDL.Text, Value)),
    })
  );
  const MetadataEntry = IDL.Tuple(IDL.Text, Value);
  return IDL.Service({
    icrc7_name: IDL.Func([], [IDL.Text], ['query']),
    icrc7_total_supply: IDL.Func([], [IDL.Nat], ['query']),
    icrc7_tokens: IDL.Func(
      [IDL.Opt(IDL.Nat), IDL.Opt(IDL.Nat)],
      [IDL.Vec(IDL.Nat)],
      ['query']
    ),
    icrc7_token_metadata: IDL.Func(
      [IDL.Vec(IDL.Nat)],
      [IDL.Vec(IDL.Opt(IDL.Vec(MetadataEntry)))],
      ['query']
    ),
  });
};

const select = document.getElementById('icrc7-select');
const btn = document.getElementById('icrc7-btn');
const out = document.getElementById('icrc7-output');

for (const c of COLLECTIONS) {
  const opt = document.createElement('option');
  opt.value = c.id;
  opt.textContent = `${c.label} (${c.id})`;
  select.appendChild(opt);
}

function pickImageUri(entries) {
  if (!entries) return null;
  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey.includes('image') || lowerKey.includes('url') || lowerKey.includes('uri'))) continue;
    if ('Text' in value) {
      const text = value.Text;
      if (text.startsWith('http://') || text.startsWith('https://')) return text;
    }
  }
  return null;
}

function renderTokens(name, supply, tokens, metadata) {
  out.classList.remove('error');
  out.innerHTML = '';

  const header = document.createElement('div');
  header.textContent = `Collection:   ${name}\nTotal supply: ${supply.toString()}\nShowing first ${tokens.length} token IDs:`;
  header.style.whiteSpace = 'pre';
  out.appendChild(header);

  const wrap = document.createElement('div');
  wrap.style.marginTop = '12px';
  for (let i = 0; i < tokens.length; i++) {
    const tokenId = tokens[i];
    const entries = metadata[i] && metadata[i].length > 0 ? metadata[i][0] : null;
    const img = pickImageUri(entries);

    const card = document.createElement('div');
    card.className = 'token-card';

    if (img) {
      const el = document.createElement('img');
      el.src = img;
      el.alt = `token ${tokenId}`;
      el.onerror = () => { el.style.display = 'none'; };
      card.appendChild(el);
    } else {
      const ph = document.createElement('div');
      ph.style.cssText = 'height:100px;background:#000;border-radius:3px;display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:11px';
      ph.textContent = 'no http image';
      card.appendChild(ph);
    }

    const tid = document.createElement('div');
    tid.className = 'tid';
    tid.textContent = `#${tokenId.toString()}`;
    card.appendChild(tid);

    wrap.appendChild(card);
  }
  out.appendChild(wrap);
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  const canisterId = select.value;
  try {
    const actor = Actor.createActor(idlFactory, {
      agent: getAnonymousAgent(),
      canisterId,
    });

    const result = await wrapCall(
      async () => {
        const [name, supply, tokens] = await Promise.all([
          actor.icrc7_name(),
          actor.icrc7_total_supply(),
          actor.icrc7_tokens([], [BigInt(3)]),
        ]);
        const metadata = tokens.length
          ? await actor.icrc7_token_metadata(tokens)
          : [];
        return { name, supply, tokens, metadata };
      },
      { outputEl: out, label: `ICRC-7 ${canisterId}` }
    );

    renderTokens(result.name, result.supply, result.tokens, result.metadata);
  } catch (err) {
    // wrapCall rendered error
  } finally {
    btn.disabled = false;
  }
});
