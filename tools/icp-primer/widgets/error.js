export async function wrapCall(fn, { outputEl, label }) {
  outputEl.classList.remove('error');
  outputEl.textContent = `Calling ${label}...`;
  try {
    const result = await fn();
    outputEl.classList.remove('error');
    return result;
  } catch (err) {
    renderError(outputEl, err, label);
    throw err;
  }
}

export function renderError(outputEl, err, label) {
  const message = err && err.message ? err.message : String(err);
  console.error(`[icp-primer] ${label} failed:`, err);
  outputEl.classList.add('error');
  outputEl.innerHTML = '';

  const p = document.createElement('div');
  p.textContent = `${label} failed: ${message}`;
  outputEl.appendChild(p);

  const btn = document.createElement('button');
  btn.className = 'btn btn-sm';
  btn.style.marginTop = '8px';
  btn.textContent = 'Copy debug info';
  btn.onclick = () => {
    const debug = JSON.stringify({
      label,
      message,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    }, null, 2);
    navigator.clipboard.writeText(debug).then(() => {
      btn.textContent = 'Copied';
      setTimeout(() => { btn.textContent = 'Copy debug info'; }, 1500);
    });
  };
  outputEl.appendChild(btn);
}
