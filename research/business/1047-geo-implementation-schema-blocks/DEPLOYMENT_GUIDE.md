# GEO Implementation - Deployment Guide

This guide tells you exactly where to place each schema block and file to activate GEO for The ZAO.

## Files Included

1. `schema-organization.json` - JSON-LD Organization schema
2. `schema-faq.json` - JSON-LD FAQPage schema
3. `thezao-llms.txt` - AI-readable navigation index
4. `DEPLOYMENT_GUIDE.md` - This file

## Deployment Steps

### Step 1: Deploy llms.txt to thezao.xyz

**File**: `thezao-llms.txt`

**Destination**: `https://thezao.xyz/llms.txt` (web root)

**How to deploy** (choose one):

**Option A - Static file (simplest)**
1. Rename `thezao-llms.txt` to `llms.txt`
2. Upload to your thezao.xyz web server root (same level as index.html)
3. Verify: Visit https://thezao.xyz/llms.txt in a browser - you should see the plain text content

**Option B - Next.js route** (if thezao.xyz is Next.js)
1. Create `src/app/llms.txt/route.ts`:
```typescript
export async function GET() {
  const content = `# The ZAO\n\n...`; // Copy content from thezao-llms.txt
  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
```
2. Deploy the app
3. Verify: Visit https://thezao.xyz/llms.txt

**Verification**: 
```bash
curl https://thezao.xyz/llms.txt | head -5
# Should return the llms.txt content starting with "# The ZAO"
```

---

### Step 2: Add Organization Schema to thezao.xyz Homepage

**File**: `schema-organization.json`

**Destination**: `<head>` tag of https://thezao.xyz homepage

**How to deploy**:

1. Copy the entire contents of `schema-organization.json`
2. Add this to the `<head>` section of your homepage HTML (or Next.js `metadata` export):

**For static HTML**:
```html
<head>
  <!-- ... existing meta tags ... -->
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      ...
      // Paste entire schema-organization.json content here
    }
  </script>
</head>
```

**For Next.js** (preferred):
1. Create or edit the route for your homepage (e.g., `src/app/layout.tsx` or `src/app/page.tsx`)
2. Add structured data to the metadata:
```typescript
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The ZAO',
  description: 'A decentralized impact network bringing profit margin, data, and IP rights back to artists.',
  other: {
    'schema:Organization': JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      // ... paste contents of schema-organization.json
    })
  }
}
```

3. Also ensure this script is in the page HTML (alongside Next.js metadata):
```typescript
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            // ... paste contents of schema-organization.json
          })
        }}
      />
      {/* Page content */}
    </>
  )
}
```

**Verification**:
1. Visit https://thezao.xyz in a browser
2. Right-click > Inspect
3. Search for `"@type": "Organization"` in the HTML
4. Or use Google's Structured Data Testing Tool: https://validator.schema.org/
   - Paste the page URL or the JSON directly
   - Should show "Organization" with green checkmarks

---

### Step 3: Create FAQ Page on thezao.xyz

**File**: `schema-faq.json`

**Destination**: https://thezao.xyz/what-is-the-zao (new page)

**How to deploy**:

1. Create a new page at `/what-is-the-zao`

**For Next.js**:
```
src/app/what-is-the-zao/page.tsx
```

2. Add the structured data + human-readable FAQ:
```typescript
// src/app/what-is-the-zao/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'What is The ZAO?',
  description: 'Learn about The ZAO - a decentralized impact network for artists.',
}

export default function WhatIsZAO() {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      // ... paste contents of schema-faq.json mainEntity array
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
      
      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1>What is The ZAO?</h1>
        
        {faqData.mainEntity.map((item, i) => (
          <div key={i} className="mb-8">
            <h2 className="text-xl font-semibold mb-3">{item.name}</h2>
            <p className="text-gray-300">{item.acceptedAnswer.text}</p>
          </div>
        ))}
      </article>
    </>
  )
}
```

3. Deploy the updated app
4. Verify: Visit https://thezao.xyz/what-is-the-zao and inspect the schema

**Verification**:
```bash
curl -s https://thezao.xyz/what-is-the-zao | grep -i '"@type": "FAQPage"'
# Should find the FAQPage schema
```

Or use the schema validator: https://validator.schema.org/?url=https://thezao.xyz/what-is-the-zao

---

### Step 4 (Optional): Add FAQ Schema to Other Pages

Consider adding FAQ schema to:
- `/papers` - for technical questions about Respect, Fractal, OREC
- `/governance` - for governance process questions
- `/wavewar-z` (if it exists) - for battle and participation questions

Use the same pattern as Step 3.

---

## Testing & Validation

### Test 1: Validate JSON-LD Schema

Use the official W3C validator:
```bash
# For Organization schema on homepage
curl -s https://thezao.xyz | grep -i "schema.org/Organization"

# For FAQ schema
curl -s https://thezao.xyz/what-is-the-zao | grep -i "schema.org/FAQPage"
```

Or manually:
1. Go to https://validator.schema.org/
2. Paste `https://thezao.xyz` (for Organization) or `https://thezao.xyz/what-is-the-zao` (for FAQ)
3. Should show valid schema with green checkmarks

### Test 2: Check llms.txt is Public

```bash
curl -v https://thezao.xyz/llms.txt
# Should return HTTP 200 with text/plain content
```

### Test 3: Verify AI Systems Can Find It

After deployment (24-48 hours for indexing), test with:

**ChatGPT** (https://chatgpt.com or claude.ai):
- Query: "What is The ZAO?"
- Check if the response cites thezao.xyz or sources it correctly

**Perplexity** (https://perplexity.ai):
- Same query, check sources

**Google AI Overviews** (https://google.com search):
- Same query, check if Google AI shows your pages

---

## Deployment Timeline

| Step | Task | Owner | Target Date | Status |
|------|------|-------|-------------|--------|
| 1 | Deploy llms.txt to thezao.xyz/llms.txt | Web team | 2026-07-19 | [READY] |
| 2 | Add Organization schema to homepage | Web team | 2026-07-19 | [READY] |
| 3 | Create /what-is-the-zao page + FAQ schema | Web team | 2026-07-23 | [READY] |
| 4 | Validate all schemas with validator.schema.org | Web team | 2026-07-23 | [READY] |
| 5 | Test AI citations (ChatGPT, Perplexity, Claude) | Zaal | 2026-07-30 | [READY] |
| 6 | Begin weekly citation tracker | Zaal | 2026-08-01 | [READY] |

---

## FAQ for Deployment

**Q: Do I need to change the schema files?**
A: Only the URLs need updating. Replace `https://thezao.xyz` with your actual domain if different. Replace email, social handles, and dates with current info if they've changed.

**Q: What if my site doesn't support JSON-LD?**
A: You can add it as a static `<script>` tag in the HTML head, or ask your web team to implement it. It's pure data and won't break your design.

**Q: How long until AI systems start citing these pages?**
A: Perplexity typically indexes new content within 48 hours. ChatGPT and Claude take 1-2 weeks. Google's AI Overviews may take 2-4 weeks. Start testing after 1 week.

**Q: Should I link these pages from other ZAO sites?**
A: Yes. Link the FAQ from zaoos.com, the papers, the newsletter, and Farcaster. Cross-links amplify authority and signal to search engines these are canonical reference pages.

---

## Next Actions (Post-Deployment)

After all 4 steps are live:

1. **Set up weekly AI-answer tracking** (see doc 1016 for details)
   - Run 10 ZAO-related queries through ChatGPT, Perplexity, Claude, Google AI Overviews
   - Log which sources appear and in what order
   - Track if thezao.xyz/what-is-the-zao or papers appear

2. **Refresh other surfaces**
   - Add links to the FAQ from papers, newsletter, and zaoos.com
   - Ensure Respect count (156) and dates match across all surfaces

3. **Monitor for improvements**
   - After 4 weeks, you should see 30-40% citation lift for Perplexity
   - After 8 weeks, Google AI Overviews should start citing the pages
   - ChatGPT/Claude citations build over 2-3 months

4. **Expand schema** (optional, future)
   - Add FAQ schema to /papers for technical questions
   - Add FAQSchema to governance pages
   - Keep llms.txt updated as new major pages launch

---

## Questions or Issues?

- Validator: https://validator.schema.org/
- JSON-LD Spec: https://json-ld.org/
- Schema.org: https://schema.org/
- Referenced Research Doc: doc 1016 (geo-owning-the-ai-answer)

All files are ready to deploy. No changes needed unless your domain, contact info, or canonical facts have changed.
