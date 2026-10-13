/**
 * fa-walkthrough.ts - walk Zaal through applying to Fractured Atlas's fiscal
 * sponsorship, one step per message, with a Done button.
 *
 * Zaal, 2026-10-12 (seat, vault decisions item 191, card 10356): "i wanna sign
 * up for fractaured atlas myself ... have the zoe help us with this". Then, on
 * reading the step list: "ok lets do it".
 *
 * HE DOES EVERY STEP HIMSELF. ZOE never opens an account, pays, or submits
 * anything. All this module does is show one step, and on Done swap the
 * message for the next step. It touches no network and no file.
 *
 * STATELESS BY DESIGN. The step number rides in the button's callback data
 * ("fa:3:done", "fa:3:back"), so there is nothing to store, nothing to lose on
 * a restart, and an old message still works. Tapping Done on step 3 of an
 * old message again just shows step 4 again; nothing is counted.
 *
 * WHERE THE STEPS COME FROM. Fractured Atlas's own pages, read 2026-10-12: the
 * fiscal-sponsorship page on fracturedatlas.org and their help articles
 * ("The Application Process", "Administrative Fees", "Fiscal Sponsorship
 * Prohibited Activities", "Soliciting Donations Prior to Sponsorship
 * Approval", "Fiscal Sponsorship Application Rush Services", membership
 * levels). The paste blocks live in the vault at
 * projects/fractured-atlas-application-draft-2026-10-12.md (vault PR 143).
 * If Fractured Atlas changes a price or a rule, edit STEPS; nothing else
 * depends on the wording.
 *
 * Sent only on /fa, which Zaal types himself, so it is a reply rather than a
 * push and the quiet window does not apply.
 *
 * Off unless ZOE_FA_WALKTHROUGH=1.
 */

export function faWalkthroughEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ZOE_FA_WALKTHROUGH === '1';
}

export interface FaStep {
  title: string;
  body: string;
}

export const STEPS: readonly FaStep[] = [
  {
    title: 'Settle two facts first',
    body:
      'Do you already have a Fractured Atlas account? (Card 9249 was marked done on 11 Aug.) If yes, every "join" step below is "log in".\n' +
      'Do any outside investors hold a stake in ZAO Festivals? If yes, Fractured Atlas needs an addendum.',
  },
  {
    title: 'Read the Grant Agreement',
    body:
      'Submitting the application signs the Fiscal Sponsorship Grant Agreement (dated 28 February 2024). It is a legally binding contract, so read it before step 4.',
  },
  {
    title: 'Join at a paid level',
    body:
      'fracturedatlas.org > Become A Member. Professional is $10 a month for one person, per their membership article from 2023, so check the price on screen. Organization is $20 a month if others need their own logins.',
  },
  {
    title: 'Open the application',
    body:
      'fs.fracturedatlas.org. It takes about 30 to 45 minutes. Keep the vault draft open next to it: projects/fractured-atlas-application-draft-2026-10-12.md.',
  },
  {
    title: 'Paste the blocks',
    body:
      'Project name: ZAO Festivals. Then the short description, project description, budget, location and dates from the draft. Replace the budget estimates with ZAOstock 2026 actual costs if you have them.',
  },
  {
    title: 'Investors and lobbying',
    body: 'Answer no investors and no lobbying, if that is true. Otherwise sign the addendum it offers.',
  },
  {
    title: 'Submit',
    body:
      'The answer comes within 10 business days, and board review can take up to 6 weeks in rare cases. A $75 rush answers in 5 business days; $250 answers by the next business day.',
  },
  {
    title: 'Until you are approved',
    body:
      'No donation asks that name Fractured Atlas. Donations received before approval get no tax receipt.\n' +
      'After approval: 8% of every donation goes to Fractured Atlas. Tickets, merch and paid ad slots never go through the fund. Every grant application and donation letter goes to them for review first.',
  },
];

export const FA_CALLBACK = /^fa:(\d{1,2}):(done|back)$/;

export interface FaTap {
  step: number;
  action: 'done' | 'back';
}

export function parseFaCallback(data: string): FaTap | null {
  const m = FA_CALLBACK.exec(data);
  if (!m) return null;
  const step = Number(m[1]);
  if (!Number.isInteger(step) || step < 0 || step >= STEPS.length) return null;
  return { step, action: m[2] as FaTap['action'] };
}

/** Where a tap lands: the step to show next, or 'finished' after the last Done. */
export function nextStep(tap: FaTap): number | 'finished' {
  if (tap.action === 'back') return Math.max(0, tap.step - 1);
  return tap.step + 1 >= STEPS.length ? 'finished' : tap.step + 1;
}

export function faStepText(step: number): string {
  const s = STEPS[step];
  return `Fractured Atlas, step ${step + 1} of ${STEPS.length}: ${s.title}\n\n${s.body}`;
}

type Button = { text: string; callback_data: string };

export function faKeyboard(step: number): { inline_keyboard: Button[][] } {
  const row: Button[] = [];
  if (step > 0) row.push({ text: 'Back', callback_data: `fa:${step}:back` });
  row.push({ text: step + 1 === STEPS.length ? 'Done, finished' : 'Done', callback_data: `fa:${step}:done` });
  return { inline_keyboard: [row] };
}

export const FA_FINISHED_TEXT =
  'Fractured Atlas walkthrough finished. When the approval email arrives, send me a line about it so it is captured. Type /fa to start again.';
