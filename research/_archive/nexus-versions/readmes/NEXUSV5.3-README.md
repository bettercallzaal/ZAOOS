# ZAO Nexus V5

A mobile-optimized version of the ZAO Nexus portal that efficiently handles 5000+ links with wallet connection, token gating, advanced search functionality, and an AI assistant.

## Latest Updates

**[July 5, 2025]** Enhanced the mobile-optimized link list component with improved view modes and spacing:

- Added consistent scrollbar styling across the entire application for a unified user experience
- Mobile-optimized link list component now uses the global scrollbar styling
- Mobile-optimized link list component now defaults to compact view for better mobile usability
- Fixed spacing and layout consistency in all view modes (grid, list, compact)
- Improved grid item height (280px mobile, 240px desktop) and added padding
- Enhanced list view with borders, rounded corners, padding, and hover effects
- Optimized compact view with efficient spacing and clear visual hierarchy
- Fixed TypeScript issues and improved component structure

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
- **Notifications**: Sonner for toast notifications
- **Virtualization**: react-window and react-virtualized-auto-sizer for efficient list rendering

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

## Project Structure

Below is a brief description of key files and directories in the project:

### Core Application

- `src/app/page.tsx` - Main application page with wallet connection and link browsing
- `src/app/layout.tsx` - Root layout with theme provider and client providers

### Components

#### Link Components
- `src/components/links/mobile-optimized-link-list.tsx` - Mobile-friendly virtualized list with advanced filtering
- `src/components/links/virtualized-link-list.tsx` - Original virtualized list implementation
- `src/components/links/link-card.tsx` - Card component for displaying links in grid view
- `src/components/links/link-row.tsx` - Row component for displaying links in list view
- `src/components/links/enhanced-search.tsx` - Advanced search component with suggestions
- `src/components/links/filter-sheet.tsx` - Mobile-optimized filter panel
- `src/components/links/category-scroll.tsx` - Horizontal scrollable category navigation

#### Wallet Components
- `src/components/wallet-connector.tsx` - Wallet connection component
- `src/components/wallet/connect-button.tsx` - Button for connecting wallet
- `src/components/token-checker.tsx` - Token balance verification component
- `src/components/token-balance-display.tsx` - Display for token balances

#### UI Components
- `src/components/ui/button.tsx` - Reusable button component
- `src/components/ui/toast.tsx` - Toast notification component
- `src/components/ui/sheet.tsx` - Slide-out panel component
- `src/components/ui/dialog.tsx` - Modal dialog component

### Hooks and Utilities

- `src/hooks/use-wallet.ts` - Hook for wallet connection and token balance checking
- `src/lib/token-balance-checker.ts` - Utility for checking token balances across chains
- `src/lib/utils.ts` - General utility functions

### Data and Types

- `src/data/links.json` - Link data source
- `src/types/links.ts` - TypeScript types for link data
- `src/types/ethereum.d.ts` - TypeScript types for Ethereum interactions

### Styles

- `src/styles/globals.css` - Global styles with Tailwind directives

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

4. **Enhanced Sharing Capabilities**:

   #### Share Options
   - Native Web Share API integration for mobile devices
   - Direct sharing to popular platforms (Twitter, Telegram, Discord)
   - QR code generation for physical sharing in presentations
   - Custom short URL generation with zao.link domain
   
   #### Copy-to-Clipboard Fallback
   - Reliable clipboard API implementation with visual feedback
   - Formatted link copying with title, description, and URL
   - Option to copy as markdown, HTML, or plain text
   - Works even when pop-ups or third-party cookies are blocked
   
   #### Share Count Tracking
   - Backend API endpoint to track share events
   - Redis-based counter with periodic database persistence
   - Fraud detection to prevent artificial inflation of counts
   - Visual badges for links with high share counts (10+, 50+, 100+)
   
   #### Social Proof Elements
   - Share count badges with tiered visual indicators
   - "Trending" section highlighting most-shared links of the week
   - User testimonials or comments about shared links
   - Analytics dashboard for admins showing sharing patterns
   
   #### Implementation Approach
   - Client-side share event tracking with debounced API calls
   - Server-side count aggregation with rate limiting
   - Cached count display with optimistic UI updates
   - A/B testing different share button designs and placements

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

## ZAO Nexus × Hats Protocol Integration

A next-generation "Trusted Link Aggregator" playbook that integrates Hats Protocol at every layer of Nexus. Hats Protocol serves as a programmable reputation OS where every role, permission, or kudos gets minted as an on-chain "Hat," visible at hats.thezao.com and automatically reflected inside Nexus.

### 1. Hats Foundation Layer

- **Hat Registry UI (hats.thezao.com)**
  - Fork the Hats Protocol dashboard; pre-load "Curator," "Moderator," "Builder," "Partner DAO," "Service Provider," etc.
  - Anyone can apply for a Hat or be nominated by an existing Hat-holder
  - Gives every contributor a cryptographically provable badge wired to smart-contract permissions

- **Hat-gated Feature Flags**
  - Nexus checks the user's Hats on page-load:
    - Curator Hat ⇒ can submit links
    - Moderator Hat ⇒ can approve/remove
    - Builder Hat ⇒ can run CLI/import tools
    - Partner Hat ⇒ gets a "Trusted Source" label
  - Permissions live on-chain—not in a hidden database—so any dApp can reuse them

### 2. Verifiable Trust Layer

- **EAS-attested Links + Hat Signature**
  - When a Curator submits a link, the attestation includes their Hat ID
  - Nexus badge = ✅ Verified by Curator #123
  - Creates an auditable trail of who vouched for what

- **Hat Slashing / Suspension Hooks**
  - If a Moderator removes a Curator's malicious link, the Curator Hat can be auto-suspended until DAO review
  - Keeps quality high without centralized gatekeepers

### 3. Farcaster Mini-App Surface

- **"Hat-Filtered" Nexus Frame**
  - Mini-App shows only links attested by wallets holding Curator or higher Hats
  - Drop-downs let users toggle by Hat type
  - Makes it obvious which resources are DAO-vetted vs community-submitted

- **Hat-earned Cast Flair**
  - When the Mini-App posts an auto-receipt cast, it adds the Curator's Hat emoji (🎩) + ID
  - Social proof travels with the share

### 4. Storage & Portability

- **Hat-indexed Subgraph**
  - The Graph indexes LinkAttested events and WearHat events
  - External devs can fetch links by Hat tier
  - Any hackathon team can instantly build "Top Partner DAO Tools," etc.

### 5. Community-Driven Curation

- **Quadratic Votes Weighted by Hat Seniority**
  - Votes = √(tokens) × HatLevel (e.g., Moderator = 1.5×)
  - Balances stake-weighting with earned reputation

- **DAO "Dispute & Remove" with Hat Quorum**
  - A challenge needs 3+ Moderators or 1 Council Hat to pass
  - Slashes the challenger's bond if frivolous
  - Formalizes governance without manual Discord drama

### 6. Builder-First UX

- **Hat-aware CLI (npx zao-nexus)**
  - CLI auto-detects your Hats; shows commands you're allowed to run
  - Devs never hit a 403 surprise

- **Hat-sync GitHub Action**
  - A repo's links.yaml gets pushed nightly
  - Action signs with the repo owner's Hat-bound key → attestation
  - Allows teams to keep working in Git while still feeding Nexus

### 7. Intelligence Layer

- **Hat-based Recommendations**
  - "Builders who wear the Toolsmith Hat also bookmarked…"
  - Surfaces context-relevant links instead of generic popularity

### 8. Future Experiments

- **Hat Crafting & Leveling**
  - Curator submits 10 approved links → upgrades to Senior Curator Hat (extra weight, new UI palette)
  - Gamifies long-term contribution

- **Cross-DAO Hat Federation**
  - Accept Nouns' "Prop House Judge Hat" or Optimism's "Badge of Merit" as equivalent to Curator Hat via Hats' cross-domain attestation feature
  - Extends Nexus trust graph beyond ZAO

- **Hat ↔ TBA Profile Fusion**
  - Issue an ERC-6551 TBA when a Hat is minted
  - The TBA wallet owns the Hat and the link list NFT
  - Each project's profile becomes a composable on-chain entity that other apps can permission against

## Implementation Roadmap & Prioritization

This section organizes all proposed features by implementation difficulty and potential impact to help prioritize development efforts.

### Quick Wins (High Impact, Low Difficulty)

1. **Copy-to-Clipboard Fallback**
   - Estimated effort: 1-2 days
   - Impact: Ensures shareability across all devices/browsers
   - Key components: Clipboard API implementation, visual feedback

2. **Share Count Badge**
   - Estimated effort: 2-3 days
   - Impact: Adds social proof to increase click-through rates
   - Key components: Simple counter API, visual badges

3. **Link Preview on Hover**
   - Estimated effort: 2-3 days
   - Impact: Improves user experience and reduces unnecessary clicks
   - Key components: Preview card component, image caching

4. **Sorting Options**
   - Estimated effort: 1-2 days
   - Impact: Gives users more control over content discovery
   - Key components: Sort controls, modified list rendering

5. **Recently Visited Links Section**
   - Estimated effort: 1 day
   - Impact: Improves navigation and user retention
   - Key components: Local storage history, small UI section

### Strategic Priorities (High Impact, Medium Difficulty)

1. **Enhanced Sharing Capabilities**
   - Estimated effort: 1-2 weeks
   - Impact: Significantly increases content distribution
   - Key components: Web Share API, platform-specific integrations, QR code generation

2. **Better Tag System**
   - Estimated effort: 1-2 weeks
   - Impact: Improves content discovery and organization
   - Key components: Multi-tag filtering, tag visualization improvements

3. **Featured Links Section**
   - Estimated effort: 3-5 days
   - Impact: Highlights important content and improves navigation
   - Key components: Admin controls, featured section UI

4. **Link Health Monitoring**
   - Estimated effort: 1 week
   - Impact: Maintains quality and reliability of the directory
   - Key components: Background link checker, reporting system

5. **Hat-gated Feature Flags**
   - Estimated effort: 1-2 weeks
   - Impact: Foundation for permission system without major infrastructure changes
   - Key components: Wallet connection, basic Hat checking

### Major Initiatives (High Impact, High Difficulty)

1. **Hat Registry UI Integration**
   - Estimated effort: 3-4 weeks
   - Impact: Establishes decentralized governance foundation
   - Key components: Forked Hats Protocol dashboard, custom UI, smart contract integration

2. **EAS-attested Links + Hat Signature**
   - Estimated effort: 3-4 weeks
   - Impact: Creates verifiable trust layer for all content
   - Key components: EAS integration, attestation flow, verification UI

3. **Farcaster Mini-App Surface**
   - Estimated effort: 2-3 weeks
   - Impact: Extends reach to social platforms
   - Key components: Frames integration, Hat-filtered views

4. **Hat-indexed Subgraph**
   - Estimated effort: 2-3 weeks
   - Impact: Makes data accessible to developer ecosystem
   - Key components: The Graph integration, event indexing

5. **Community-Driven Curation**
   - Estimated effort: 4-6 weeks
   - Impact: Enables scalable, decentralized content moderation
   - Key components: Voting mechanisms, dispute resolution, reputation weighting

### Future Explorations (Variable Impact, High Difficulty)

1. **Hat Crafting & Leveling**
   - Estimated effort: 4-6 weeks
   - Impact: Gamifies contribution and builds community
   - Key components: Progression system, UI enhancements, smart contract logic

2. **Cross-DAO Hat Federation**
   - Estimated effort: 6-8 weeks
   - Impact: Extends trust graph beyond ZAO ecosystem
   - Key components: Cross-domain attestation, federation protocols

3. **Hat ↔ TBA Profile Fusion**
   - Estimated effort: 8-10 weeks
   - Impact: Creates composable on-chain entities
   - Key components: ERC-6551 integration, complex smart contract interactions

4. **AI-Powered Link Recommendations**
   - Estimated effort: 6-8 weeks
   - Impact: Personalizes content discovery
   - Key components: ML model training, recommendation engine, data pipeline

5. **Decentralized Storage Integration**
   - Estimated effort: 4-6 weeks
   - Impact: Ensures censorship resistance
   - Key components: IPFS/Arweave integration, content addressing

## Implementation Roadmap

### ☑️ Phase 0.5 – Observability Foundation (add **before** anything else)  
1. **Event Schema**  
   - Track: `link_add`, `vote_cast`, `share_click`, `preview_hover`, `hat_minted`, `hat_slash`.  
   - Fields: `txHash?`, `wallet`, `hatId?`, `linkId?`, `timestamp`, `meta` (JSON).  
2. **Logging Hook**  
   - Emit events client-side → `/api/telemetry` (POST).  
   - Serverless function streams to **Supabase** or **Tinybird** table.  
3. **Dashboard Stub**  
   - Spin up a lightweight **Grafana** panel or **Dune** query showing daily counts per event.  
   - Expose at `/admin/analytics` (basic auth).

### 🚀 Phase 1 – Quick Wins + Hat Readiness (Weeks 1-4)  
- **Clipboard fallback**, **share badges**, **sorting**, **recently-visited**, **hover preview**.  
- **Hat-gated Feature Flags**  
  - Read-only check: wallet → `HatsProtocol.getHats(address)` → boolean flags.  
  - Gate UI buttons (`AddLink`, `ModerateLink`) based on Hat status.  
- **Link-Health Cron**  
  - Daily `GET` on all URLs; mark `dead=true` if 3 consecutive 404/timeout.  
  - Surface `dead` flag in UI (strikethrough + "Report issue" link).

### 🔄 Phase 2 – Core Sharing & Taxonomy (Weeks 5-12)  
- Complete **Enhanced Sharing** suite (Web Share API, QR, `zao.link` shortener).  
- **Improved Tag System** (multi-select filter, tag chips, `/tags/:tag` pages).  
- **EAS-attested Links v0**  
  1. Curator Hat can mint attestation (`schemaId = LinkSchemaV1`).  
  2. UI shows ✅ "Attested" badge when `EAS.getAttestation(linkId)` returns truthy.

### ⚙️ Phase 3 – On-chain Governance & Social Surface (Weeks 13-24)  
- **Hat Registry UI**  
  - Mint / transfer / suspend flows via Hats Protocol SDK.  
- **Quadratic Voting + Dispute Flow**  
  - Contract: `LinkVotes.sol`, `DisputeResolver.sol`.  
  - Front-end widgets for up-vote, bond challenge, moderator quorum.  
- **Subgraph + Farcaster Frame**  
  - Deploy Graph Node indexing `LinkAttested`, `VoteCast`, `WearHat`.  
  - Mini-app (`/frames/top-links`) pulls from subgraph & filters by Hat tiers.

### 🌐 Phase 4 – Ecosystem & Advanced Features (Week 25+)  
- **Cross-DAO Hat Federation**, **TBA profile fusion**, **AI recommendations**, **IPFS/Arweave snapshots**, etc.  
- Only begin once analytics show:  
  - ≥ 100 Curator Hats minted  
  - Average weekly active voters ≥ 50  
  - Link-health "dead" ratio < 2 %

---

### ✅ Definition of Done (per phase)  
1. **All unit + integration tests pass.**  
2. **Telemetry dashboards show expected event flow.**  
3. **Manual QA checklist in `/docs/QA_PHASE_X.md` is signed off.**  
4. **Changelog updated + version tag pushed.**

> *If any step is blocked, open a GitHub Issue with label `roadmap-blocker` and assign @bettercallzaal for triage.*

## License

Copyright © 2025 ZAO Network. All rights reserved.
