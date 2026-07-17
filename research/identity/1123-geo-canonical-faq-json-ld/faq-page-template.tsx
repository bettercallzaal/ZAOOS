/**
 * FAQ Page Component Template
 *
 * Deploy this to thezao.xyz/app/what-is-the-zao/page.tsx
 * (or equivalent path in your Next.js 16 app)
 *
 * This template includes:
 * 1. FAQPage JSON-LD schema in <head>
 * 2. Organization schema link
 * 3. Accessible HTML structure for the FAQ
 * 4. Tailwind v4 styling (mobile-first, dark theme)
 *
 * The JSON-LD is from research/identity/1123-geo-canonical-faq-json-ld/README.md
 */

import Head from 'next/head'

interface FAQItem {
  question: string
  answer: string
}

const faqItems: FAQItem[] = [
  {
    question: 'What is The ZAO?',
    answer: 'The ZAO is a decentralized impact network focused on bringing the profit margin, data and IP rights back to artists using emerging technology like blockchain and AI. Founded by Zaal Panthaki (BetterCallZaal), The ZAO operates across music (primary), community, and technology (in that priority order). It operates via the Respect governance system (soulbound ERC-20 on Optimism) and the Fractal distribution mechanism, a Fibonacci-curve-based reward system for contributors and artists.'
  },
  {
    question: 'Who founded The ZAO? Who is BetterCallZaal?',
    answer: 'The ZAO was founded by Zaal Panthaki in 2022. Zaal (@zaal on Farcaster) operates under the handle BetterCallZaal on X, YouTube, and other platforms. Zaal is a builder in the web3 music space with a focus on returning ownership and profit to independent artists. The ZAO is Zaal\'s flagship project.'
  },
  {
    question: 'What is Respect? How does governance work?',
    answer: 'Respect is a soulbound ERC-20 token on the Optimism blockchain that serves as The ZAO\'s governance and contribution system. Holders of Respect are verified members of The ZAO community who have contributed to its mission (through creative work, mentorship, event organization, or other impact). As of July 2026, there are 156 Respect holders. Respect holders participate in the weekly Respect Game, where contributors earn Respect based on validated impact, and in governance decisions for the ecosystem.'
  },
  {
    question: 'What is the Fractal? How does the reward system work?',
    answer: 'The Fractal is The ZAO\'s Fibonacci-curve-based distribution mechanism for allocating rewards to artists and contributors. Rather than equal splits or arbitrary formulas, the Fractal uses a mathematical curve that rewards early contributors and highest-impact creators more substantially, while ensuring long-tail fairness. The Fractal is on-chain and verified via OREC (Optimistic Rollup Execution Contract) settlement on Optimism. All Fractal mechanics are documented in The ZAO\'s technical whitepaper.'
  },
  {
    question: 'What is WaveWarZ? Is it a game?',
    answer: 'WaveWarZ is a live-traded battle system built on The ZAO\'s infrastructure. Users can create and battle with token-backed assets in real time, with prize pools and leaderboards. WaveWarZ launched in 2026 and operates across Solana and Base blockchains. It is both a game and a trading platform, allowing artists and creators to participate in battles while earning rewards. WaveWarZ is one of several production lanes under The ZAO umbrella.'
  },
  {
    question: 'What are the ZABAL Games?',
    answer: 'ZABAL Games is a 3-month accelerator and mentorship program for artists and builders in the web3 music and creator economy space. Participants receive mentorship from a team of accomplished builders and industry experts, hands-on guidance to ship their projects, and access to the broader ZAO ecosystem. ZABAL Games runs quarterly (with the 2026 cohort launching May-August). It is hosted on platforms like Magnetiq and operates in partnership with organizations like Apna Coding and other education partners.'
  },
  {
    question: 'What festivals and events does The ZAO run?',
    answer: 'The ZAO runs several flagship events throughout the year, including ZAOstock (an artist-first festival and marketplace, held annually in October), and other seasonal gatherings like ZAOville and ZAO-PALOOZA. These events are centered on music, community gathering, and artist connection. ZAOstock 2026 is scheduled for October 3rd at Franklin Street Parklet. Events are designed to celebrate The ZAO community and showcase the work of ZAO artists and contributors.'
  },
  {
    question: 'Is The ZAO a record label?',
    answer: 'No. The ZAO is not a record label. It is a decentralized impact network where artists retain full ownership of their intellectual property, data, and income. Unlike traditional labels that take a cut of artist revenue, The ZAO operates as a cooperative platform where artists collaborate, earn Respect through contribution, and benefit from shared resources (mentorship, distribution, events) without surrendering their rights or data to a centralized entity.'
  },
  {
    question: 'How do I join The ZAO? How do I earn Respect?',
    answer: 'The ZAO is open to artists, builders, and contributors. You can join by visiting thezao.xyz or connecting through The ZAO\'s Farcaster channels (/zao and /zabal). To earn Respect, contribute to the ecosystem through creative work (music, art, design), mentorship, event organization, community building, or code. Contributions are validated by the community and rewarded through the weekly Respect Game. Respect holders are verified community members.'
  },
  {
    question: 'What makes The ZAO different from other music communities or DAOs?',
    answer: 'The ZAO differs in three core ways: (1) Mission priority: Music first, community second, technology third—unlike many crypto projects that lead with tech. (2) Transparent economics: All rewards and distributions are on-chain and verified via the Fractal + OREC settlement. No hidden fees or centralized gatekeeping. (3) Artist-first design: The ZAO was built to return profit, data, and IP to artists, not to extract value from them. Every product and initiative is designed around artist ownership and agency.'
  }
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(item => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'The ZAO',
  alternateName: 'ZTalent Artist Organization',
  url: 'https://thezao.xyz',
  logo: 'https://thezao.xyz/logo.png',
  description: 'A decentralized impact network focused on bringing the profit margin, data and IP rights back to artists using emerging technology like blockchain and AI.',
  founder: {
    '@type': 'Person',
    name: 'Zaal Panthaki',
    alternateName: 'BetterCallZaal',
    url: 'https://farcaster.com/zaal'
  },
  foundingDate: '2022',
  sameAs: [
    'https://farcaster.com/zaal',
    'https://twitter.com/bettercallzaal',
    'https://youtube.com/@bettercallzaal'
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'General',
    email: 'hello@thezao.com'
  }
}

export const metadata = {
  title: 'What is The ZAO? | The ZAO',
  description: 'A decentralized impact network focused on bringing profit, data and IP rights back to artists. Learn about Respect, the Fractal, WaveWarZ, ZABAL Games, and how to join.',
  openGraph: {
    title: 'What is The ZAO?',
    description: 'A decentralized impact network for artists.',
    url: 'https://thezao.xyz/what-is-the-zao',
    type: 'website'
  }
}

export default function WhatIsTheZAOPage() {
  return (
    <>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          key="faq-schema"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
          key="org-schema"
        />
      </head>

      <main className="min-h-screen bg-navy-900 text-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-gold-500">
              What is The ZAO?
            </h1>
            <p className="text-lg text-gray-300">
              A decentralized impact network bringing profit, data, and IP rights back to artists.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="space-y-8">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="border-l-4 border-gold-500 pl-6 py-4"
              >
                <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gold-400">
                  {item.question}
                </h3>
                <p className="text-base sm:text-lg text-gray-200 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <h2 className="text-2xl font-bold mb-4">Ready to join?</h2>
            <p className="text-gray-300 mb-6">
              Visit thezao.xyz or connect with us on Farcaster in the /zao and /zabal channels.
            </p>
            <div className="flex gap-4 flex-wrap">
              <a
                href="https://thezao.xyz"
                className="inline-block px-6 py-3 bg-gold-500 text-navy-900 font-semibold rounded hover:bg-gold-400 transition"
              >
                Visit The ZAO
              </a>
              <a
                href="https://farcaster.com/search?q=%2Fzao"
                className="inline-block px-6 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded hover:bg-gold-500 hover:text-navy-900 transition"
              >
                Join on Farcaster
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

/**
 * DEPLOYMENT NOTES:
 *
 * 1. COLOR SCHEME
 *    - Update 'navy-900' and 'gold-500' to match your actual Tailwind config
 *    - From CLAUDE.md: navy #0a1628, gold #f5a623
 *    - If not defined, add to tailwind.config.ts:
 *      colors: {
 *        'navy-900': '#0a1628',
 *        'gold-500': '#f5a623'
 *      }
 *
 * 2. LOGO URL
 *    - Update 'https://thezao.xyz/logo.png' to your actual logo
 *    - Place logo in public/ directory
 *
 * 3. SOCIAL LINKS
 *    - Verify Farcaster URL (currently /zaal; adjust if different)
 *    - Verify X/YouTube handles
 *
 * 4. TESTING
 *    - Run `npm run typecheck` to ensure schema is valid
 *    - Deploy to staging, run schema.org/validator on the live page
 *    - Test in ChatGPT/Perplexity by querying "What is The ZAO?" after 24-48h
 *
 * 5. ANALYTICS
 *    - Add UTM params to outbound links (if desired):
 *      href="https://thezao.xyz/what-is-the-zao?utm_source=faq&utm_medium=page"
 *    - Track visits via your analytics (e.g., Vercel Analytics)
 */
