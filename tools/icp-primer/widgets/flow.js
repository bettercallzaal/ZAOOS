const svg = document.getElementById('flow-svg');
const btn = document.getElementById('flow-play');
const caption = document.getElementById('flow-caption');

const NS = 'http://www.w3.org/2000/svg';

const NODES = [
  { x: 60, y: 100, label: 'User' },
  { x: 220, y: 100, label: 'ICP Ledger' },
  { x: 380, y: 100, label: 'ZAO Canister' },
  { x: 540, y: 100, label: 'NFT' },
];

const STEPS = [
  { from: 0, to: 1, text: 'Step 1: User sends 1 ICP to the ZAO canister principal (via ledger).' },
  { from: 1, to: 2, text: 'Step 2: Ledger writes the transfer block. Canister learns the block index.' },
  { from: 2, to: 2, text: 'Step 3: Canister verifies the block amount + memo = valid purchase.' },
  { from: 2, to: 3, text: 'Step 4: Canister calls its own icrcX_mint(tokenId, metadata) to the user principal.' },
];

function buildSvg() {
  svg.innerHTML = '';

  // arrows (drawn first so they sit under node circles)
  for (let i = 0; i < NODES.length - 1; i++) {
    const a = NODES[i];
    const b = NODES[i + 1];
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', a.x + 28);
    line.setAttribute('y1', a.y);
    line.setAttribute('x2', b.x - 28);
    line.setAttribute('y2', b.y);
    line.setAttribute('stroke', '#1e324f');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('data-edge', String(i));
    svg.appendChild(line);
  }

  // nodes
  NODES.forEach((n, i) => {
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', n.x);
    circle.setAttribute('cy', n.y);
    circle.setAttribute('r', '28');
    circle.setAttribute('fill', '#10223c');
    circle.setAttribute('stroke', '#1e324f');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('data-node', String(i));
    svg.appendChild(circle);

    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', n.x);
    text.setAttribute('y', n.y + 4);
    text.setAttribute('fill', '#e8ecf3');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('font-size', '11');
    text.textContent = n.label;
    svg.appendChild(text);
  });
}

function highlightStep(idx) {
  // reset
  svg.querySelectorAll('[data-node]').forEach((el) => {
    el.setAttribute('fill', '#10223c');
    el.setAttribute('stroke', '#1e324f');
  });
  svg.querySelectorAll('[data-edge]').forEach((el) => {
    el.setAttribute('stroke', '#1e324f');
    el.setAttribute('stroke-width', '2');
  });

  const step = STEPS[idx];
  const fromNode = svg.querySelector(`[data-node="${step.from}"]`);
  const toNode = svg.querySelector(`[data-node="${step.to}"]`);
  if (fromNode) fromNode.setAttribute('stroke', '#f5a623');
  if (toNode) toNode.setAttribute('stroke', '#f5a623');

  if (step.from !== step.to) {
    const edgeIdx = Math.min(step.from, step.to);
    const edge = svg.querySelector(`[data-edge="${edgeIdx}"]`);
    if (edge) {
      edge.setAttribute('stroke', '#f5a623');
      edge.setAttribute('stroke-width', '3');
    }
  }

  caption.textContent = step.text;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let playing = false;
btn.addEventListener('click', async () => {
  if (playing) return;
  playing = true;
  btn.disabled = true;
  btn.textContent = 'Playing...';
  buildSvg();
  for (let i = 0; i < STEPS.length; i++) {
    highlightStep(i);
    await sleep(1400);
  }
  caption.textContent = 'Done. This is what Caffeine will scaffold for the ZAO Stock sale.';
  btn.textContent = 'Play again';
  btn.disabled = false;
  playing = false;
});

// initial static render
buildSvg();
