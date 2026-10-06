import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EstateReviewDeck } from '../EstateReviewDeck';

describe('EstateReviewDeck', () => {
  it('renders title, status badge, and review cards', () => {
    render(<EstateReviewDeck />);

    expect(screen.getByText('Estate Review & Approvals Cockpit')).toBeInTheDocument();
    expect(screen.getByText('ORCHESTRATOR LIVE')).toBeInTheDocument();
    expect(
      screen.getByText('POIDH Video Bounties: Community Edits from Raw Footage'),
    ).toBeInTheDocument();
    expect(screen.getByText('Crown Vics 20-Second Teaser Video Drafts')).toBeInTheDocument();
  });

  it('filters items when category tab is clicked', () => {
    render(<EstateReviewDeck />);

    // Click PRs tab
    const prsTab = screen.getByRole('button', { name: /^PRs/i });
    fireEvent.click(prsTab);

    // PRs should be visible
    expect(
      screen.getByText('Fleet Context, 50% Auto-Compact, Review Dispatch Tool'),
    ).toBeInTheDocument();

    // Media item should be filtered out
    expect(screen.queryByText('Crown Vics 20-Second Teaser Video Drafts')).not.toBeInTheDocument();
  });

  it('filters items when search input is typed into', () => {
    render(<EstateReviewDeck />);

    const searchInput = screen.getByPlaceholderText('Search review items...');
    fireEvent.change(searchInput, { target: { value: 'Crown Vics' } });

    expect(screen.getByText('Crown Vics 20-Second Teaser Video Drafts')).toBeInTheDocument();
    expect(
      screen.queryByText('Day 276 Newsletter: ZAOstock Festival Recap'),
    ).not.toBeInTheDocument();
  });

  it('triggers onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    render(<EstateReviewDeck onDismiss={onDismiss} />);

    const closeBtn = screen.getByRole('button', { name: 'Close View' });
    fireEvent.click(closeBtn);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
