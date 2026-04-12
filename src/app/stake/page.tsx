import { Metadata } from 'next';
import StakeClient from './StakeClient';

const miniAppEmbed = JSON.stringify({
  version: '1',
  imageUrl: 'https://zaoos.com/og-stake.png',
  button: {
    title: 'Stake ZABAL',
    action: { type: 'launch_miniapp', url: 'https://zaoos.com/stake' },
  },
});

export const metadata: Metadata = {
  title: 'Stake ZABAL | ZAO OS',
  description: 'Stake ZABAL to earn conviction. More tokens + more time = more governance weight.',
  other: { 'fc:miniapp': miniAppEmbed },
};

export default function StakePage() {
  return <StakeClient />;
}
