import { redirect } from 'next/navigation';

/**
 * /governance now redirects to /fractals with the Proposals tab.
 * All governance functionality (proposals, voting, comments, admin controls)
 * has been consolidated into the fractals ProposalsTab.
 */
export default function GovernancePage() {
  redirect('/fractals?tab=proposals');
}
