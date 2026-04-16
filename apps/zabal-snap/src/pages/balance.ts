import { formatTokenAmount } from '../utils.js';

export function buildBalanceInputPage(baseUrl: string) {
  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['title', 'desc', 'address_input', 'btn_row'],
        },
        title: {
          type: 'text' as const,
          props: { content: 'ZABAL Balance Checker', weight: 'bold' as const },
        },
        desc: {
          type: 'text' as const,
          props: { content: 'Enter a wallet address to check its $ZABAL balance.', size: 'sm' as const },
        },
        address_input: {
          type: 'input' as const,
          props: { name: 'address', label: 'Wallet Address', placeholder: '0x...', maxLength: 42 },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const },
          children: ['check_btn', 'back_btn'],
        },
        check_btn: {
          type: 'button' as const,
          props: { label: 'Check Balance', variant: 'primary' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/balance` },
            },
          },
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
      },
    },
  };
}

export function buildBalanceResultPage(address: string, balance: bigint, baseUrl: string) {
  const formatted = formatTokenAmount(balance);
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return {
    version: '1.0' as const,
    theme: { accent: 'amber' as const },
    ui: {
      root: 'page',
      elements: {
        page: {
          type: 'stack' as const,
          props: { direction: 'vertical' as const, gap: 'md' as const },
          children: ['title', 'result', 'btn_row'],
        },
        title: {
          type: 'text' as const,
          props: { content: `Balance for ${shortAddr}`, weight: 'bold' as const },
        },
        result: {
          type: 'item' as const,
          props: { title: `${formatted} ZABAL`, description: address },
          children: ['balance_badge'],
        },
        balance_badge: {
          type: 'badge' as const,
          props: { label: 'Base', color: 'blue' as const },
        },
        btn_row: {
          type: 'stack' as const,
          props: { direction: 'horizontal' as const, gap: 'sm' as const },
          children: ['again_btn', 'back_btn'],
        },
        again_btn: {
          type: 'button' as const,
          props: { label: 'Check Another', variant: 'primary' as const },
          on: {
            press: {
              action: 'submit' as const,
              params: { target: `${baseUrl}/balance-input` },
            },
          },
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
      },
    },
  };
}
