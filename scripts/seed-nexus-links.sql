-- Seed script: Migrate all NexusV2 links to Supabase nexus_links table
-- Run this in the Supabase SQL Editor after creating the nexus_links table
-- Generated from NexusV2/app/data/links.ts + community.config.ts partners

-- Clear existing data (safe to re-run)
TRUNCATE nexus_links;

-- ============================================================
-- 1. ZAO Onchain > ZAO Tokens
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Mint ZAO-CHELLA Vibez Track on Zora', 'https://song.thezao.com', 'Own a piece of the ZAO-CHELLA experience by minting the Vibez track.', 'ZAO Onchain', 'ZAO Tokens', 'MUSIC', 1, ARRAY['mint', 'nft', 'zora']),
('Mint Attabotty ZAO-PALOOZA Card', 'https://attabotty.zao.cards', 'Collect the limited-edition Attabotty artist card from ZAO-PALOOZA.', 'ZAO Onchain', 'ZAO Tokens', 'MUSIC', 2, ARRAY['mint', 'nft', 'artist-card']),
('Mint Zalora - the ZAO Mascot (MidiVerse)', 'https://zalora.thezao.com', 'Bring Zalora into your wallet - the on-chain mascot of the ZAO.', 'ZAO Onchain', 'ZAO Tokens', 'MUSIC', 3, ARRAY['mint', 'nft', 'mascot']);

-- ============================================================
-- 1. ZAO Onchain > ZAO Tracks
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO song #1: ZAO-CHELLA VIBEZ', 'https://zora.co/collect/base:0x1458f7d12c1fe1747e13793d99dcb6da6f9d6123/1?referrer=0xa46b072e6607d37413000220653d3bca5be32513', 'Vibe to the first official ZAO track from ZAO-CHELLA.', 'ZAO Onchain', 'ZAO Tracks', 'MUSIC', 1, ARRAY['track', 'zora', 'mint']),
('ZAO song #2: ZAO-CHELLA CYPHER', 'https://www.thezao.com/zao-cypher', 'Listen to the multi-artist Cypher track from ZAO-CHELLA.', 'ZAO Onchain', 'ZAO Tracks', 'MUSIC', 2, ARRAY['track']),
('ZAO song #3: Side by Side (ZAO Side)', 'https://ima.midipunkz.com/midivaderz/side-by-side-thezao', 'Watch the Side-by-Side collab in MidiVaderZ - ZAO side.', 'ZAO Onchain', 'ZAO Tracks', 'MUSIC', 3, ARRAY['track', 'collab', 'midipunkz']),
('ZAO song #3.1: Side by Side (MidiPunkz Side)', 'https://ima.midipunkz.com/midivaderz/side-by-side-midipunkz', 'Watch the Side-by-Side collab in MidiVaderZ - MidiPunkz side.', 'ZAO Onchain', 'ZAO Tracks', 'MUSIC', 4, ARRAY['track', 'collab', 'midipunkz']);

-- ============================================================
-- 2. ZAO Links > ZAO Platforms
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_featured) VALUES
('ZAO Website', 'https://thezao.com', 'Visit the official ZAO website for all the latest news and resources.', 'ZAO Links', 'ZAO Platforms', 'SOCIAL', 1, ARRAY['official', 'website'], true),
('ZOR DAO', 'http://zao.frapps.xyz/', 'Access ZOR DAO - the decentralized governance hub for The ZAO.', 'ZAO Links', 'ZAO Platforms', 'GOVERN', 2, ARRAY['dao', 'governance']),
('ZAO ORG CHART (Hats Tree)', 'https://hats.thezao.com', 'Dive into the ZAO ORG CHART to see our team and projects.', 'ZAO Links', 'ZAO Platforms', 'GOVERN', 3, ARRAY['org-chart', 'hats']),
('ZAO YouTube', 'https://www.youtube.com/@thezaodao', 'Official ZAO YouTube channel.', 'ZAO Links', 'ZAO Platforms', 'SOCIAL', 4, ARRAY['youtube', 'video']),
('ZAO Paragraph', 'https://paragraph.com/@thezao', 'ZAO writing and updates on Paragraph.', 'ZAO Links', 'ZAO Platforms', 'SOCIAL', 5, ARRAY['newsletter', 'writing']);

-- ============================================================
-- 2. ZAO Links > Calendars
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO Google Calendar', 'https://calendar.google.com/calendar/u/0?cid=MmY3YTQ4YTY2MWIyNzVlMmFkZTgxYzlhYjJkMGFhM2E1YTBmNThiNTA3MDVhOTYxZGE2NWNmNTE0MTZjZGU3NUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t', 'Stay up to date with ZAO events on Google Calendar.', 'ZAO Links', 'Calendars', 'SOCIAL', 1, ARRAY['calendar', 'events']),
('ZAO Calendar (Luma)', 'https://lu.ma/zao', 'Browse upcoming ZAO events and activities on Luma.', 'ZAO Links', 'Calendars', 'SOCIAL', 2, ARRAY['calendar', 'events', 'luma']),
('ZAO Music Events Calendar', 'https://lu.ma/zao-m', 'Explore ZAO music-related events and gigs on Luma.', 'ZAO Links', 'Calendars', 'MUSIC', 3, ARRAY['calendar', 'events', 'music', 'luma']);

-- ============================================================
-- 2. ZAO Links > ZAO Social Media Chats
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Discord', 'https://discord.gg/ACJyYQH3BE', 'Join our ZAO Discord for real-time group chats.', 'ZAO Links', 'ZAO Social Media Chats', 'SOCIAL', 1, ARRAY['discord', 'chat']),
('Telegram', 'https://t.me/+iMH5Y_t2Mks1NmVh', 'Connect with us on Telegram for updates and discussions.', 'ZAO Links', 'ZAO Social Media Chats', 'SOCIAL', 2, ARRAY['telegram', 'chat']),
('Retake (Zaal)', 'https://retake.tv/zaal', 'Zaal on Retake.', 'ZAO Links', 'ZAO Social Media Chats', 'SOCIAL', 3, ARRAY['retake', 'streaming']),
('BetterCallZaal Twitch', 'https://www.twitch.tv/bettercallzaal', 'BetterCallZaal live streams on Twitch.', 'ZAO Links', 'ZAO Social Media Chats', 'SOCIAL', 4, ARRAY['twitch', 'streaming']);

-- ============================================================
-- 2. ZAO Links > ZAO Whitepaper
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO Whitepaper Draft', 'https://app.charmverse.io/the-zao/the-zao-whitepaper-draft-2-6565388910657037', 'Dive into the ZAO Whitepaper for a deeper understanding of the ecosystem.', 'ZAO Links', 'ZAO Whitepaper', 'GOVERN', 1, ARRAY['whitepaper', 'docs']);

-- ============================================================
-- 2. ZAO Links > Daily Newsletter Articles
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Daily Newsletter Articles', 'https://paragraph.xyz/@thezao', 'Read daily newsletter articles.', 'ZAO Links', 'Daily Newsletter', 'SOCIAL', 1, ARRAY['newsletter', 'paragraph']),
('Subscribe to the newsletter', 'https://paragraph.xyz/@thezao/subscribe', 'Subscribe for daily updates.', 'ZAO Links', 'Daily Newsletter', 'SOCIAL', 2, ARRAY['newsletter', 'subscribe']);

-- ============================================================
-- 3. ZAO Projects > WaveWarZ (core links only - trimmed from 40 to essentials + content)
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_featured) VALUES
('WaveWarZ Homepage - FLIX.fun', 'https://flix.fun', 'Live-traded music battles streaming 24/7 on FLIX.fun.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 1, ARRAY['wavewarz', 'streaming', 'battles'], true),
('WaveWarZ Website', 'https://wavewarz.com', 'Official WaveWarZ site for live-traded music battles.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 2, ARRAY['wavewarz', 'official']),
('WaveWarZ Docs', 'https://www.wavewarz.com/docs', 'Developer and participant documentation for WaveWarZ.', 'ZAO Projects', 'WaveWarZ', 'BUILD', 3, ARRAY['wavewarz', 'docs']),
('WaveWarZ Whitepaper Draft', 'https://hackmd.io/@R2firT46QtyhbpzPCBL7gw/rkq_NaYagx', 'Read the WaveWarZ whitepaper draft on HackMD.', 'ZAO Projects', 'WaveWarZ', 'BUILD', 4, ARRAY['wavewarz', 'whitepaper']);

INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('WaveWarZ X (Twitter)', 'https://x.com/WaveWarZ', 'Follow WaveWarZ on X for battle updates and highlights.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 1, ARRAY['wavewarz', 'twitter']),
('WaveWarZ YouTube', 'https://www.youtube.com/@WaveWarZ', 'Watch WaveWarZ battles and interviews on YouTube.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 2, ARRAY['wavewarz', 'youtube']),
('WaveWarZ Twitch', 'https://www.twitch.tv/wavewarzofficial', 'Stream live WaveWarZ events on Twitch.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 3, ARRAY['wavewarz', 'twitch']),
('WaveWarZ Zora', 'https://zora.co/wavewarz', 'Collect WaveWarZ drops on Zora.', 'ZAO Projects', 'WaveWarZ Socials', 'MUSIC', 4, ARRAY['wavewarz', 'zora', 'nft']),
('WaveWarZ Farcaster', 'https://farcaster.xyz/wavewarz', 'Follow WaveWarZ activity on Farcaster.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 5, ARRAY['wavewarz', 'farcaster']),
('WaveWarZ Instagram', 'https://www.instagram.com/wavewarz/', 'Follow WaveWarZ on Instagram for visuals and clips.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 6, ARRAY['wavewarz', 'instagram']),
('WaveWarZ Telegram', 'https://t.me/wavewarz', 'Join the WaveWarZ Telegram community.', 'ZAO Projects', 'WaveWarZ Socials', 'SOCIAL', 7, ARRAY['wavewarz', 'telegram']),
('Artist Sign-Up Form', 'https://tally.so/r/wQZ5a7', 'Apply to battle in upcoming WaveWarZ events.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 5, ARRAY['wavewarz', 'signup', 'form']),
('Newsletter Sign-Up', 'https://subscribepage.io/XFM0pk', 'Subscribe to WaveWarZ news and announcements.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 6, ARRAY['wavewarz', 'newsletter']),
('WaveWarZ OG Badge - Magnetiq', 'https://app.magnetiq.xyz/brand/WaveWarZ/magnet/WaveWarZ%20OGz', 'Collect the official WaveWarZ OG Badge on Magnetiq.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 7, ARRAY['wavewarz', 'badge', 'magnetiq']),
('WaveWarZ Songjam Leaderboard', 'https://leaderboard.songjam.space/', 'WaveWarZ leaderboard powered by Songjam.', 'ZAO Projects', 'WaveWarZ', 'MUSIC', 8, ARRAY['wavewarz', 'leaderboard', 'songjam']);

-- WaveWarZ Partners
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('SIGEA Cloud', 'https://sigeacloud.io', 'Official partner - SIGEA Cloud.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 1, ARRAY['wavewarz', 'partner']),
('SIGEA X', 'https://x.com/SigeaOfficial', 'Follow SIGEA Cloud on X.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 2, ARRAY['wavewarz', 'partner']),
('Quakey Nation', 'https://www.quakeycoin.com/', 'Partner: Quakey Nation ecosystem.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 3, ARRAY['wavewarz', 'partner']),
('Quakey Nation X', 'https://x.com/QUAKEYOFFICIALX', 'Follow Quakey Nation on X.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 4, ARRAY['wavewarz', 'partner']),
('Flix.Fun', 'https://flix.fun/', 'Home of WaveWarZ TV - continuous streaming.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 5, ARRAY['wavewarz', 'partner', 'streaming']),
('Flix.Fun X', 'https://x.com/FLIXdotFUN', 'Follow FLIX.fun on X for media and event updates.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 6, ARRAY['wavewarz', 'partner']),
('Magnetiq X', 'https://x.com/magnetiq_xyz', 'Follow Magnetiq on X.', 'ZAO Projects', 'WaveWarZ Partners', 'BUILD', 7, ARRAY['wavewarz', 'partner', 'magnetiq']);

-- WaveWarZ Content/Interviews
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('How To Trade Music on WaveWarZ', 'https://www.youtube.com/results?search_query=How+To+Trade+Music+on+WaveWarZ', 'Video guide: timed music battles and trading walkthrough.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 1, ARRAY['wavewarz', 'tutorial', 'video']),
('How Much Can You MAKE Trading?', 'https://www.youtube.com/results?search_query=How+Much+Can+You+MAKE+Trading+on+WaveWarZ', 'Breakdown of rewards and mechanics for traders.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 2, ARRAY['wavewarz', 'tutorial', 'video']),
('First Hosted Artist Interview', 'https://x.com/CandyToyBoxYT1/status/1958656914793144704', 'WaveWarZ artist interview hosted by CandyToyBox.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 3, ARRAY['wavewarz', 'interview']),
('LIVE Update #6', 'https://x.com/WaveWarZ/status/1958908419622281658', 'WaveWarZ live update #6 on X.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 4, ARRAY['wavewarz', 'update']),
('Songjam Interview', 'https://x.com/SongjamSpace/status/1957865525545197905', 'The Future of Music Engagement with Adam Place.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 5, ARRAY['wavewarz', 'interview', 'songjam']),
('Darkside Podcast', 'https://x.com/DPodocasts/status/1955375718835294281', 'WaveWarZ feature on Darkside Podcast.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 6, ARRAY['wavewarz', 'podcast', 'interview']),
('Omniflix / Cosmos Ecosystem Mentions', 'https://x.com/CosmosEcosystem/status/1957439621777825938', 'Cosmos ecosystem shoutout to WaveWarZ.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 7, ARRAY['wavewarz', 'press']),
('Twisted Tweak Interview by Chumwizard', 'https://x.com/Chumwizards/status/1957597676989739350', 'Interview and article on Twisted Tweak.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 8, ARRAY['wavewarz', 'interview']),
('Clout.FM Interview by Clouty', 'https://x.com/RjSmithy/status/1952444479069458452', 'Clout.FM interview about WaveWarZ.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 9, ARRAY['wavewarz', 'interview']),
('Flix.Talk Episode', 'https://x.com/FLIXdotFUN/status/1953504352716681405', 'Flix.Talk conversation featuring WaveWarZ.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 10, ARRAY['wavewarz', 'interview']),
('Karate Kombat Walkout Music Collab', 'https://x.com/WaveWarZ/status/1954924153112334370', 'Walkout theme created by Hurricane & Cannon for MokokaFlow.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 11, ARRAY['wavewarz', 'collab']),
('LUI & Stilo X Space', 'https://x.com/Cryptogodlui/status/1950602534864953432', 'WaveWarZ X Space featuring LUI & Stilo.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 12, ARRAY['wavewarz', 'space']),
('Cannon Jones Battle Card (V1)', 'https://x.com/cannonjones973/status/1953020510360490134', 'Animated battle card by Cannon Jones - V1.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 13, ARRAY['wavewarz', 'art']),
('Cannon Jones Battle Card (V2)', 'https://x.com/i/status/1953603013370950096', 'Animated battle card by Cannon Jones - V2.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 14, ARRAY['wavewarz', 'art']),
('Art by Mumbo', 'https://x.com/o_mumb/status/1950974314460881117', 'Community art contribution by Mumbo.', 'ZAO Projects', 'WaveWarZ Content', 'MUSIC', 15, ARRAY['wavewarz', 'art']);

-- WaveWarZ Wallets
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Phantom Wallet', 'https://phantom.com/', 'Solana wallet for connecting to WaveWarZ.', 'ZAO Projects', 'WaveWarZ Wallets', 'BUILD', 1, ARRAY['wavewarz', 'wallet', 'solana']),
('Solflare', 'https://www.solflare.com/', 'Alternative Solana wallet compatible with WaveWarZ.', 'ZAO Projects', 'WaveWarZ Wallets', 'BUILD', 2, ARRAY['wavewarz', 'wallet', 'solana']),
('Solscan', 'https://solscan.io/', 'Blockchain explorer for Solana transactions.', 'ZAO Projects', 'WaveWarZ Wallets', 'BUILD', 3, ARRAY['wavewarz', 'explorer', 'solana']);

-- ============================================================
-- 3. ZAO Projects > ZABAL
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_featured) VALUES
('ZABAL on Songjam', 'https://songjam.space/zabal', 'ZABAL hub on Songjam.', 'ZAO Projects', 'ZABAL', 'EARN', 1, ARRAY['zabal', 'songjam'], true),
('ZABAL Website', 'https://zabal.art', 'Official ZABAL website.', 'ZAO Projects', 'ZABAL', 'EARN', 2, ARRAY['zabal', 'official']),
('ZABAL Incented', 'https://incented.zabal.art', 'ZABAL quests and incentives via Incented.', 'ZAO Projects', 'ZABAL', 'EARN', 3, ARRAY['zabal', 'incented', 'quests']),
('ZABAL Update #7', 'https://paragraph.com/@thezao/zabal-update-7', 'ZABAL progress update on Paragraph.', 'ZAO Projects', 'ZABAL', 'EARN', 4, ARRAY['zabal', 'update']),
('ZABAL Connector', 'https://zabal.lol', 'Get the ZABAL connector.', 'ZAO Projects', 'ZABAL', 'EARN', 5, ARRAY['zabal', 'tool']);

-- ============================================================
-- 3. ZAO Projects > ZAO Festivals
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO Festivals Website', 'https://zaofestivals.com/', 'Visit the official ZAO Festivals website.', 'ZAO Projects', 'ZAO Festivals', 'MUSIC', 1, ARRAY['festivals', 'official']),
('Merch', 'https://merch.zaofestivals.com', 'Shop for ZAO Festivals merchandise.', 'ZAO Projects', 'ZAO Festivals', 'MUSIC', 2, ARRAY['festivals', 'merch']),
('Donate', 'https://giveth.io/project/sustaining-zao-festivals-creativity-technology?tab=donations', 'Donate to support ZAO Festivals.', 'ZAO Projects', 'ZAO Festivals', 'MUSIC', 3, ARRAY['festivals', 'donate']),
('ZAO PALOOZA Artist Cards', 'https://zao.cards', 'View ZAO PALOOZA Artist Cards.', 'ZAO Projects', 'ZAO Festivals', 'MUSIC', 4, ARRAY['festivals', 'nft', 'artist-card']);

-- ZAO Festivals Socials
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO Festivals Twitter', 'https://x.com/zaofestivals?lang=en', 'Follow ZAO Festivals on Twitter.', 'ZAO Projects', 'ZAO Festivals Socials', 'SOCIAL', 1, ARRAY['festivals', 'twitter']),
('ZAO Festivals Instagram', 'https://www.instagram.com/zaofestivals/', 'Follow ZAO Festivals on Instagram.', 'ZAO Projects', 'ZAO Festivals Socials', 'SOCIAL', 2, ARRAY['festivals', 'instagram']),
('ZAO Festivals Facebook', 'https://www.facebook.com/ZAOFestivals', 'Like ZAO Festivals on Facebook.', 'ZAO Projects', 'ZAO Festivals Socials', 'SOCIAL', 3, ARRAY['festivals', 'facebook']),
('ZAO Festivals LinkedIn', 'https://www.linkedin.com/company/zaofestivals', 'Connect with ZAO Festivals on LinkedIn.', 'ZAO Projects', 'ZAO Festivals Socials', 'SOCIAL', 4, ARRAY['festivals', 'linkedin']),
('ZAO Festivals YouTube', 'https://www.youtube.com/@zaofestivals', 'Watch ZAO Festivals videos on YouTube.', 'ZAO Projects', 'ZAO Festivals Socials', 'SOCIAL', 5, ARRAY['festivals', 'youtube']);

-- ============================================================
-- 3. ZAO Projects > $Loanz
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('$Loanz OG Whitepaper', 'https://paragraph.xyz/@thezao/student-loanz-whitepaper', 'Dive into the original $Loanz Whitepaper for in-depth info on Student Loanz.', 'ZAO Projects', '$Loanz', 'EARN', 1, ARRAY['loanz', 'whitepaper']),
('$Loanz website', 'https://studentloanz.xyz/', 'Visit the official $Loanz website to explore student loan solutions.', 'ZAO Projects', '$Loanz', 'EARN', 2, ARRAY['loanz', 'official']),
('$Loanz memebook', 'https://zao.lol', 'Make your own $loanz memes.', 'ZAO Projects', '$Loanz', 'SOCIAL', 3, ARRAY['loanz', 'memes']),
('Loanz Daily Spaces', 'https://x.com/loanzonbase', 'Loanz Daily Spaces.', 'ZAO Projects', '$Loanz', 'SOCIAL', 4, ARRAY['loanz', 'spaces']);

-- ============================================================
-- 3. ZAO Projects > ZAO Playlists
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('ZAO Spotify 2024', 'https://open.spotify.com/playlist/2IIl13a4YNxQTLNJhDKr32?si=1bb3ef92068143cf', 'Listen to ZAO Spotify 2024 playlist.', 'ZAO Projects', 'ZAO Playlists', 'MUSIC', 1, ARRAY['playlist', 'spotify']),
('ZAO Spotify 2025', 'https://open.spotify.com/playlist/7MCDgGzyqbnsyKSNuMUUpM?si=2652032d60de4b93', 'Listen to ZAO Spotify 2025 playlist.', 'ZAO Projects', 'ZAO Playlists', 'MUSIC', 2, ARRAY['playlist', 'spotify']),
('ZAO SOUND.XYZ Playlist', 'https://www.sound.xyz/playlist/1e1ab680-2f45-4232-9c34-b6ba9dc1a1d3', 'Listen to the ZAO SOUND.XYZ Playlist.', 'ZAO Projects', 'ZAO Playlists', 'MUSIC', 3, ARRAY['playlist', 'soundxyz']);

-- ============================================================
-- 3. ZAO Projects > ZAO CMOTM Interviews
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Daniel Obute Interview', 'https://paragraph.xyz/@thezao/ztalentnewsletter12', 'Daniel Obute Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 1, ARRAY['interview', 'cmotm']),
('Davyd Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-1-davyd', 'Davyd Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 2, ARRAY['interview', 'cmotm']),
('Tej Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-2', 'Tej Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 3, ARRAY['interview', 'cmotm']),
('Ohnahji B Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-3', 'Ohnahji B Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 4, ARRAY['interview', 'cmotm']),
('CandyToyBox Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-4', 'CandyToyBox Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 5, ARRAY['interview', 'cmotm']),
('Hurric4n3Ike Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-5-hurric4n3ike', 'Hurric4n3Ike Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 6, ARRAY['interview', 'cmotm']),
('Heather Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-6', 'Heather Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 7, ARRAY['interview', 'cmotm']),
('Attabotty Interview', 'https://paragraph.xyz/@thezao/ztalent-interview-7-attabotty', 'Attabotty Interview.', 'ZAO Projects', 'CMOTM Interviews', 'SOCIAL', 8, ARRAY['interview', 'cmotm']);

-- ============================================================
-- 4. ZAO Community Links > C.O.C ConcertZ
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('C.O.C ConcertZ Website', 'https://cocconcertz.com/', 'Official website for C.O.C ConcertZ - Community of Creators live shows and events.', 'ZAO Community', 'C.O.C ConcertZ', 'MUSIC', 1, ARRAY['cocconcertz', 'events']),
('C.O.C ConcertZ Videos', 'https://www.youtube.com/watch?v=0MIJ0YSVe5s&list=PLAJfhSekeHMLPEd-PjFnuU_UZmXFR5kvA', 'Watch the full collection of C.O.C ConcertZ performances on YouTube.', 'ZAO Community', 'C.O.C ConcertZ', 'MUSIC', 2, ARRAY['cocconcertz', 'video', 'youtube']);

-- ============================================================
-- 4. ZAO Community Links > MidiPunkZ
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('MidiPunkZ Main website', 'https://midipunkz.com/', 'The official MidiPunkZ website.', 'ZAO Community', 'MidiPunkZ', 'MUSIC', 1, ARRAY['midipunkz', 'partner']),
('MidiVaderz game', 'https://midipunkz.com/games', 'Play MidiVaderz on the MidiPunkZ website.', 'ZAO Community', 'MidiPunkZ', 'MUSIC', 2, ARRAY['midipunkz', 'game']),
('MidiPunkz Community', 'https://ima.midipunkz.com/communities/midipunkz', 'Join the MidiPunkz community on IMA.', 'ZAO Community', 'MidiPunkZ', 'SOCIAL', 3, ARRAY['midipunkz', 'community']),
('MiDi FeatherFrogs Community', 'https://ima.midipunkz.com/communities/featherfrogs', 'Explore the FeatherFrogs community on IMA.', 'ZAO Community', 'MidiPunkZ', 'SOCIAL', 4, ARRAY['midipunkz', 'featherfrogs']),
('Midi Avatars', 'https://midipunkz.com/midiezz', 'Browse and collect MidiPunkz avatars.', 'ZAO Community', 'MidiPunkZ', 'MUSIC', 5, ARRAY['midipunkz', 'nft', 'avatar']),
('ZAO Community Page on MidiPunkZ', 'https://ima.midipunkz.com/communities/the-zao', 'Check out the ZAO dedicated community space on midipunkz.com.', 'ZAO Community', 'MidiPunkZ', 'SOCIAL', 6, ARRAY['midipunkz', 'community']);

-- ============================================================
-- 5. ZAO Community Members > BetterCallZaal
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_featured) VALUES
('BetterCallZaal Linktree', 'https://linktr.ee/bettercallzaal', 'Access all BetterCallZaal links and resources on Linktree.', 'ZAO Members', 'BetterCallZaal', 'SOCIAL', 1, ARRAY['founder', 'zaal'], true),
('Personal Meeting Room (Huddle01)', 'https://huddle01.app/room/zfp-tzyh-anm', 'Enter your personal meeting room.', 'ZAO Members', 'BetterCallZaal', 'SOCIAL', 2, ARRAY['founder', 'zaal', 'meeting']),
('Meet with Zaal (Calendly)', 'https://calendly.com/zaalp99/30minmeeting', 'Schedule a meeting with Zaal.', 'ZAO Members', 'BetterCallZaal', 'SOCIAL', 3, ARRAY['founder', 'zaal', 'meeting']);

-- BetterCallZaal Interviews
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Interview #0 (3/28/24): Blitzscaling w/Bayo', 'https://youtu.be/FKyIS-h3fNY', 'Interview #0: Blitzscaling a Startup w/Bayo.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 1, ARRAY['founder', 'zaal', 'interview']),
('Interview #1 (11/14/24): ZAO Fractal w/NovaCrypto', 'https://www.youtube.com/watch?v=0_WvwzBvs90&ab_channel=NovaCryptoLTD', 'Interview #1: ZAO Fractal w/NovaCrypto.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 2, ARRAY['founder', 'zaal', 'interview']),
('Interview #2 (4/1/25): ZAO w/Lindsey', 'https://www.youtube.com/watch?v=SXmdO6l4Rfg&ab_channel=TokenForYourThoughtsPodcast', 'Interview #2: ZAO w/Lindsey.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 3, ARRAY['founder', 'zaal', 'interview']),
('Interview #3 (4/10/25): THE ZAO w/Will T', 'https://www.youtube.com/watch?v=oVp0d1BBmko&ab_channel=ReFiDAO', 'Interview #3: THE ZAO w/Will T.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 4, ARRAY['founder', 'zaal', 'interview']),
('Interview #4 (5/1/25): HomeBase w/Lucciano', 'https://x.com/homebasedotlove/status/1922395779710484768', 'Interview #4: HomeBase Interview with Lucciano.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 5, ARRAY['founder', 'zaal', 'interview']),
('Interview #5 (5/8/25): Build on Base Ep1', 'https://x.com/buildonbase/status/1915148687061164474', 'Interview #5: Build on Base Ep1.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 6, ARRAY['founder', 'zaal', 'interview']),
('Interview #6 (9/12/25): HomeBase w/Lucciano (Follow-up)', 'https://x.com/homebasedotlove/status/1962595815429689476', 'Interview #6: HomeBase follow-up with Lucciano.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 7, ARRAY['founder', 'zaal', 'interview']),
('Interview #7 (9/17/25): Late Night on Base w/Bill', 'https://x.com/latenightonbase/status/1966208011447484853', 'Interview #7: Guest appearance on Late Night on Base with Bill.', 'ZAO Members', 'BetterCallZaal Interviews', 'SOCIAL', 8, ARRAY['founder', 'zaal', 'interview']);

-- BetterCallZaal Media
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Zaal KFMedia Talk #1', 'https://stuff.io/video/kfm-talks-with-zaal-the-zao-revolution/', 'KFMedia Talks featuring Zaal discussing The ZAO, creator ownership, and decentralized culture.', 'ZAO Members', 'BetterCallZaal Media', 'SOCIAL', 1, ARRAY['founder', 'zaal', 'interview', 'media']);

-- ============================================================
-- 5. ZAO Community Members > Jango UU
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Jango UU Instagram', 'https://www.instagram.com/jangouuforever', 'Follow Jango UU on Instagram.', 'ZAO Members', 'Jango UU', 'SOCIAL', 1, ARRAY['member', 'artist', 'instagram']),
('Jango UU X (Twitter)', 'https://x.com/jangouuforever', 'Follow Jango UU on X (Twitter).', 'ZAO Members', 'Jango UU', 'SOCIAL', 2, ARRAY['member', 'artist', 'twitter']),
('Jango UU Spotify', 'https://open.spotify.com/artist/5nc2dgefoPLfvsrJVx3PNz', 'Listen to Jango UU on Spotify.', 'ZAO Members', 'Jango UU', 'MUSIC', 3, ARRAY['member', 'artist', 'spotify']);

-- ============================================================
-- 5. ZAO Community Members > Ohnahji B
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('Ohnahji Linktree', 'https://linktr.ee/ohnahji', 'Linktree for Ohnahji B.', 'ZAO Members', 'Ohnahji B', 'SOCIAL', 1, ARRAY['member', 'artist']);

-- ============================================================
-- 5. ZAO Community Members > GodCloud
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags) VALUES
('GodCloud Website', 'https://godcloud.org', 'Website for GodCloud.', 'ZAO Members', 'GodCloud', 'MUSIC', 1, ARRAY['member', 'artist']),
('GodCloud Drip.haus', 'https://drip.haus/godcloud', 'Collect GodCloud tracks.', 'ZAO Members', 'GodCloud', 'MUSIC', 2, ARRAY['member', 'artist', 'nft']);

-- ============================================================
-- 6. Partners from community.config.ts (NOT in NexusV2 yet)
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_featured) VALUES
('MAGNETIQ', 'https://app.magnetiq.xyz', 'Proof of Meet hub - verify real-world connections and earn attestations.', 'Ecosystem', 'Partners', 'SOCIAL', 1, ARRAY['partner', 'pom', 'attestation'], true),
('SongJam', 'https://songjam.space/zabal', 'Live audio spaces & ZABAL mention leaderboard - host rooms, earn points.', 'Ecosystem', 'Partners', 'MUSIC', 2, ARRAY['partner', 'audio', 'leaderboard'], true),
('Empire Builder', 'https://empirebuilder.world', 'Token empire rewards - stake and earn in the ZABAL ecosystem.', 'Ecosystem', 'Partners', 'EARN', 3, ARRAY['partner', 'staking', 'rewards'], true),
('Incented', 'https://incented.co/organizations/zabal', 'Community campaigns - bounties and tasks that grow the ZAO.', 'Ecosystem', 'Partners', 'EARN', 4, ARRAY['partner', 'bounties', 'quests'], true),
('Clanker', 'https://clanker.world', '$ZABAL token launcher - the origin of the community token.', 'Ecosystem', 'Partners', 'EARN', 5, ARRAY['partner', 'token'], true),
('ZOUNZ', 'https://nouns.build/dao/base/0xCB80Ef04DA68667c9a4450013BDD69269842c883', 'ZABAL Nouns DAO - daily NFT auctions funding the community treasury on Base.', 'Ecosystem', 'Partners', 'GOVERN', 6, ARRAY['partner', 'dao', 'nouns', 'nft'], true);

-- ============================================================
-- 7. ZAO OS Internal Links (NEW - not in NexusV2)
-- ============================================================
INSERT INTO nexus_links (title, url, description, category, subcategory, portal_group, sort_order, tags, is_gated) VALUES
('ZAO OS App', 'https://zaoos.com', 'Main ZAO community app - chat, music, governance, and more.', 'ZAO Platforms', 'ZAO OS', 'VIP', 1, ARRAY['zaoos', 'app', 'official'], true),
('ZOE Dashboard', 'https://zoe.zaoos.com', 'Agent dashboard - manage ZOE and the agent squad.', 'ZAO Platforms', 'ZAO OS', 'BUILD', 2, ARRAY['zaoos', 'agents', 'zoe']),
('Pixel Agents', 'https://pixels.zaoos.com', 'Pixel agent office - visualize your agent squad.', 'ZAO Platforms', 'ZAO OS', 'BUILD', 3, ARRAY['zaoos', 'agents', 'pixels']),
('FISHBOWLZ', 'https://fishbowlz.com', 'Music battles and NFT jukebox.', 'ZAO Platforms', 'ZAO OS', 'MUSIC', 4, ARRAY['zaoos', 'fishbowlz', 'music']),
('Paperclip', 'https://paperclip.zaoos.com', 'Paperclip agent interface.', 'ZAO Platforms', 'ZAO OS', 'BUILD', 5, ARRAY['zaoos', 'agents', 'paperclip']);

-- ============================================================
-- NOTE: Placeholder links REMOVED (not migrated)
-- These were test links pointing to thezao.com or #:
--   - CandyToyBox Test Link
--   - Attabotty Test Link
--   - HURRIC4N3IKE Test Link
--   - EZinCrypto Test Link
--   - Jed XO Test Link
--   - "Add Partner Name Here"
--   - "Add Collaboration Here"
--   - "Artist Agreement" (#)
-- These can be added back via the admin UI when real links are available.
-- ============================================================

-- Verify count
SELECT
  category,
  COUNT(*) as link_count
FROM nexus_links
GROUP BY category
ORDER BY category;
