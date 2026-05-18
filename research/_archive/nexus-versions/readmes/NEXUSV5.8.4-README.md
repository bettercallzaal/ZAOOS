# ZAO Nexus V5

[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen)](https://github.com/bettercallzaal/NEXUSV5.6)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.3-38B2AC)](https://tailwindcss.com/)

A mobile-optimized portal for the ZAO ecosystem that efficiently manages 5000+ links with wallet connection, token gating, advanced search functionality, and AI-powered features.

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Data Structure](#-data-structure)
- [Admin Utilities](#-admin-utilities)
- [Workflow](#-workflow)
- [Latest Updates](#-latest-updates)
- [Implementation Roadmap](#implementation-roadmap)
- [Tech Stack](#-tech-stack)

## 📋 Overview

ZAO Nexus V5 is a comprehensive web application designed to organize and provide access to 5000+ curated links for the ZAO ecosystem. The platform features token-gated access, requiring users to hold either $ZAO tokens on Optimism or $LOANZ tokens on Base. The application offers advanced filtering, AI-powered tagging, and a responsive design optimized for all devices.

## 📂 Project Structure

The project follows a modular architecture with clear separation of concerns:

### Core Application
- `src/app/page.tsx` - Main application page with wallet connection and link browsing
- `src/app/layout.tsx` - Root layout with theme provider and client providers
- `src/app/api/links/route.ts` - API endpoints for link management
- `src/app/admin/add-link/page.tsx` - Admin page for adding new links

### Components

#### Link Components
- `src/components/links/mobile-optimized-link-list.tsx` - Mobile-friendly virtualized list with advanced filtering
- `src/components/links/virtualized-link-list.tsx` - Original virtualized list implementation
- `src/components/links/link-card.tsx` - Card component for displaying links in grid view
- `src/components/links/link-row.tsx` - Row component for displaying links in list view
- `src/components/links/enhanced-search.tsx` - Advanced search component with suggestions
- `src/components/links/filter-sheet.tsx` - Mobile-optimized filter panel
- `src/components/links/category-scroll.tsx` - Horizontal scrollable category navigation
- `src/components/links/link-filter-sidebar.tsx` - Responsive sidebar for advanced filtering
- `src/components/links/enhanced-link-browser.tsx` - Integrated link browser with filtering and tagging
- `src/components/links/add-link-dialog.tsx` - Dialog for adding new links with AI tag generation

#### Wallet Components
- `src/components/wallet-connector.tsx` - Wallet connection component
- `src/components/wallet/connect-button.tsx` - Button for connecting wallet
- `src/components/token-checker.tsx` - Token balance verification component
- `src/components/token-balance-display.tsx` - Display for token balances

#### Filtering and Tagging Components
- `src/components/filters/advanced-filters.tsx` - Advanced filtering options for links

### Hooks and Utilities
- `src/hooks` - Custom React hooks for state management
  - `useLinks.ts` - Hook for accessing and filtering links data
  - `useWallet.ts` - Wallet connection and state management
  - `useSearch.ts` - Search functionality with fuzzy matching
  - `useTags.ts` - Tag management and filtering

- `src/lib` - Utility functions and helpers
  - `api.ts` - API client for external services
  - `utils.ts` - General utility functions
  - `constants.ts` - Application constants
  - `ai-helpers.ts` - Utilities for AI tag generation

- `src/styles` - Global styles and Tailwind configuration
  - `globals.css` - Global CSS styles
  - `tailwind.config.js` - Tailwind CSS configuration

### Services and Utilities
- `src/services/link-service.ts` - Service for managing links data
- `src/services/wallet-service.ts` - Service for wallet connection and token verification
- `src/admin/utils/` - Utility functions for admin operations
  - `links-data-utils.ts` - Utilities for loading and saving links data
  - `tagging-utils.ts` - Utilities for tag generation and management
  - `ai-helpers.ts` - Utilities for AI tag generation

### Data and Types
- `src/data/` - JSON data files for links and categories
  - `links.json` - Main links database with nested categories and subcategories structure
  - `links-updated.json` - Template for the links structure with empty categories and subcategories
  - `csv/` - Directory containing CSV files for batch imports
- `src/types/` - TypeScript type definitions
  - `links.ts` - Types for links, categories, and related data
  - `wallet.ts` - Types for wallet connection and token data

### Scripts
- `update-links-structure.js` - Script for updating links structure to the new format
- `src/scripts/adapter-for-app.js` - Converts the optimized link structure to the application-compatible format
- `src/scripts/auto-tag-all-links.js` - Automatically generates tags for all links in the database
- `src/scripts/test-import.js` - Tests the batch import functionality with CSV files
- `src/scripts/ai-tag-generator.ts` - AI-powered tag generation using OpenAI with fallback mechanisms
- `src/admin/batch-import-links.ts` - Script for batch importing links from CSV files
- `src/admin/recategorize-by-tags.ts` - Utility to recategorize links based on their tags
- `src/admin/admin-cli.ts` - Command-line interface for admin utilities

## 🔧 Admin Utilities

The project includes several admin utilities for managing links data. These utilities are located in the `src/admin` directory and can be run using Node.js.

### Batch Import Utility

The batch import utility allows importing multiple links from a CSV or JSON file. It supports validation, deduplication, and automatic categorization.

#### Usage

```bash
# Run the batch import utility directly
node -r ts-node/register src/admin/batch-import-links.ts --file=path/to/links.csv --type=csv --generate-tags --dry-run

# Or use the admin CLI
node -r ts-node/register src/admin/admin-cli.ts import --file=path/to/links.csv --type=csv --generate-tags
```

#### CSV Format

The CSV file should have the following columns:

```csv
title,url,description,category,subcategory,tags
"Link Title","https://example.com","Link description","Category","Subcategory","tag1,tag2,tag3"
```

### Auto-Tagging Utility

The auto-tagging utility analyzes all links in the database and adds relevant tags based on content analysis, domain extraction, and keyword matching.

#### Usage

```bash
# Run the auto-tagging utility
node auto-tag-all-links.js
```

#### Features

- **Domain Extraction**: Extracts meaningful tags from URL domains
- **Keyword Matching**: Identifies relevant keywords in titles and descriptions
- **Category Suggestion**: Suggests appropriate categories based on tags
- **Tag Deduplication**: Ensures no duplicate tags are added
- **Web3-Specific Detection**: Special handling for blockchain and Web3 content

### Recategorization Utility

The recategorization utility helps suggest and apply category/subcategory changes based on tags.

#### Usage

```bash
# Run the recategorization utility directly
node -r ts-node/register src/admin/recategorize-by-tags.ts --dry-run --interactive

# Or use the admin CLI
node -r ts-node/register src/admin/admin-cli.ts recategorize --dry-run --interactive
```

### Admin CLI

The admin CLI provides a unified interface for all admin utilities.

#### Usage

```bash
node -r ts-node/register src/admin/admin-cli.ts <command> [options]
```

#### Commands

- `import`: Run the batch import utility
- `recategorize`: Run the recategorization utility
- `backup`: Create a backup of the links data

## 🔄 Workflow

### Links Management Workflow

1. **Structure Definition**:
   - The structure template is defined in `links-updated.json`
   - This file contains the categories and subcategories hierarchy with empty links arrays

2. **Data Population**:
   - The `update-links-structure.js` script reads the template structure
   - It populates the structure with links data from the script's array
   - Each link is assigned to the appropriate category and subcategory
   - Metadata like IDs, timestamps, and favicons are generated

3. **Data Storage**:
   - The populated structure is saved to `links.json`
   - A backup of the previous version is created as `links.json.bak`

4. **API Access**:
   - The Next.js API routes in `src/app/api/links/route.ts` provide endpoints for accessing and modifying links
   - These endpoints handle operations like getting all links, adding new links, and updating existing links

5. **Frontend Display**:
   - The main page component in `src/app/page.tsx` loads and displays the links
   - Links are organized by categories and subcategories in the UI
   - Users can filter, search, and interact with the links

### Wallet Connection and Token Gating

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

4. **Event Handling**:
   - Application listens for account and chain changes
   - Balances are rechecked when these events occur

5. **State Persistence**:
   - Wallet state is persisted in localStorage
   - User remains connected across page refreshes

### AI-Powered Tagging

The AI tagging system automatically generates relevant tags for new links:

1. **Content Analysis**: When a new link is added, the system fetches and analyzes the webpage content
2. **Metadata Extraction**: Title, description, and main content are extracted
3. **AI Processing**: The content is processed using OpenAI's GPT model to suggest relevant tags
4. **Fallback Mechanisms**: If AI processing fails, the system falls back to keyword extraction
5. **Tag Management**: Users can add, remove, and filter by tags through the intuitive UI

## 🚀 Getting Started

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bettercallzaal/NEXUSV5.6.git
   cd NEXUSV5.6
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   - Add the required environment variables (see Environment Variables section)

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser**

## 📊 Data Structure

### Links JSON Schema

The application uses a structured JSON format to organize links within categories and subcategories:

```json
{
  "version": "1.0",
  "lastUpdated": "2025-07-14T02:07:39.355Z",
  "categories": [
    {
      "name": "ZAO Onchain",
      "description": "Official ZAO onchain resources and tokens",
      "icon": "globe",
      "color": "#e74c3c",
      "subcategories": [
        {
          "name": "ZAO Tokens",
          "description": "ZAO token resources and minting options",
          "icon": "link",
          "color": "#e74c3c",
          "links": [
            {
              "id": "link_ytthj4gvpwcjgjysnvvb",
              "title": "Mint ZAO-CHELLA Vibez Track on Zora",
              "url": "https://song.thezao.com",
              "description": "Own a piece of the ZAO-CHELLA experience by minting the Vibez track.",
              "tags": ["zao", "zao-onchain", "zao-tokens"],
              "displayTags": ["zao", "zao-onchain", "zao-tokens"],
              "isNew": true,
              "isOfficial": true,
              "isPopular": false,
              "createdAt": "2025-07-14T02:07:39.351Z",
              "updatedAt": "2025-07-14T02:07:39.354Z",
              "clicks": 0,
              "popularity": 0,
              "favicon": "https://song.thezao.com/favicon.ico",
              "category": "ZAO Onchain",
              "subcategory": "ZAO Tokens"
            }
          ]
        }
      ]
    }
  ],
  "tags": {}
}
```

### Key Features of the Schema

1. **Hierarchical Structure**: Links are organized within subcategories, which are nested within main categories
2. **Enhanced Metadata**: Includes creation dates, popularity metrics, and status indicators
3. **Comprehensive Tagging**: Supports tag relationships and visual styling
4. **Version Tracking**: Includes schema version and last updated timestamp

## 📈 Tech Stack

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI primitives
- **State Management**: Zustand with persist middleware
- **Virtualization**: react-window and react-virtualized-auto-sizer for efficient list rendering

### Web3 Integration
- **Wallet Connection**: wagmi, viem, and ConnectKit
- **Chain Support**: Optimism and Base
- **Token Contracts**: ERC-20 standard contracts

### Backend & API
- **API Routes**: Next.js API routes with TypeScript
- **Data Storage**: JSON files with Git versioning
- **AI Integration**: OpenAI API for tag generation

### DevOps & Tooling
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Jest and React Testing Library
- **CI/CD**: GitHub Actions

## 📝 License

Copyright 2025 ZAO Network. All rights reserved.

## 📈 Latest Updates

### **[July 15, 2025]** Optimized Link Management System
- **New JSON Schema for Link Management**
  - Restructured links to be nested inside categories and subcategories (removed top-level links array)
  - Added enhanced metadata including creation dates, popularity metrics, and health status
  - Created comprehensive tagging system with tag relationships and visual styling
  - Improved organization with cleaner category and subcategory structure
  - Added version tracking and collection statistics

- **Link Management Utilities**
  - Created `migrate-links-structure.js` to convert existing data to the new optimized format
  - Developed `enhanced-auto-tagger.js` for batch processing links with domain extraction and keyword matching
  - Built `adapter-for-app.js` to ensure backward compatibility with the current application
  - Enhanced tag display in all view modes (grid, list, compact)

### **[July 11, 2025]** Web3 Resources & Auto-Tagging
- **New Web3 Resources Category**
  - Added dedicated category for Web3 documentation and resources
  - Created Documentation subcategory for technical documentation links
  - Added Optimism Superchain Documentation as the first entry (71st link in the database)
  - Implemented comprehensive tagging with technology, blockchain, and layer2 tags

### **[July 8, 2025]** UI Improvements
- **Filter UI Positioning Fix**
  - Adjusted filter bar positioning to prevent overlap with other UI elements
  - Optimized sticky positioning with proper top offset for better user experience
  - Improved visual separation with subtle shadow effect
  - Fixed spacing and padding in filter components for more consistent layout

## 📈 Roadmap

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

### ✅ Definition of Done (per phase)  
1. **All unit + integration tests pass.**  
2. **Telemetry dashboards show expected event flow.**  
3. **Manual QA checklist in `/docs/QA_PHASE_X.md` is signed off.**  
4. **Changelog updated + version tag pushed.**

> *If any step is blocked, open a GitHub Issue with label `roadmap-blocker` and assign @bettercallzaal for triage.*
