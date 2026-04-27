import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZAOstock Team - Help',
  robots: { index: false, follow: false },
};

interface HelpEntry {
  id: string;
  title: string;
  body: React.ReactNode;
}

const ENTRIES: HelpEntry[] = [
  {
    id: 'login',
    title: 'How do I log in?',
    body: (
      <>
        <p>You have a private 4-letter code (Zaal DM&rsquo;d it to you). Codes use the alphabet A-Z and digits 2-9 - no 0, O, 1, I, or L because those look alike.</p>
        <p>Hit <Link href="/stock/team" className="text-[#f5a623] hover:underline">/stock/team</Link>, drop your code, you&rsquo;re in. The session lasts 30 days. If you lose the code, ping <a href="https://x.com/bettercallzaal" className="text-[#f5a623] hover:underline" target="_blank" rel="noreferrer">@bettercallzaal</a>.</p>
      </>
    ),
  },
  {
    id: 'profile',
    title: 'Setting up your profile',
    body: (
      <>
        <p>On the home tab there&rsquo;s a card called <strong>Your Profile</strong>. Click Edit and you can set:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Photo</strong> - paste any image URL ending in .jpg / .png / .webp. Right-click your X or Farcaster avatar -&gt; &ldquo;Copy image address&rdquo; works great.</li>
          <li><strong>Bio</strong> - the rich-text editor lets you bold, italicize, add headings, lists, links. Just like Notion or Google Docs.</li>
          <li><strong>Links</strong> - one row per link. Hit &ldquo;+ Add another link&rdquo; for more. We auto-detect what each is (X, Farcaster, email, website).</li>
          <li><strong>Status</strong> - one short line of what you&rsquo;re working on right now. Updates often. Shows up on your profile and in the Team directory.</li>
          <li><strong>Team</strong> - which circle you&rsquo;re in. Filters which todos you see by default.</li>
        </ul>
        <p>Profile complete % shows in the card header. Aim for green (100%).</p>
      </>
    ),
  },
  {
    id: 'editor',
    title: 'Using the bio editor',
    body: (
      <>
        <p>The bio editor is WYSIWYG - what you see is what you get. No markdown syntax to remember.</p>
        <p><strong>Toolbar</strong> across the top: B (bold) / I (italic) / H (heading) / h (subheading) / bullet list / numbered list / quote / link / divider / clear formatting.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Select some text, click <strong>B</strong> -&gt; instantly bold</li>
          <li>Click <strong>Link</strong> with text selected -&gt; URL prompt opens, paste a URL</li>
          <li>Hit Enter twice for a new paragraph (blank line between)</li>
          <li>Type <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">## </code> at the start of a line for a heading</li>
          <li>Type <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">- </code> at the start for a bullet list</li>
          <li>Paste from Notion, Google Docs, or anywhere - formatting carries over</li>
        </ul>
        <p>Toolbar buttons highlight when your cursor is inside that style. Char counter (top right) goes red over 2000.</p>
      </>
    ),
  },
  {
    id: 'directory',
    title: 'Finding teammates (the Team tab)',
    body: (
      <>
        <p>The Team tab shows everyone on the roster.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Search</strong> by name, bio, link, or status - matches anywhere in the text</li>
          <li><strong>Filter</strong> by scope (Operations / Music / Finance / Design)</li>
          <li><strong>Reach out</strong> button - opens their X / Farcaster / email directly (whichever they listed first)</li>
          <li><strong>Share profile</strong> - copies a URL to their public page so you can drop it in DMs</li>
          <li>Click a name -&gt; their public profile at <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/stock/team/m/&lt;name&gt;</code></li>
        </ul>
      </>
    ),
  },
  {
    id: 'circles',
    title: 'Circles (governance + team membership)',
    body: (
      <>
        <p>ZAOstock has 8 working circles: Music, Ops, Partners, Finance, Merch, Marketing, Media, Host. You can be in 1 or many.</p>
        <p>Circles are managed via the team Telegram bot (<a href="https://t.me/ZAOstockTeamBot" target="_blank" rel="noreferrer" className="text-[#f5a623] hover:underline">@ZAOstockTeamBot</a>), not the dashboard:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/circles</code> - see all 8 + who coordinates each</li>
          <li><code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/join &lt;slug&gt;</code> - grab one (e.g. <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/join music</code>)</li>
          <li><code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/leave &lt;slug&gt;</code> - step out</li>
          <li><code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/mycircles</code> - your list</li>
          <li><code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/buddy</code> - get auto-paired with a teammate</li>
        </ul>
      </>
    ),
  },
  {
    id: 'onboarding',
    title: 'Onboarding checklist',
    body: (
      <>
        <p>First time in, you see a card titled <strong>Get started</strong> at the top of your home tab. It tracks 6 things:</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Add a bio (1-3 sentences)</li>
          <li>Add a profile photo</li>
          <li>Pick your team (scope)</li>
          <li>Drop a link or two</li>
          <li>Join a circle in the bot</li>
          <li>Log your first contribution (use Quick Add or the bot)</li>
        </ol>
        <p>The card hides itself once all 6 are done. Each one has a small hint underneath telling you exactly what to do.</p>
      </>
    ),
  },
  {
    id: 'todos',
    title: 'Todos + tracking your work',
    body: (
      <>
        <p>The home tab shows what&rsquo;s assigned to you. Open the Overview tab for a full kanban board.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Quick add</strong> on home: type &ldquo;Did X&rdquo; or &ldquo;Going to do Y&rdquo; and the system parses it.</li>
          <li><strong>Bot shortcuts</strong> in DM: <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/do &lt;text&gt;</code> to log work, <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/mytodos</code> to see what you own, <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/mytodos_all</code> to see everything open.</li>
          <li><strong>Status</strong> moves todo -&gt; in_progress -&gt; done. Click to update.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'updates-feed',
    title: 'Recent activity feed',
    body: (
      <>
        <p>The home tab shows what other teammates have been doing - bio updates, todos closed, ideas dropped, contacts logged. Last 15 events.</p>
        <p>Click a name to jump to their public profile.</p>
        <p>If your name shows up here, your work is being noticed. If it never does, log contributions through the bot or Quick Add - try <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/idea</code> or <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/do</code>.</p>
      </>
    ),
  },
  {
    id: 'leaderboard',
    title: 'Most-complete profiles',
    body: (
      <>
        <p>Top 5 most-complete profiles plus your own rank. Light social pressure, no actual stakes - just makes it easy to see who&rsquo;s set up and who isn&rsquo;t.</p>
        <p>Scoring: bio 40 (full = 40, partial = 20), photo 30, scope 20, links 10. Total = 100.</p>
        <p>Click anyone&rsquo;s name to open their public profile.</p>
      </>
    ),
  },
  {
    id: 'skills',
    title: 'Skills (what you offer)',
    body: (
      <>
        <p>One free-text comma-separated list. Examples: &ldquo;video, sound, sponsorship outreach, photography, music production&rdquo;.</p>
        <p>Renders as gold pill tags on your profile and in the Team directory. Searchable - if someone needs a videographer, typing &ldquo;video&rdquo; in the team search filters to people who listed it.</p>
        <p>Used for matching teammates to work that needs done. The more specific, the better.</p>
      </>
    ),
  },
  {
    id: 'whats-changing',
    title: 'What if something looks wrong?',
    body: (
      <>
        <p>The dashboard is shipped weekly. If something&rsquo;s broken or feels off:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Tag <a href="https://x.com/bettercallzaal" target="_blank" rel="noreferrer" className="text-[#f5a623] hover:underline">@bettercallzaal</a> in the team Telegram group</li>
          <li>Or send <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/idea your-feedback-here</code> in DM to the bot - it goes into the suggestions pool</li>
          <li>Don&rsquo;t lose your work. Save shows a green &ldquo;Profile saved&rdquo; pill when it goes through. If you see a red error box, the save did NOT happen.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'public-profile',
    title: 'Your public profile',
    body: (
      <>
        <p>Your bio + photo + links are public at <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">zaoos.com/stock/team/m/&lt;your-name&gt;</code>. Anyone (no login) can see it.</p>
        <p>What is NOT public: your code, your scope, your todos, your status text. Those are internal-only.</p>
        <p>The team grid on the public ZAOstock page (<Link href="/stock" className="text-[#f5a623] hover:underline">/stock</Link>) pulls from your bio + photo too.</p>
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-[100dvh] bg-[#0a1628] text-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <header className="mb-10">
          <Link href="/stock/team" className="text-[10px] text-[#f5a623] hover:underline uppercase tracking-wider">
            &larr; Back to dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white mt-3">Help &amp; how-to</h1>
          <p className="mt-2 text-sm text-gray-400 max-w-2xl">
            Quick answers to everything in the ZAOstock team dashboard. Each section corresponds to a feature you&rsquo;ll see in the app. Anchor links take you straight to the topic.
          </p>
        </header>

        <nav className="mb-10 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08]">
          <p className="col-span-2 text-[10px] uppercase tracking-wider text-[#f5a623] font-bold mb-2">Jump to</p>
          {ENTRIES.map((e) => (
            <a key={e.id} href={`#${e.id}`} className="text-gray-300 hover:text-[#f5a623] py-0.5">
              {e.title}
            </a>
          ))}
        </nav>

        <div className="space-y-8">
          {ENTRIES.map((e) => (
            <section key={e.id} id={e.id} className="scroll-mt-6 bg-[#0d1b2a] rounded-xl p-6 border border-white/[0.08]">
              <h2 className="text-lg font-bold text-[#f5a623] mb-3">{e.title}</h2>
              <div className="text-sm text-gray-300 leading-relaxed space-y-2">{e.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs text-gray-500">
            Missing something? Drop a <code className="bg-[#0a1628] px-1 rounded text-[#c7d2fe]">/idea</code> in the bot or tag <a href="https://x.com/bettercallzaal" target="_blank" rel="noreferrer" className="text-[#f5a623] hover:underline">@bettercallzaal</a>.
          </p>
        </footer>
      </div>
    </main>
  );
}
