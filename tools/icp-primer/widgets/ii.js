import { AuthClient } from 'https://esm.sh/@dfinity/auth-client@2';
import { setAuthClient, clearAuthClient, getIdentity } from './state.js';
import { renderError } from './error.js';

const II_URL = 'https://identity.ic0.app';
const MAX_TTL_NS = BigInt(7 * 24 * 60 * 60) * BigInt(1_000_000_000);

const btn = document.getElementById('ii-login');
const out = document.getElementById('ii-output');

let authClient = await AuthClient.create();

function truncatePrincipal(text) {
  if (text.length <= 14) return text;
  return `${text.slice(0, 8)}...${text.slice(-4)}`;
}

function renderLoggedIn(identity) {
  const principal = identity.getPrincipal().toText();
  out.classList.remove('error');
  out.textContent = '';

  const label = document.createElement('div');
  label.textContent = 'Your principal:';

  const code = document.createElement('div');
  code.style.marginTop = '6px';
  code.style.color = 'var(--gold)';
  code.title = principal;
  code.textContent = truncatePrincipal(principal);

  const logout = document.createElement('button');
  logout.className = 'btn btn-sm';
  logout.style.marginTop = '10px';
  logout.textContent = 'Logout';
  logout.onclick = async () => {
    await authClient.logout();
    clearAuthClient();
    renderLoggedOut();
  };

  out.append(label, code, logout);
  btn.textContent = 'Logged in';
  btn.disabled = true;
}

function renderLoggedOut() {
  btn.textContent = 'Login with Internet Identity';
  btn.disabled = false;
  out.classList.remove('error');
  out.textContent = 'Click "Login with Internet Identity" above to see your principal.';
}

if (await authClient.isAuthenticated()) {
  setAuthClient(authClient);
  renderLoggedIn(authClient.getIdentity());
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  btn.textContent = 'Opening II...';
  try {
    await new Promise((resolve, reject) => {
      authClient.login({
        identityProvider: II_URL,
        maxTimeToLive: MAX_TTL_NS,
        onSuccess: resolve,
        onError: (msg) => reject(new Error(msg || 'Login failed')),
      });
    });
    setAuthClient(authClient);
    renderLoggedIn(authClient.getIdentity());
  } catch (err) {
    renderError(out, err, 'Internet Identity login');
    btn.disabled = false;
    btn.textContent = 'Login with Internet Identity';
  }
});
