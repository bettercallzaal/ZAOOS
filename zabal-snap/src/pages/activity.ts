import type { TopRecipient } from '../token.js';
import { ZABAL } from '../token.js';
import { formatTokenAmount, shortenAddress } from '../utils.js';

export function buildActivityPage(recipients: TopRecipient[], baseUrl: string) {
  const bars = recipients.map((r) => ({
    label: `${shortenAddress(r.address)} ${formatTokenAmount(r.amount)}`,
    value: Number(r.amount / BigInt(1e18)),
  }));

  const maxVal = bars.length > 0 ? Math.max(...bars.map((b) => b.value)) : 1;

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['title', 'recipients_label', 'recipients_chart', 'supply_label', 'supply_chart', 'btn_row'],
        },
        title: {
          type: 'text' as const,
          props: { content: 'ZABAL Activity', weight: 'bold' as const },
        },
        recipients_label: {
          type: 'text' as const,
          props: { content: 'Top Recipients from ZAAL', size: 'sm' as const },
        },
        recipients_chart: {
          type: 'bar_chart' as const,
          props: {
            bars: bars.length > 0 ? bars : [{ label: 'No transfers yet', value: 0 }],
            color: 'amber' as const,
            max: maxVal || 1,
          },
        },
        supply_label: {
          type: 'text' as const,
          props: { content: 'Supply Breakdown', size: 'sm' as const },
        },
        supply_chart: {
          type: 'bar_chart' as const,
          props: {
            bars: [
              { label: 'LP Pool (65.2%)', value: 65.2 },
              { label: 'Vault Locked (30.0%)', value: 30.0 },
              { label: 'Airdrop (4.8%)', value: 4.8 },
            ],
            color: 'green' as const,
            max: 100,
          },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const, justify: 'between' as const },
          children: ['back_btn', 'basescan_btn'],
        },
        back_btn: {
          type: 'button' as const,
          props: { label: 'Back', icon: 'arrow-left' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/` },
            },
          },
        },
        basescan_btn: {
          type: 'button' as const,
          props: { label: 'BaseScan', variant: 'primary' as const, icon: 'external-link' as const },
          on: {
            press: {
              action: 'open_url' as const,
              params: {
                target: `https://basescan.org/token/${ZABAL.address}`,
              },
            },
          },
        },
      },
    },
  };
}
