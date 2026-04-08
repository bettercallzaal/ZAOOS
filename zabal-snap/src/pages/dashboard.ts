import type { TokenDashboardData } from '../token.js';
import { ZABAL } from '../token.js';
import { formatTokenAmount, formatUsd } from '../utils.js';

export function buildDashboardPage(data: TokenDashboardData, baseUrl: string) {
  const price = formatUsd(data.priceUsd);
  const mcap = formatUsd(data.marketCapUsd);
  const burned = formatTokenAmount(data.burned);
  const distributed = formatTokenAmount(data.distributed);

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['header', 'stats', 'divider', 'burns_section', 'btn_row'],
        },
        header: {
          type: 'item' as const,
          props: { title: '$ZABAL', description: 'The ZAO community token on Base' },
          children: ['chain_badge'],
        },
        chain_badge: {
          type: 'badge' as const,
          props: { label: 'Base', color: 'blue' as const },
        },
        stats: {
          type: 'item_group' as const,
          props: { separator: true },
          children: ['price_item', 'mcap_item', 'holders_item'],
        },
        price_item: {
          type: 'item' as const,
          props: { title: 'Price', description: price },
        },
        mcap_item: {
          type: 'item' as const,
          props: { title: 'Market Cap', description: mcap },
        },
        holders_item: {
          type: 'item' as const,
          props: { title: 'Holders', description: `${data.holders}` },
        },
        divider: {
          type: 'separator' as const,
          props: {},
        },
        burns_section: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'sm' as const },
          children: ['burned_item', 'distributed_item'],
        },
        burned_item: {
          type: 'item' as const,
          props: { title: `Burned: ${burned} ZABAL`, description: 'Sent to dead address' },
          children: ['burn_badge'],
        },
        burn_badge: {
          type: 'badge' as const,
          props: { label: 'Deflationary', color: 'red' as const, icon: 'flame' as const },
        },
        distributed_item: {
          type: 'item' as const,
          props: { title: `Sent from ZAAL: ${distributed} ZABAL`, description: 'Community distributions' },
          children: ['dist_badge'],
        },
        dist_badge: {
          type: 'badge' as const,
          props: { label: 'Community', color: 'green' as const, icon: 'send' as const },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const },
          children: ['swap_btn', 'send_btn', 'more_btn'],
        },
        swap_btn: {
          type: 'button' as const,
          props: { label: 'Swap', icon: 'refresh-cw' as const },
          on: {
            press: {
              action: 'swap_token' as const,
              params: { buyToken: ZABAL.caip19 },
            },
          },
        },
        send_btn: {
          type: 'button' as const,
          props: { label: 'Send', icon: 'coins' as const },
          on: {
            press: {
              action: 'send_token' as const,
              params: { token: ZABAL.caip19 },
            },
          },
        },
        more_btn: {
          type: 'button' as const,
          props: { label: 'Activity', variant: 'primary' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/activity` },
            },
          },
        },
      },
    },
  };
}
