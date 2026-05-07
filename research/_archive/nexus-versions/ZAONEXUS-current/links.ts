export interface Link {
  title: string;
  url: string;
  description: string;
}

export interface Subcategory {
  subTitle: string;
  links: Link[];
}

export interface MainCategory {
  mainCategory: string;
  subcategories: Subcategory[];
}

export const linksData: MainCategory[] = [
  {
    mainCategory: "ZAO Onchain",
    subcategories: [
      {
        subTitle: "ZAO Tokens",
        links: [
          { title: "Mint ZAO-CHELLA Vibez Track on Zora", url: "https://song.thezao.com", description: "Own a piece of the ZAO-CHELLA experience by minting the Vibez track." },
          { title: "Mint Attabotty ZAO-PALOOZA Card", url: "https://attabotty.zao.cards", description: "Collect the limited-edition Attabotty artist card from ZAO-PALOOZA." },
          { title: "Mint Zalora – the ZAO Mascot (MidiVerse)", url: "https://zalora.thezao.com", description: "Bring Zalora into your wallet – the on-chain mascot of the ZAO." }
        ]
      },
      {
        subTitle: "ZAO Tracks",
        links: [
          { title: "ZAO song #1: ZAO-CHELLA VIBEZ", url: "https://zora.co/collect/base:0x1458f7d12c1fe1747e13793d99dcb6da6f9d6123/1?referrer=0xa46b072e6607d37413000220653d3bca5be32513", description: "Vibe to the first official ZAO track from ZAO-CHELLA." },
          { title: "ZAO song #2: ZAO-CHELLA CYPHER", url: "https://www.thezao.com/zao-cypher", description: "Listen to the multi-artist Cypher track from ZAO-CHELLA." },
          { title: "ZAO song #3: Side by Side (ZAO Side)", url: "https://ima.midipunkz.com/midivaderz/side-by-side-thezao", description: "Watch the Side-by-Side collab in MidiVaderZ – ZAO's side." },
          { title: "ZAO song #3.1: Side by Side (MidiPunkz Side)", url: "https://ima.midipunkz.com/midivaderz/side-by-side-midipunkz", description: "Watch the Side-by-Side collab in MidiVaderZ – MidiPunkz's side." }
        ]
      }
    ]
  },
  {
    mainCategory: "ZAO Links",
    subcategories: [
      {
        subTitle: "ZAO Platforms",
        links: [
          { title: "ZAO Website", url: "https://thezao.com", description: "Visit the official ZAO website for all the latest news and resources." },
          { title: "ZOR DAO", url: "http://zao.frapps.xyz/", description: "Access ZOR DAO — the decentralized governance hub for The ZAO." },
          { title: "ZAO ORG CHART (Hats Tree)", url: "https://hats.thezao.com", description: "Dive into the ZAO ORG CHART to see our team and projects." },
          { title: "ZAO YouTube", url: "https://www.youtube.com/@thezaodao", description: "Official ZAO YouTube channel." },
          { title: "ZAO Paragraph (paragraph.com)", url: "https://paragraph.com/@thezao", description: "ZAO writing and updates on Paragraph." }
        ]
      },
      {
        subTitle: "Calendars",
        links: [
          { title: "ZAO Google Calendar", url: "https://calendar.google.com/calendar/u/0?cid=MmY3YTQ4YTY2MWIyNzVlMmFkZTgxYzlhYjJkMGFhM2E1YTBmNThiNTA3MDVhOTYxZGE2NWNmNTE0MTZjZGU3NUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t", description: "Stay up to date with ZAO events on Google Calendar." },
          { title: "ZAO Calendar", url: "https://lu.ma/zao", description: "Browse upcoming ZAO events and activities on Luma." },
          { title: "ZAO Music Events Calendar", url: "https://lu.ma/zao-m", description: "Explore ZAO music-related events and gigs on Luma." }
        ]
      },
      {
        subTitle: "ZAO Social Media Chats",
        links: [
          { title: "Discord", url: "https://discord.gg/ACJyYQH3BE", description: "Join our ZAO Discord for real-time group chats." },
          { title: "Telegram", url: "https://t.me/+iMH5Y_t2Mks1NmVh", description: "Connect with us on Telegram for updates and discussions." },
          { title: "Retake (Zaal)", url: "https://retake.tv/zaal", description: "Zaal on Retake." },
          { title: "BetterCallZaal Twitch", url: "https://www.twitch.tv/bettercallzaal", description: "BetterCallZaal live streams on Twitch." }
        ]
      },
      {
        subTitle: "ZAO WHITEPAPER",
        links: [
          { title: "ZAO Whitepaper Draft", url: "https://app.charmverse.io/the-zao/the-zao-whitepaper-draft-2-6565388910657037", description: "Dive into the ZAO Whitepaper for a deeper understanding of the ecosystem." }
        ]
      },
      {
        subTitle: "Daily Newsletter Articles",
        links: [
          { title: "Daily Newsletter Articles", url: "https://paragraph.xyz/@thezao", description: "Read daily newsletter articles." },
          { title: "Subscribe to the newsletter", url: "https://paragraph.xyz/@thezao/subscribe", description: "Subscribe for daily updates." }
        ]
      }
    ]
  },
  {
    mainCategory: "ZAO Projects Links",
    subcategories: [
      {
        subTitle: "WaveWarZ",
        links: [
          { title: "WaveWarZ Homepage – FLIX.fun", url: "https://flix.fun", description: "Live-traded music battles streaming 24/7 on FLIX.fun." },
          { title: "WaveWarZ Website", url: "https://wavewarz.com", description: "Official WaveWarZ site for live-traded music battles." },
          { title: "WaveWarZ Docs", url: "https://www.wavewarz.com/docs", description: "Developer and participant documentation for WaveWarZ." },
          { title: "WaveWarZ Whitepaper Draft", url: "https://hackmd.io/@R2firT46QtyhbpzPCBL7gw/rkq_NaYagx", description: "Read the WaveWarZ whitepaper draft on HackMD." },
          { title: "X (Twitter)", url: "https://x.com/WaveWarZ", description: "Follow WaveWarZ on X for battle updates and highlights." },
          { title: "YouTube", url: "https://www.youtube.com/@WaveWarZ", description: "Watch WaveWarZ battles and interviews on YouTube." },
          { title: "Twitch", url: "https://www.twitch.tv/wavewarzofficial", description: "Stream live WaveWarZ events on Twitch." },
          { title: "Zora", url: "https://zora.co/wavewarz", description: "Collect WaveWarZ drops on Zora." },
          { title: "Farcaster", url: "https://farcaster.xyz/wavewarz", description: "Follow WaveWarZ activity on Farcaster." },
          { title: "Instagram", url: "https://www.instagram.com/wavewarz/", description: "Follow WaveWarZ on Instagram for visuals and clips." },
          { title: "Telegram", url: "https://t.me/wavewarz", description: "Join the WaveWarZ Telegram community." },
          { title: "Artist Sign-Up Form", url: "https://tally.so/r/wQZ5a7", description: "Apply to battle in upcoming WaveWarZ events." },
          { title: "Newsletter Sign-Up", url: "https://subscribepage.io/XFM0pk", description: "Subscribe to WaveWarZ news and announcements." },
          { title: "Artist Agreement", url: "#", description: "WaveWarZ Artist Agreement (document link forthcoming)." },
          { title: "SIGEA Website", url: "https://sigeacloud.io", description: "Official partner – SIGEA Cloud." },
          { title: "SIGEA X", url: "https://x.com/SigeaOfficial", description: "Follow SIGEA Cloud on X." },
          { title: "Quakey Nation Website", url: "https://www.quakeycoin.com/", description: "Partner: Quakey Nation ecosystem." },
          { title: "Quakey Nation X", url: "https://x.com/QUAKEYOFFICIALX", description: "Follow Quakey Nation on X." },
          { title: "Flix.Fun Website", url: "https://flix.fun/", description: "Home of WaveWarZ TV – continuous streaming." },
          { title: "Flix.Fun X", url: "https://x.com/FLIXdotFUN", description: "Follow FLIX.fun on X for media and event updates." },
          { title: "WaveWarZ OG Badge – Magnetiq", url: "https://app.magnetiq.xyz/brand/WaveWarZ/magnet/WaveWarZ%20OGz", description: "Collect the official WaveWarZ OG Badge on Magnetiq." },
          { title: "Magnetiq X", url: "https://x.com/magnetiq_xyz", description: "Follow Magnetiq on X." },
          { title: "How To Trade Music on WaveWarZ", url: "https://www.youtube.com/results?search_query=How+To+Trade+Music+on+WaveWarZ", description: "Video guide: timed music battles and trading walkthrough." },
          { title: "How Much Can You MAKE Trading on WaveWarZ?", url: "https://www.youtube.com/results?search_query=How+Much+Can+You+MAKE+Trading+on+WaveWarZ", description: "Breakdown of rewards and mechanics for traders." },
          { title: "First Hosted Artist Interview", url: "https://x.com/CandyToyBoxYT1/status/1958656914793144704", description: "WaveWarZ artist interview hosted by CandyToyBox." },
          { title: "LIVE Update #6", url: "https://x.com/WaveWarZ/status/1958908419622281658", description: "WaveWarZ live update #6 on X." },
          { title: "Songjam Interview", url: "https://x.com/SongjamSpace/status/1957865525545197905", description: "'The Future of Music Engagement' with Adam Place." },
          { title: "Darkside Podcast", url: "https://x.com/DPodocasts/status/1955375718835294281", description: "WaveWarZ feature on Darkside Podcast." },
          { title: "Omniflix / Cosmos Ecosystem Mentions", url: "https://x.com/CosmosEcosystem/status/1957439621777825938", description: "Cosmos ecosystem shoutout to WaveWarZ." },
          { title: "Twisted Tweak Interview by Chumwizard", url: "https://x.com/Chumwizards/status/1957597676989739350", description: "Interview and article on Twisted Tweak." },
          { title: "Clout.FM Interview by Clouty", url: "https://x.com/RjSmithy/status/1952444479069458452", description: "Clout.FM interview about WaveWarZ." },
          { title: "Flix.Talk Episode", url: "https://x.com/FLIXdotFUN/status/1953504352716681405", description: "Flix.Talk conversation featuring WaveWarZ." },
          { title: "Karate Kombat Walkout Music Collab", url: "https://x.com/WaveWarZ/status/1954924153112334370", description: "Walkout theme created by Hurricane & Cannon for MokokaFlow." },
          { title: "LUI & Stilo X Space", url: "https://x.com/Cryptogodlui/status/1950602534864953432", description: "WaveWarZ X Space featuring LUI & Stilo." },
          { title: "Cannon Jones Animated Battle Card (V1)", url: "https://x.com/cannonjones973/status/1953020510360490134", description: "Animated battle card by Cannon Jones – V1." },
          { title: "Cannon Jones Animated Battle Card (V2)", url: "https://x.com/i/status/1953603013370950096", description: "Animated battle card by Cannon Jones – V2." },
          { title: "Art by Mumbo", url: "https://x.com/o_mumb/status/1950974314460881117", description: "Community art contribution by Mumbo." },
          { title: "Phantom Wallet", url: "https://phantom.com/", description: "Solana wallet for connecting to WaveWarZ." },
          { title: "Solflare", url: "https://www.solflare.com/", description: "Alternative Solana wallet compatible with WaveWarZ." },
          { title: "Solscan", url: "https://solscan.io/", description: "Blockchain explorer for Solana transactions." },
          { title: "WaveWarZ Songjam Leaderboard", url: "https://leaderboard.songjam.space/", description: "WaveWarZ leaderboard powered by Songjam." }
        ]
      },
      {
        subTitle: "ZABAL",
        links: [
          { title: "ZABAL on Songjam", url: "https://songjam.space/zabal", description: "ZABAL hub on Songjam." },
          { title: "ZABAL Website", url: "https://zabal.art", description: "Official ZABAL website." },
          { title: "ZABAL Incented", url: "https://incented.zabal.art", description: "ZABAL quests and incentives via Incented." },
          { title: "ZABAL Update #7", url: "https://paragraph.com/@thezao/zabal-update-7", description: "ZABAL progress update on Paragraph." },
          { title: "ZABAL Connector", url: "https://zabal.lol", description: "Get the ZABAL connector." }
        ]
      },
      {
        subTitle: "ZAO Festivals",
        links: [
          { title: "ZAO Festivals Website", url: "https://zaofestivals.com/", description: "Visit the official ZAO Festivals website." },
          { title: "Merch", url: "https://merch.zaofestivals.com", description: "Shop for ZAO Festivals merchandise." },
          { title: "Donate", url: "https://giveth.io/project/sustaining-zao-festivals-creativity-technology?tab=donations", description: "Donate to support ZAO Festivals." },
          { title: "ZAO PALOOZA Artist Cards", url: "https://zao.cards", description: "View ZAO PALOOZA Artist Cards." }
        ]
      },
      {
        subTitle: "ZAO Festivals Socials",
        links: [
          { title: "Twitter", url: "https://x.com/zaofestivals?lang=en", description: "Follow ZAO Festivals on Twitter." },
          { title: "Instagram", url: "https://www.instagram.com/zaofestivals/", description: "Follow ZAO Festivals on Instagram." },
          { title: "Facebook", url: "https://www.facebook.com/ZAOFestivals", description: "Like ZAO Festivals on Facebook." },
          { title: "LinkedIn", url: "https://www.linkedin.com/company/zaofestivals", description: "Connect with ZAO Festivals on LinkedIn." },
          { title: "YouTube", url: "https://www.youtube.com/@zaofestivals", description: "Watch ZAO Festivals videos on YouTube." }
        ]
      },
      {
        subTitle: "$Loanz",
        links: [
          { title: "$Loanz OG Whitepaper", url: "https://paragraph.xyz/@thezao/student-loanz-whitepaper", description: "Dive into the original $Loanz Whitepaper for in-depth info on Student Loanz." },
          { title: "$Loanz website", url: "https://studentloanz.xyz/", description: "Visit the official $Loanz website to explore student loan solutions." },
          { title: "$Loanz memebook", url: "https://zao.lol", description: "Make your own $loanz memes." },
          { title: "Loanz Daily Spaces", url: "https://x.com/loanzonbase", description: "Loanz Daily Spaces." }
        ]
      },
      {
        subTitle: "ZAO Playlists",
        links: [
          { title: "ZAO Spotify 2024", url: "https://open.spotify.com/playlist/2IIl13a4YNxQTLNJhDKr32?si=1bb3ef92068143cf", description: "Listen to ZAO Spotify 2024 playlist." },
          { title: "ZAO Spotify 2025", url: "https://open.spotify.com/playlist/7MCDgGzyqbnsyKSNuMUUpM?si=2652032d60de4b93", description: "Listen to ZAO Spotify 2025 playlist." },
          { title: "ZAO SOUND.XYZ Playlist", url: "https://www.sound.xyz/playlist/1e1ab680-2f45-4232-9c34-b6ba9dc1a1d3", description: "Listen to the ZAO SOUND.XYZ Playlist." }
        ]
      },
      {
        subTitle: "ZAO CMOTM Interviews",
        links: [
          { title: "Daniel Obute Interview", url: "https://paragraph.xyz/@thezao/ztalentnewsletter12", description: "Daniel Obute Interview." },
          { title: "Davyd Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-1-davyd", description: "Davyd Interview." },
          { title: "Tej Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-2", description: "Tej Interview." },
          { title: "Ohnahji B Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-3", description: "Ohnahji B Interview." },
          { title: "CandyToyBox Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-4", description: "CandyToyBox Interview." },
          { title: "Hurric4n3Ike Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-5-hurric4n3ike", description: "Hurric4n3Ike Interview." },
          { title: "Heather Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-6", description: "Heather Interview." },
          { title: "Attabotty Interview", url: "https://paragraph.xyz/@thezao/ztalent-interview-7-attabotty", description: "Attabotty Interview." }
        ]
      }
    ]
  },
  {
    mainCategory: "ZAO Community Links",
    subcategories: [
      {
        subTitle: "C.O.C ConcertZ",
        links: [
          { title: "C.O.C ConcertZ Website", url: "https://cocconcertz.com/", description: "Official website for C.O.C ConcertZ — Community of Creators live shows and events." },
          { title: "C.O.C ConcertZ Videos", url: "https://www.youtube.com/watch?v=0MIJ0YSVe5s&list=PLAJfhSekeHMLPEd-PjFnuU_UZmXFR5kvA", description: "Watch the full collection of C.O.C ConcertZ performances on YouTube." }
        ]
      },
      {
        subTitle: "MidiPunkZ",
        links: [
          { title: "Main website", url: "https://midipunkz.com/", description: "The official MidiPunkZ website." },
          { title: "MidiVaderz game", url: "https://midipunkz.com/games", description: "Play MidiVaderz on the MidiPunkZ website." },
          { title: "MidiPunkz Community", url: "https://ima.midipunkz.com/communities/midipunkz", description: "Join the MidiPunkz community on IMA." },
          { title: "MiDi FeatherFrogs Community", url: "https://ima.midipunkz.com/communities/featherfrogs", description: "Explore the FeatherFrogs community on IMA." },
          { title: "Midi Avatars", url: "https://midipunkz.com/midiezz", description: "Browse and collect MidiPunkz avatars." },
          { title: "ZAO Community Page", url: "https://ima.midipunkz.com/communities/the-zao", description: "Check out the ZAO's dedicated community space on midipunkz.com." }
        ]
      }
    ]
  },
  {
    mainCategory: "ZAO Community Members",
    subcategories: [
      {
        subTitle: "ZAO Founder BetterCallZaal Links",
        links: [
          { title: "BetterCallZaal Linktree", url: "https://linktr.ee/bettercallzaal", description: "Access all BetterCallZaal links and resources on Linktree." },
          { title: "Personal Meeting Room (Huddle01)", url: "https://huddle01.app/room/zfp-tzyh-anm", description: "Enter your personal meeting room." },
          { title: "Meet with Zaal (Calendly)", url: "https://calendly.com/zaalp99/30minmeeting", description: "Schedule a meeting with Zaal." }
        ]
      },
      {
        subTitle: "ZAO Founder BetterCallZaal Interviews",
        links: [
          { title: "Interview #0 (3/28/24): Blitzscaling w/Bayo", url: "https://youtu.be/FKyIS-h3fNY", description: "Interview #0: Blitzscaling a Startup w/Bayo." },
          { title: "Interview #1 (11/14/24): ZAO Fractal w/NovaCrypto", url: "https://www.youtube.com/watch?v=0_WvwzBvs90&ab_channel=NovaCryptoLTD", description: "Interview #1: ZAO Fractal w/NovaCrypto." },
          { title: "Interview #2 (4/1/25): ZAO w/Lindsey", url: "https://www.youtube.com/watch?v=SXmdO6l4Rfg&ab_channel=TokenForYourThoughtsPodcast", description: "Interview #2: ZAO w/Lindsey." },
          { title: "Interview #3 (4/10/25): THE ZAO w/Will T", url: "https://www.youtube.com/watch?v=oVp0d1BBmko&ab_channel=ReFiDAO", description: "Interview #3: THE ZAO w/Will T." },
          { title: "Interview #4 (5/1/25): HomeBase w/Lucciano", url: "https://x.com/homebasedotlove/status/1922395779710484768", description: "Interview #4: HomeBase Interview with Lucciano." },
          { title: "Interview #5 (5/8/25): Build on Base Ep1", url: "https://x.com/buildonbase/status/1915148687061164474", description: "Interview #5: Build on Base Ep1." },
          { title: "Interview #6 (9/12/25): HomeBase w/Lucciano (Follow-up)", url: "https://x.com/homebasedotlove/status/1962595815429689476", description: "Interview #6: HomeBase follow-up with Lucciano." },
          { title: "Interview #7 (9/17/25): Late Night on Base w/Bill", url: "https://x.com/latenightonbase/status/1966208011447484853", description: "Interview #7: Guest appearance on Late Night on Base with Bill." }
        ]
      },
      {
        subTitle: "BetterCallZaal Media (KFMedia Talks)",
        links: [
          { title: "Zaal KFMedia Talk #1", url: "https://stuff.io/video/kfm-talks-with-zaal-the-zao-revolution/", description: "KFMedia Talks featuring Zaal discussing The ZAO, creator ownership, and decentralized culture." }
        ]
      },
      {
        subTitle: "ZAO Partners (Template)",
        links: [
          { title: "Add Partner Name Here", url: "#", description: "Replace this with an official partner link." }
        ]
      },
      {
        subTitle: "Past Collaborations (Template)",
        links: [
          { title: "Add Collaboration Here", url: "#", description: "Replace this with an article, recap, or announcement link." }
        ]
      },
      {
        subTitle: "ZAO Co-Founder CandyToyBox Links",
        links: [
          { title: "CandyToyBox Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder CandyToyBox." }
        ]
      },
      {
        subTitle: "ZAO Co-Founder Attabotty Links",
        links: [
          { title: "Attabotty Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder Attabotty." }
        ]
      },
      {
        subTitle: "ZAO Co-Founder HURRIC4N3IKE Links",
        links: [
          { title: "HURRIC4N3IKE Test Link", url: "https://thezao.com", description: "Test link for ZAO Co-Founder HURRIC4N3IKE." }
        ]
      },
      {
        subTitle: "ZAO Co-Founder Jango UU Links",
        links: [
          { title: "Instagram", url: "https://www.instagram.com/jangouuforever?igsh=MTl4bTRodXl2bDU4Mw%3D%3D&utm_source=qr", description: "Follow Jango UU on Instagram." },
          { title: "X (Twitter)", url: "https://x.com/jangouuforever?s=11&t=lwnZlcNedjeVZeQDTcNEwQ", description: "Follow Jango UU on X (Twitter)." },
          { title: "Spotify", url: "https://open.spotify.com/artist/5nc2dgefoPLfvsrJVx3PNz?si=Xhzfg5n1Q3uHVJHHawp8KA", description: "Listen to Jango UU on Spotify." }
        ]
      },
      {
        subTitle: "ZAO Staff EZinCrypto Links",
        links: [
          { title: "EZinCrypto Test Link", url: "https://thezao.com", description: "Test link for ZAO Staff EZinCrypto." }
        ]
      },
      {
        subTitle: "ZAO Staff Ohnahji B Links",
        links: [
          { title: "Ohnahji Linktree", url: "https://linktr.ee/ohnahji", description: "Linktree for Ohnahji B." }
        ]
      },
      {
        subTitle: "ZAO Community Member Jed XO Links",
        links: [
          { title: "Jed XO Test Link", url: "https://thezao.com", description: "Test link for ZAO Community Member Jed XO." }
        ]
      },
      {
        subTitle: "ZAO Musician GodCloud",
        links: [
          { title: "GodCloud Website", url: "https://godcloud.org", description: "Website for GodCloud." },
          { title: "GodCloud Drip.haus", url: "https://drip.haus/godcloud", description: "Collect GodCloud tracks." }
        ]
      }
    ]
  }
];
