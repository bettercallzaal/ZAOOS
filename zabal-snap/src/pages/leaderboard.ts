import type { Address } from 'viem';
import { ZABAL } from '../token.js';
import { formatTokenAmount, shortenAddress } from '../utils.js';

export interface HolderEntry {
  address: Address;
  balance: bigint;
}

export function buildLeaderboardPage(holders: HolderEntry[], baseUrl: string) {
  const bars = holders.map((h) => ({
    label: `${shortenAddress(h.address)} ${formatTokenAmount(h.balance)}`,
    value: Number(h.balance / BigInt(1e18)),
  }));

  const maxVal = bars.length > 0 ? Math.max(...bars.map((b) => b.value)) : 1;

  const tierLabel = (i: number) => {
    if (i === 0) return 'Whale';
    if (i < 3) return 'Dolphin';
    return 'Shrimp';
  };
  const tierColor = (i: number): 'amber' | 'blue' | 'gray' => {
    if (i === 0) return 'amber';
    if (i < 3) return 'blue';
    return 'gray';
  };

  const holderItems = holders.slice(0, 5).map((_h, i) => `holder_${i}`);
  const holderElements: Record<string, any> = {};

  holders.slice(0, 5).forEach((h, i) => {
    holderElements[`holder_${i}`] = {
      type: 'item' as const,
      props: {
        title: `#${i + 1} ${shortenAddress(h.address)}`,
        description: `${formatTokenAmount(h.balance)} ZABAL`,
      },
      children: [`tier_${i}`],
    };
    holderElements[`tier_${i}`] = {
      type: 'badge' as const,
      props: { label: tierLabel(i), color: tierColor(i) },
    };
  });

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['title', 'chart', 'holders_group', 'btn_row'],
        },
        title: {
          type: 'text' as const,
          props: { content: 'ZABAL Top Holders', weight: 'bold' as const },
        },
        chart: {
          type: 'bar_chart' as const,
          props: {
            bars: bars.length > 0 ? bars.slice(0, 5) : [{ label: 'No data', value: 0 }],
            color: 'amber' as const,
            max: maxVal || 1,
          },
        },
        holders_group: {
          type: 'item_group' as const,
          props: { separator: true },
          children: holderItems,
        },
        ...holderElements,
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const },
          children: ['back_btn', 'basescan_btn'],
        },
        back_btn: {
          type: 'button' as const,
          props: { label: 'Dashboard', icon: 'arrow-left' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/` },
            },
          },
        },
        basescan_btn: {
          type: 'button' as const,
          props: { label: 'All Holders', variant: 'primary' as const, icon: 'external-link' as const },
          on: {
            press: {
              action: 'open_url' as const,
              params: { target: `https://basescan.org/token/${ZABAL.address}#balances` },
            },
          },
        },
      },
    },
  };
}
