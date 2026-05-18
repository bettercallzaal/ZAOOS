/**
 * NEXUS V5 - Links Structure Update Script
 * 
 * This script updates the links structure based on the new organization
 * provided in the linksData array and saves it to the links.json file.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// File paths
const SOURCE_FILE = path.join(__dirname, 'src', 'data', 'links-updated.json');
const TARGET_FILE = path.join(__dirname, 'src', 'data', 'links.json');
const BACKUP_FILE = path.join(__dirname, 'src', 'data', 'links.json.bak');

// Helper function to generate a unique ID for links
function generateLinkId(link) {
  // Create a deterministic ID based on URL and title
  const baseString = `${link.url}|${link.title}`;
  const hash = crypto.createHash('sha256').update(baseString).digest('base64');
  return `link_${hash.substring(0, 20).replace(/[+/=]/g, '').toLowerCase()}`;
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    if (url === '#') return null;
    const domain = new URL(url).hostname;
    return domain;
  } catch (error) {
    return null;
  }
}

// Helper function to generate a favicon URL from the domain
function generateFaviconUrl(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  // Try common favicon locations
  return `https://${domain}/favicon.ico`;
}

// Links data from the provided structure
const linksData = [
  /* — ZAO Onchain — */
  { mainCategory: "ZAO Onchain", subcategories: [
    { subTitle: "ZAO Tokens", links: [
      { title: "Mint ZAO-CHELLA Vibez Track on Zora", url: "https://song.thezao.com", description: "Own a piece of the ZAO-CHELLA experience by minting the Vibez track." },
      { title: "Mint Attabotty ZAO-PALOOZA Card", url: "https://attabotty.zao.cards", description: "Collect the limited-edition Attabotty artist card from ZAO-PALOOZA." },
      { title: "Mint Zalora – the ZAO Mascot (MidiVerse)", url: "https://zalora.thezao.com", description: "Bring Zalora into your wallet – the on-chain mascot of the ZAO." }
    ]},
    { subTitle: "ZAO Tracks", links: [
      { title: "ZAO song #1: ZAO-CHELLA VIBEZ", url: "https://zora.co/collect/base:0x1458f7d12c1fe1747e13793d99dcb6da6f9d6123/1?referrer=0xa46b072e6607d37413000220653d3bca5be32513", description: "Vibe to the first official ZAO track from ZAO-CHELLA." },
      { title: "ZAO song #2: ZAO-CHELLA CYPHER", url: "https://www.thezao.com/zao-cypher", description: "Listen to the multi-artist Cypher track from ZAO-CHELLA." },
      { title: "ZAO song #3: Side by Side (ZAO Side)", url: "https://ima.midipunkz.com/midivaderz/side-by-side-thezao", description: "Watch the Side-by-Side collab in MidiVaderZ – ZAO's side." },
      { title: "ZAO song #3.1: Side by Side (MidiPunkz Side)", url: "https://ima.midipunkz.com/midivaderz/side-by-side-midipunkz", description: "Watch the Side-by-Side collab in MidiVaderZ – MidiPunkz's side." }
    ]}
  ]},

  /* — ZAO Links — */
  { mainCategory: "ZAO Links", subcategories: [
    { subTitle: "ZAO Platforms", links: [
      { title: "ZAO Website", url: "https://thezao.com", description: "Visit the official ZAO website for all the latest news and resources." },
      { title: "ZVerse (ZAO Hivemind)", url: "https://thezao.xyz", description: "Explore the ZVerse, where the ZAO Hivemind connects ideas and innovations." },
      { title: "ZAO ORG CHART (Hats Tree)", url: "https://hats.thezao.com", description: "Dive into the ZAO ORG CHART to see our team and projects." }
    ]},
    { subTitle: "Calendars", links: [
      { title: "ZAO Google Calendar", url: "https://calendar.google.com/calendar/u/0?cid=MmY3YTQ4YTY2MWIyNzVlMmFkZTgxYzlhYjJkMGFhM2E1YTBmNThiNTA3MDVhOTYxZGE2NWNmNTE0MTZjZGU3NUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t", description: "Stay up to date with ZAO events on Google Calendar." },
      { title: "ZAO Calendar", url: "https://lu.ma/zao", description: "Browse upcoming ZAO events and activities on Luma." },
      { title: "ZAO Music Events Calendar", url: "https://lu.ma/zao-m", description: "Explore ZAO music-related events and gigs on Luma." }
    ]},
    { subTitle: "ZAO Social Media Chats", links: [
      { title: "Discord", url: "https://discord.gg/ACJyYQH3BE", description: "Join our ZAO Discord for real-time group chats." },
      { title: "Telegram", url: "https://t.me/+iMH5Y_t2Mks1NmVh", description: "Connect with us on Telegram for updates and discussions." }
    ]},
    { subTitle: "ZAO WHITEPAPER", links: [
      { title: "ZAO Whitepaper Draft", url: "https://app.charmverse.io/the-zao/the-zao-whitepaper-draft-2-6565388910657037", description: "Dive into the ZAO Whitepaper for a deeper understanding of the ecosystem." }
    ]},
    { subTitle: "Daily Newsletter Articles", links: [
      { title: "Daily Newsletter Articles", url: "https://paragraph.xyz/@thezao", description: "Read daily newsletter articles." },
      { title: "Subscribe to the newsletter", url: "https://paragraph.xyz/@thezao/subscribe", description: "Subscribe for daily updates." }
    ]}
  ]},

  /* — ZAO Projects — */
  { mainCategory: "ZAO Projects Links", subcategories: [
    { subTitle: "WaveWarZ", links: [
      { title: "WaveWarZ Twitter", url: "https://x.com/WaveWarZ", description: "Check out the latest updates on WaveWarZ Twitter." },
      { title: "WaveWarZ V1 SOL Testnet", url: "https://www.wavewarz.com", description: "Access the WaveWarZ DAPP on the SOL Testnet (V1)." }
    ]},
    { subTitle: "ZAO Festivals", links: [
      { title: "ZAO Festivals Website", url: "https://zaofestivals.com/", description: "Visit the official ZAO Festivals website." },
      { title: "Merch", url: "https://merch.zaofestivals.com", description: "Shop for ZAO Festivals merchandise." },
      { title: "Donate", url: "https://giveth.io/project/sustaining-zao-festivals-creativity-technology?tab=donations", description: "Donate to support ZAO Festivals." },
      { title: "ZAO PALOOZA Artist Cards", url: "https://zao.cards", description: "View ZAO PALOOZA Artist Cards." }
    ]},
    { subTitle: "ZAO Festivals Socials", links: [
      { title: "Twitter", url: "https://x.com/zaofestivals?lang=en", description: "Follow ZAO Festivals on Twitter." },
      { title: "Instagram", url: "https://www.instagram.com/zaofestivals/", description: "Follow ZAO Festivals on Instagram." },
      { title: "Facebook", url: "https://www.facebook.com/ZAOFestivals", description: "Like ZAO Festivals on Facebook." },
      { title: "LinkedIn", url: "https://www.linkedin.com/company/zaofestivals", description: "Connect with ZAO Festivals on LinkedIn." },
      { title: "YouTube", url: "https://www.youtube.com/@zaofestivals", description: "Watch ZAO Festivals videos on YouTube." }
    ]},
    { subTitle: "$Loanz", links: [
      { title: "$Loanz OG Whitepaper", url: "https://paragraph.xyz/@thezao/student-loanz-whitepaper", description: "Dive into the original $Loanz Whitepaper for in-depth info on Student Loanz." },
      { title: "$Loanz website", url: "https://studentloanz.xyz/", description: "Visit the official $Loanz website to explore student loan solutions." },
      { title: "$Loanz memebook", url: "https://zao.lol", description: "Make your own $loanz memes." },
      { title: "Loanz Daily Spaces", url: "https://x.com/loanzonbase", description: "Loanz Daily Spaces." }
    ]},
    { subTitle: "ZAO Playlists", links: [
      { title: "ZAO Spotify 2024", url: "https://open.spotify.com/playlist/2IIl13a4YNxQTLNJhDKr32?si=1bb3ef92068143cf", description: "Listen to ZAO Spotify 2024 playlist." },
      { title: "ZAO Spotify 2025", url: "https://open.spotify.com/playlist/7MCDgGzyqbnsyKSNuMUUpM?si=2652032d60de4b93", description: "Listen to ZAO Spotify 2025 playlist." },
      { title: "ZAO SOUND.XYZ Playlist", url: "https://www.sound.xyz/playlist/1e1ab680-2f45-4232-9c34-b6ba9dc1a1d3", description: "Listen to the ZAO SOUND.XYZ Playlist." }
    ]},
    { subTitle: "ZAO CMOTM Interviews", links: [
      { title: "Daniel Obute Interview", url: "https://paragraph.xyz/@thezao/ztalentnewsletter12", description: "Daniel Obute Interview." },
      { title: "Davyd Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-1-davyd", description: "Davyd Interview." },
      { title: "Tej Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-2", description: "Tej Interview." },
      { title: "Ohnahji B Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-3", description: "Ohnahji B Interview." },
      { title: "CandyToyBox Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-4", description: "CandyToyBox Interview." },
      { title: "Hurric4n3Ike Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-5-hurric4n3ike", description: "Hurric4n3Ike Interview." },
      { title: "Heather Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-6", description: "Heather Interview." },
      { title: "Attabotty Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-7-attabotty", description: "Attabotty Interview." }
    ]}
  ]},

  /* — ZAO Community Links — */
  { mainCategory: "ZAO Community Links", subcategories: [
    { subTitle: "Defi Space Donkeys", links: [
      { title: "Coming Soon", url: "#", description: "Links for Defi Space Donkeys will appear here." }
    ]},
    { subTitle: "Impact Concerts", links: [
      { title: "Coming Soon", url: "#", description: "Links for Impact Concerts will appear here." }
    ]},
    { subTitle: "MidiPunkZ", links: [
      { title: "Main website", url: "https://midipunkz.com/", description: "The official MidiPunkZ website." },
      { title: "MidiVaderz game", url: "https://midipunkz.com/games", description: "Play MidiVaderz on the MidiPunkZ website." },
      { title: "MidiPunkz Community", url: "https://ima.midipunkz.com/communities/midipunkz", description: "Join the MidiPunkZ community on IMA." },
      { title: "MiDi FeatherFrogs Community", url: "https://ima.midipunkz.com/communities/featherfrogs", description: "Explore the FeatherFrogs community on IMA." },
      { title: "Midi Avatars", url: "https://midipunkz.com/midiezz", description: "Browse and collect MidiPunkZ avatars." },
      { title: "ZAO Community Page", url: "https://ima.midipunkz.com/communities/the-zao", description: "Check out the ZAO's dedicated community space on midipunkz.com." }
    ]}
  ]},

  /* — ZAO Community Members — */
  { mainCategory: "ZAO Community Members", subcategories: [
    { subTitle: "ZAO Founder BetterCallZaal Links", links: [
      { title: "BetterCallZaal Linktree", url: "https://linktr.ee/bettercallzaal", description: "Access all BetterCallZaal links and resources on Linktree." },
      { title: "Personal Meeting Room (Huddle01)", url: "https://huddle01.app/room/zfp-tzyh-anm", description: "Enter your personal meeting room." },
      { title: "Meet with Zaal (Calendly)", url: "https://calendly.com/zaalp99/30minmeeting", description: "Schedule a meeting with Zaal." }
    ]},
    { subTitle: "ZAO Founder BetterCallZaal Interviews", links: [
      { title: "Interview #0 (3/28/24): Blitzscaling w/Bayo", url: "https://youtu.be/FKyIS-h3fNY", description: "Interview #0: Blitzscaling a Startup w/Bayo." },
      { title: "Interview #1 (11/14/24): ZAO Fractal w/NovaCrypto", url: "https://www.youtube.com/watch?v=0_WvwzBvs90&ab_channel=NovaCryptoLTD", description: "Interview #1: ZAO Fractal w/NovaCrypto." },
      { title: "Interview #2 (4/1/25): ZAO w/Lindsey", url: "https://www.youtube.com/watch?v=SXmdO6l4Rfg&ab_channel=TokenForYourThoughtsPodcast", description: "Interview #2: ZAO w/Lindsey." },
      { title: "Interview #3 (4/10/25): THE ZAO w/Will T", url: "https://www.youtube.com/watch?v=oVp0d1BBmko&ab_channel=ReFiDAO", description: "Interview #3: THE ZAO w/Will T." }
    ]},
    { subTitle: "ZAO Co-Founder CandyToyBox Links", links: [
      { title: "CandyToyBox Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder CandyToyBox." }
    ]},
    { subTitle: "ZAO Co-Founder Attabotty Links", links: [
      { title: "Attabotty Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder Attabotty." }
    ]},
    { subTitle: "ZAO Co-Founder HURRIC4N3IKE Links", links: [
      { title: "HURRIC4N3IKE Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder HURRIC4N3IKE." }
    ]},
    { subTitle: "ZAO Co-Founder Jango UU Links", links: [
      { title: "Instagram", url: "https://www.instagram.com/jangouuforever?igsh=MTl4bTRodXl2bDU4Mw%3D%3D&utm_source=qr", description: "Follow Jango UU on Instagram." },
      { title: "X (Twitter)", url: "https://x.com/jangouuforever?s=11&t=lwnZlcNedjeVZeQDTcNEwQ", description: "Follow Jango UU on X (Twitter)." },
      { title: "Spotify", url: "https://open.spotify.com/artist/5nc2dgefoPLfvsrJVx3PNz?si=Xhzfg5n1Q3uHVJHHawp8KA", description: "Listen to Jango UU on Spotify." }
    ]},
    { subTitle: "ZAO Staff EZinCrypto Links", links: [
      { title: "EZinCrypto Test Link", url: "https://thezao.com", description: "Test link for ZAO Staff EZinCrypto." }
    ]},
    { subTitle: "ZAO Staff Ohnahji B Links", links: [
      { title: "Ohnahji Linktree", url: "https://linktr.ee/ohnahji", description: "Linktree for Ohnahji B." }
    ]},
    { subTitle: "ZAO Community Member Jed XO Links", links: [
      { title: "Jed XO Test Link", url: "https://thezao.com", description: "Test link for ZAO Community Member Jed XO." }
    ]},
    { subTitle: "ZAO Musician GodCloud", links: [
      { title: "GodCloud Website", url: "https://godcloud.org", description: "Website for GodCloud." },
      { title: "GodCloud Drip.haus", url: "https://drip.haus/godcloud", description: "Collect GodCloud tracks." }
    ]}
  ]}
];

// Main function to update the links structure
async function updateLinksStructure() {
  console.log('Starting links structure update...');
  
  try {
    // Read the source data
    const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
    const sourceData = JSON.parse(sourceContent);
    console.log(`Successfully read source data from ${SOURCE_FILE}`);
    
    // Backup the existing links.json file if it exists
    if (fs.existsSync(TARGET_FILE)) {
      fs.copyFileSync(TARGET_FILE, BACKUP_FILE);
      console.log(`Backed up existing links.json to ${BACKUP_FILE}`);
    }
    
    // Process the links data and update the structure
    for (const categoryData of linksData) {
      const categoryName = categoryData.mainCategory;
      
      // Find the matching category in the source data
      const category = sourceData.categories.find(cat => cat.name === categoryName);
      if (!category) {
        console.warn(`Category '${categoryName}' not found in source data. Skipping.`);
        continue;
      }
      
      // Process subcategories
      for (const subcategoryData of categoryData.subcategories) {
        const subcategoryName = subcategoryData.subTitle;
        
        // Find the matching subcategory in the source data
        const subcategory = category.subcategories.find(subcat => subcat.name === subcategoryName);
        if (!subcategory) {
          console.warn(`Subcategory '${subcategoryName}' not found in category '${categoryName}'. Skipping.`);
          continue;
        }
        
        // Clear existing links
        subcategory.links = [];
        
        // Add new links
        for (const linkData of subcategoryData.links) {
          const linkId = generateLinkId(linkData);
          
          const link = {
            id: linkId,
            title: linkData.title,
            url: linkData.url,
            description: linkData.description || "",
            tags: [
              "zao",
              categoryName.toLowerCase().replace(/\s+/g, '-'),
              subcategoryName.toLowerCase().replace(/\s+/g, '-')
            ],
            displayTags: [
              "zao",
              categoryName.toLowerCase().replace(/\s+/g, '-').substring(0, 10),
              subcategoryName.toLowerCase().replace(/\s+/g, '-').substring(0, 10)
            ],
            isNew: true,
            isOfficial: true,
            isPopular: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            clicks: 0,
            popularity: 0,
            favicon: generateFaviconUrl(linkData.url),
            category: categoryName,
            subcategory: subcategoryName
          };
          
          subcategory.links.push(link);
        }
      }
    }
    
    // Update the lastUpdated timestamp
    sourceData.lastUpdated = new Date().toISOString();
    
    // Write the updated structure to the target file
    fs.writeFileSync(TARGET_FILE, JSON.stringify(sourceData, null, 2), 'utf8');
    
    console.log(`Update completed successfully!`);
    console.log(`Updated structure written to ${TARGET_FILE}`);
    
    return sourceData;
  } catch (error) {
    console.error(`Update failed: ${error.message}`);
    throw error;
  }
}

// Run the update
updateLinksStructure().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
