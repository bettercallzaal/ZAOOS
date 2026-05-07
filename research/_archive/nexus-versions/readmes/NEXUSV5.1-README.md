# ZAO Nexus Simple

A simplified version of the ZAO Nexus 2.0 portal that efficiently handles 5000+ links with wallet connection, token gating, search functionality, and an AI assistant.

## Latest Updates

**[June 29, 2025]** Implemented multi-chain token balance checking for $ZAO (Optimism) and $LOANZ (Base) tokens with a clean, modular UI. The implementation includes:

- Modular `WalletConnector` and `TokenChecker` components
- Robust error handling and debug logging
- Manual test functionality for specific wallet addresses
- Automatic and manual balance refresh options
- Clear visual indicators for token gating status

## Features

- **Multi-Chain Wallet Connection**: Connect with MetaMask or other Ethereum wallets across different networks
- **Cross-Chain Token Gating**: Access requires holding at least 0.1 $ZAO (on Optimism) or $LOANZ (on Base) token
- **Link Discovery**: Browse through 5000+ links organized by categories and subcategories
- **Search Functionality**: Fast, fuzzy search across all links, categories, and descriptions
- **Dark Mode**: Toggle between light and dark themes
- **AI Assistant**: Chat widget for user assistance (placeholder implementation)
- **Responsive Design**: Works on mobile, tablet, and desktop

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives
- **State Management**: Zustand with persist middleware
- **Web3**: ethers.js for blockchain interactions
- **Search**: Fuse.js for fuzzy searching

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables (see Environment Variables section)

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Multi-Chain Token Balance Checking Implementation Guide

### Overview

The ZAO Nexus portal implements a robust multi-chain token balance checking system that allows users to connect their wallets and verify token balances across different blockchain networks. The implementation checks for:

- **$ZAO tokens** on the **Optimism** network
- **$LOANZ tokens** on the **Base** network

Users gain access to the portal if they hold at least 0.1 tokens of either type.

### Architecture

#### Core Components

1. **Wallet Hook (`use-wallet.ts`)**: Central hook that manages wallet connection and token balance checking
2. **Wallet Store**: Zustand store with persistence middleware for maintaining wallet state
3. **Wallet Connect Component**: UI component for wallet connection
4. **Token Balance Display**: UI components for showing token balances

### Implementation Best Practices

#### 1. Provider Management

```typescript
// Cache providers to avoid creating new instances on every check
let providers = {
  optimism: null as ethers.providers.JsonRpcProvider | null,
  base: null as ethers.providers.JsonRpcProvider | null
};

// Cache contracts to avoid creating new instances on every check
let contracts = {
  zao: null as ethers.Contract | null,
  loanz: null as ethers.Contract | null
};

// Initialize providers and contracts
const initializeProviders = () => {
  if (!providers.optimism) {
    providers.optimism = new ethers.providers.JsonRpcProvider(OPTIMISM_RPC);
  }
  if (!providers.base) {
    providers.base = new ethers.providers.JsonRpcProvider(BASE_RPC);
  }
  if (!contracts.zao && providers.optimism) {
    contracts.zao = new ethers.Contract(ZAO_TOKEN_ADDRESS, ERC20_ABI, providers.optimism);
  }
  if (!contracts.loanz && providers.base) {
    contracts.loanz = new ethers.Contract(LOANZ_TOKEN_ADDRESS, ERC20_ABI, providers.base);
  }
};
```

#### 2. Efficient Balance Checking

```typescript
checkTokenBalance: async () => {
  const { address, lastChecked } = get();
  if (!address) return;
  
  // Throttle balance checks to prevent too many RPC calls
  if (Date.now() - lastChecked < 10000) return; // 10 seconds cooldown
  set({ lastChecked: Date.now() });
  
  initializeProviders();
  
  // Use Promise.allSettled to check both balances in parallel
  const results = await Promise.allSettled([
    // Check ZAO balance on Optimism
    (async () => {
      try {
        const balance = await contracts.zao.balanceOf(address);
        return { balance: formatBalance(balance), hasToken: balance.gte(ethers.utils.parseEther("0.1")) };
      } catch (error) {
        console.error("Error checking ZAO balance:", error);
        return { balance: '0', hasToken: false };
      }
    })(),
    
    // Check LOANZ balance on Base
    (async () => {
      try {
        const balance = await contracts.loanz.balanceOf(address);
        return { balance: formatBalance(balance), hasToken: balance.gte(ethers.utils.parseEther("0.1")) };
      } catch (error) {
        console.error("Error checking LOANZ balance:", error);
        return { balance: '0', hasToken: false };
      }
    })()
  ]);
  
  // Update state with results
  if (results[0].status === 'fulfilled') set({ zaoBalance: results[0].value.balance });
  if (results[1].status === 'fulfilled') set({ loanzBalance: results[1].value.balance });
  set({ hasTokens: (results[0].status === 'fulfilled' && results[0].value.hasToken) || 
                   (results[1].status === 'fulfilled' && results[1].value.hasToken) });
}
```

#### 3. Wallet Connection Event Handling

```typescript
// Set up event listeners for account and chain changes
if (typeof window !== 'undefined' && window.ethereum) {
  window.ethereum.on('accountsChanged', async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnect();
    } else {
      // User switched accounts
      set({ address: accounts[0] });
      await checkTokenBalance();
    }
  });

  window.ethereum.on('chainChanged', async () => {
    // Refresh token balances when chain changes
    await checkTokenBalance();
  });
}
```

#### 4. State Persistence

```typescript
export const useWalletStore = create<WalletState>(
  persist(
    (set, get) => ({
      // State and methods here
    }),
    {
      name: 'wallet-storage', // unique name for localStorage
      partialize: (state) => ({ 
        address: state.address,
        isConnected: state.isConnected,
        zaoBalance: state.zaoBalance,
        loanzBalance: state.loanzBalance,
        hasTokens: state.hasTokens
      })
    }
  )
);
```

### Workflow

1. **User Connects Wallet**:
   - User clicks "Connect Wallet" button
   - Application requests wallet connection via MetaMask
   - On successful connection, wallet address is stored

2. **Balance Checking**:
   - Application initializes providers and contracts if not already done
   - Balances for both tokens are checked in parallel
   - Results are stored in the wallet state

3. **Token Gating**:
   - If user has sufficient tokens (≥ 0.1 of either token), access is granted
   - Token balances are displayed in the UI

## Next Steps

1. **Integration with Main UI**:
   - Integrate the token checker components into the main Nexus UI
   - Ensure consistent styling and user experience

2. **Performance Optimization**:
   - Implement RPC request batching/multicall for more efficient blockchain queries
   - Add caching mechanisms to reduce redundant balance checks

3. **Testing and Validation**:
   - Add unit tests for token balance checker utility functions
   - Add integration tests for wallet connection and token checking flows
   - Test with various wallet states and network conditions

4. **Enhanced Error Handling**:
   - Implement more detailed error messages for specific failure scenarios
   - Add recovery mechanisms for temporary RPC failures

5. **Feature Expansion**:
   - Support additional tokens and networks as needed
   - Add transaction history for token transfers
   - Implement token price information

4. **Event Handling**:
   - Application listens for account and chain changes
   - Balances are rechecked when these events occur

5. **State Persistence**:
   - Wallet state is persisted in localStorage
   - User remains connected across page refreshes

### Troubleshooting

- **Balance Not Updating**: Check browser console for errors. Ensure RPC endpoints are functioning.
- **Connection Issues**: Verify MetaMask is installed and unlocked. Check for network connectivity.
- **Performance Problems**: If balance checks are slow, consider increasing the throttle time.

## Project Structure

- `/src/app`: Next.js app router pages
- `/src/components`: React components
  - `/ui`: Reusable UI components
  - `/wallet`: Wallet connection components
  - `/links`: Link discovery components
  - `/ai`: AI assistant components
- `/src/hooks`: Custom React hooks
  - `use-wallet.ts`: Multi-chain wallet connection and token balance checking
- `/src/data`: Static data files
- `/src/styles`: Global styles
- `/src/types`: TypeScript type definitions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```
# Contract addresses
NEXT_PUBLIC_ZAO_TOKEN_ADDRESS=0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957
NEXT_PUBLIC_LOANZ_TOKEN_ADDRESS=0x03315307b202bf9c55ebebb8e9341d30411a0bc4

# RPC endpoints
NEXT_PUBLIC_OPTIMISM_RPC=https://opt-mainnet.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_BASE_RPC=https://base-mainnet.g.alchemy.com/v2/YOUR_API_KEY

# Optional: OpenAI API key for AI assistant (if implemented)
# OPENAI_API_KEY=your_api_key_here
```

## Building for Production

```bash
npm run build
npm run start
```

## Links Page Improvements

### Visual Design Enhancements

1. **Categorized Visual Cards**: Implement visually distinct cards for each category with custom icons or imagery that represent the category theme.

2. **Visual Hierarchy**: Add more visual distinction between categories, subcategories, and links to improve scanability.

3. **Responsive Design Improvements**: Ensure the page works well on all device sizes with better spacing and layout adjustments.

### User Experience Improvements

1. **Quick Access Favorites**: Add a "Favorite" or "Pin" feature that allows users to save frequently used links to the top of the page.

2. **Recently Visited Links**: Implement a section that shows recently clicked links for quick access.

3. **Search Enhancements**: 
   - Add filters for searching by date added, popularity, or relevance
   - Implement auto-suggestions as users type in the search box

4. **Link Preview**: Add hover previews that show a thumbnail or preview of the linked website.

5. **Sorting Options**: Allow users to sort links by newest, most popular, or alphabetically.

### Content Organization

1. **Featured Links Section**: Create a section at the top for highlighting important or timely links.

2. **Better Tag System**: Enhance the tagging system with visual indicators and the ability to filter by multiple tags simultaneously.

3. **Related Links**: Show related links when viewing a specific category or link.

### Interactive Features

1. **User Contributions**: Allow community members to suggest new links (with moderation).

2. **Voting/Rating System**: Let users upvote useful links to help others find the most valuable resources.

3. **Comments or Notes**: Enable users to add personal notes to links for future reference.

4. **Share Options**: Add easy sharing functionality for individual links or categories.

### Technical Improvements

1. **Performance Optimization**: The virtualized list is good, but could be optimized further for faster loading.

2. **Link Health Monitoring**: Implement a system to check for broken links and flag them for updating.

3. **Analytics Integration**: Add tracking to see which links are most popular to inform future organization.

4. **Progressive Web App Features**: Make the page available offline with PWA capabilities.

### Content Enhancements

1. **Link Descriptions**: Expand descriptions to be more informative and consistent across all links.

2. **Last Updated Timestamps**: Show when links were added or last verified.

3. **Content Previews**: For certain links, show snippets of content from the destination.

4. **Categorization Review**: Some categories could be reorganized for better logical grouping.

## Future Improvements and Integrations

### Wallet and Token Improvements

- Implement a backend API for token balance aggregation
- Add support for more networks and tokens
- Implement multicall contracts for more efficient balance checking
- Add unit and integration tests for wallet functionality
- Optimize RPC usage with better caching strategies

### Advanced Integrations

1. **AI-Powered Link Recommendations**: Implement machine learning to suggest links based on user behavior and preferences.

2. **Social Integration**: Allow users to connect social accounts to personalize their experience.

3. **Browser Extension**: Create a browser extension for quick access to the Nexus from any webpage.

4. **Mobile App**: Develop a native mobile application for iOS and Android.

5. **Decentralized Storage**: Store link data on IPFS or Arweave for censorship resistance.

6. **DAO Governance**: Implement community voting for link additions and removals.

7. **NFT Integration**: Create collectible NFTs that unlock premium features or exclusive link collections.

8. **Cross-Platform Bookmarking**: Sync bookmarked links across devices and browsers.

9. **API Access**: Provide an API for developers to build applications on top of the ZAO Nexus data.

10. **Notification System**: Alert users when new links are added in categories they follow.

11. **Content Aggregation**: Pull in content previews from linked sites to create a unified reading experience.

12. **Custom Link Collections**: Allow users to create and share their own curated collections of links.

13. **Advanced Analytics Dashboard**: Provide insights on link usage and popularity for administrators.

14. **Multi-language Support**: Translate link descriptions and categories into multiple languages.

15. **Voice Search**: Implement voice commands for hands-free navigation of the Nexus.

## License

Copyright © 2025 ZAO Network. All rights reserved.
