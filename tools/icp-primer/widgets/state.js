import { HttpAgent } from 'https://esm.sh/@dfinity/agent@2';

const IC_HOST = 'https://icp-api.io';

const state = {
  agent: null,
  authClient: null,
  identity: null,
};

export function getAnonymousAgent() {
  if (!state.agent) {
    state.agent = new HttpAgent({ host: IC_HOST });
  }
  return state.agent;
}

export function setAuthClient(authClient) {
  state.authClient = authClient;
  state.identity = authClient ? authClient.getIdentity() : null;
  window.dispatchEvent(new CustomEvent('ii:changed', {
    detail: { identity: state.identity },
  }));
}

export function clearAuthClient() {
  state.authClient = null;
  state.identity = null;
  window.dispatchEvent(new CustomEvent('ii:changed', {
    detail: { identity: null },
  }));
}

export function getAuthClient() {
  return state.authClient;
}

export function getIdentity() {
  return state.identity;
}

export const IC_HOST_URL = IC_HOST;
