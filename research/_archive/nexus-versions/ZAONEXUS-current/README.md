# ZAO NEXUS - Links Hub

> **Version 1.1.0** - A modern, responsive links hub for the ZAO community

A comprehensive link directory featuring 200+ curated resources across the ZAO ecosystem. Built with Next.js, React, TypeScript, and TailwindCSS.

## ✨ Features

### Core Functionality
- 🔍 **Smart Search** - Real-time search across titles, descriptions, and URLs
- 🎯 **Auto-Expand Results** - Automatically opens categories containing search matches
- 📂 **Hierarchical Organization** - 5 main categories with multiple subcategories
- 🔗 **200+ Curated Links** - Comprehensive ZAO ecosystem resources

### Navigation & UX
- ⚡ **Quick Jump** - Instant scroll to any category
- 📌 **Sticky Search** - Always accessible search bar
- 🎨 **Dark/Light Mode** - Toggle between ZAO brand themes
- 📱 **Fully Responsive** - Optimized for all devices
- ✨ **Smooth Animations** - Professional transitions and hover effects
- ♿ **Accessible** - WCAG 2.1 AA compliant

### Performance
- ⚡ **Fast Loading** - Next.js 14 optimization
- 🚀 **Instant Search** - Sub-50ms response time
- 💾 **Efficient** - Optimized with React hooks

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd NexusV2
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Embedding in Webflow

Once deployed, you can embed this in Webflow using an iframe:

```html
<iframe 
  src="https://your-nexus-url.vercel.app" 
  width="100%" 
  height="800px" 
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>
```

Or simply link to it:

```html
<a href="https://your-nexus-url.vercel.app" target="_blank">
  Visit ZAO NEXUS
</a>
```

## Project Structure

```
NexusV2/
├── app/
│   ├── data/
│   │   └── links.ts          # All links data
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main page component
├── public/                   # Static assets
├── package.json              # Dependencies
├── tailwind.config.js        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── next.config.js            # Next.js configuration
```

## Customization

### Adding New Links

Edit `app/data/links.ts` and add your links following the existing structure:

```typescript
{
  mainCategory: "Your Category",
  subcategories: [
    {
      subTitle: "Your Subcategory",
      links: [
        {
          title: "Link Title",
          url: "https://example.com",
          description: "Link description"
        }
      ]
    }
  ]
}
```

### Changing Colors

Edit the CSS variables in `app/globals.css`:

```css
:root {
  --bg-color: #141e27;
  --text-color: #e0ddaa;
  --accent-bg: #e0ddaa;
  --accent-text: #141e27;
}
```

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Deployment**: Vercel

## License

MIT License - feel free to use this for your own projects!

## 🗺️ Roadmap

### Vision
ZAO Nexus is the **central discovery hub** for everything ZAO - an amalgamation of all our links and the go-to place to explore what we do.

### V1.2 - Discovery & Exploration (Next Release)
**Focus: Making ZAO Nexus the ultimate discovery engine**

#### Planned Features

**🆕 What's New Section**
- Highlight recently added links at the top of the page
- Show latest 5-10 additions with "NEW" badges
- Encourage repeat visits to discover fresh content
- Auto-display links added in the last 7-30 days

**⭐ Featured/Highlighted Links**
- Pin important links to the top of categories
- "Featured" badge for key projects and initiatives
- Spotlight current campaigns, new releases, active projects
- Manually curated to guide discovery

**🚀 "Start Here" Section**
- Beginner-friendly entry points for newcomers
- "New to ZAO? Start here" with essential links
- Onboarding path: Whitepaper → Main Socials → Key Projects
- Help people understand the ZAO ecosystem quickly

**📅 Activity Feed/Timeline**
- Show recent ZAO activities and updates
- "Latest from WaveWarZ", "New ZABAL update", etc.
- Give visitors a sense of an active, thriving ecosystem
- Can pull from social media or be manually updated

**💡 Project Spotlights**
- Rotating featured project cards
- Brief description + key links for each initiative
- Help people understand what each project does
- Example: "This week: WaveWarZ - Trade music on Solana"

**🔍 Explore by Type**
- Filter by content type: Tools, Social, Games, Content, Community
- Cross-category discovery
- "Show me all games" or "Show me all social platforms"
- Tag-based navigation system

**📊 Enhanced Link Metadata**
```typescript
{
  title: "Link Title",
  url: "https://example.com",
  description: "Description",
  addedDate: "2026-02-12",     // For "What's New"
  featured: true,               // For highlighting
  tags: ["game", "music"],      // For filtering
  category: "tool"              // For type-based exploration
}
```

### V1.3 - Community Engagement
**Focus: Making the Nexus interactive and community-driven**

- **Link Submission Form** - Community can suggest new links
- **Favorites/Bookmarks** - Users can save their favorite links (localStorage)
- **Link Ratings/Votes** - Community-driven curation
- **Collections/Playlists** - Users create custom link collections
- **Comments/Notes** - Personal notes on links (stored locally)

### V1.4 - Advanced Features
**Focus: Power user features and automation**

- **Link Health Monitoring** - Check for broken links, display status
- **Click Analytics** - Track popular links, show trending content
- **RSS/Newsletter** - RSS feed for new links, weekly digest
- **Keyboard Shortcuts** - `/` for search, arrow keys for navigation
- **API Endpoint** - Public API for link data, JSON export

### V2.0 - Platform Evolution
**Focus: Decentralized social integration**

- **Farcaster Frames Integration** - Interactive cards in social feeds
- **User Accounts** - Sign in with Farcaster/wallet, sync across devices
- **AI-Powered Features** - Smart categorization, recommendations
- **Mobile App** - Native iOS/Android with offline access

## 📝 Contributing

### Adding Missing Links

We're continuously expanding the Nexus! If you know of ZAO links that should be included:

1. **Via Pull Request**:
   - Fork the repository
   - Edit `app/data/links.ts`
   - Add your links following the existing structure
   - Submit a PR

2. **Via Link Management Script**:
   ```bash
   node scripts/add-link.js
   ```
   Follow the interactive prompts to add links easily.

3. **Via Issue**:
   - Open a GitHub issue with the link details
   - Include: Title, URL, Description, Category

### Link Discovery Checklist

When searching for missing links, check:
- [ ] Zaal's X/Twitter (@bettercallzaal)
- [ ] Zaal's Farcaster/Warpcast
- [ ] ZAO social media accounts
- [ ] Recent blog posts on Paragraph
- [ ] GitHub repositories
- [ ] Partner project pages
- [ ] Community Discord/Telegram announcements

## Support

For issues or questions, reach out to the ZAO community.
