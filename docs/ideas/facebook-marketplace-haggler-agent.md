# Idea: Facebook Marketplace Haggling Agent

**Date:** April 11, 2026
**Status:** Idea -- not started

## Concept

An AI agent that monitors Facebook Marketplace for valuable items, identifies deals, and automatically messages sellers to negotiate prices.

## What It Does

1. **Scans** Facebook Marketplace for items matching criteria (categories, price ranges, keywords)
2. **Evaluates** value -- compares listing price vs market value (eBay comps, retail price)
3. **Identifies** deals where listed price is below value OR seller might negotiate
4. **Messages** seller: polite, natural-sounding message asking if they're open to offers
5. **Negotiates** back and forth with a target price and walk-away price
6. **Alerts** you when a deal is locked in, you just go pick it up

## Technical Considerations

- Facebook Marketplace has no public API -- would need browser automation (Playwright/Puppeteer)
- Anti-bot detection is aggressive -- need human-like delays, profile rotation
- Could use Farcaster/X to find deals shared publicly instead (easier, no ToS issues)
- Alternative: Craigslist has less bot protection
- Could tie to ZABAL: agent uses ZABAL treasury to buy items for resale, profits back to treasury

## Parking This For Later

Build the ZABAL agent swarm first. This is a fun side project idea.
