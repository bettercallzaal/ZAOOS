import { Actor } from 'https://esm.sh/@dfinity/agent@2';
import { IDL } from 'https://esm.sh/@dfinity/candid@2';
import { getAnonymousAgent } from './state.js';
import { wrapCall } from './error.js';

const LEDGER_ID = 'ryjl3-tyaaa-aaaaa-aaaba-cai';

const idlFactory = ({ IDL }) => IDL.Service({
  icrc1_name: IDL.Func([], [IDL.Text], ['query']),
  icrc1_symbol: IDL.Func([], [IDL.Text], ['query']),
  icrc1_total_supply: IDL.Func([], [IDL.Nat], ['query']),
});

const btn = document.getElementById('ping-btn');
const out = document.getElementById('ping-output');

btn.addEventListener('click', async () => {
  btn.disabled = true;
  try {
    const actor = Actor.createActor(idlFactory, {
      agent: getAnonymousAgent(),
      canisterId: LEDGER_ID,
    });

    const [name, symbol, supply] = await wrapCall(
      () => Promise.all([
        actor.icrc1_name(),
        actor.icrc1_symbol(),
        actor.icrc1_total_supply(),
      ]),
      { outputEl: out, label: 'ICP Ledger query' }
    );

    out.classList.remove('error');
    out.textContent =
      `Ledger name:   ${name}\n` +
      `Symbol:        ${symbol}\n` +
      `Total supply:  ${supply.toString()} e8s\n` +
      `Canister:      ${LEDGER_ID}`;
  } catch (err) {
    // wrapCall already rendered the error
  } finally {
    btn.disabled = false;
  }
});
