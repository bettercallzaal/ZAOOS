import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignerConnect } from '../SignerConnect';

describe('SignerConnect', () => {
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('renders idle connect button', () => {
    render(<SignerConnect onSuccess={mockOnSuccess} />);
    expect(screen.getByText(/Connect Farcaster Signer to post casts and messages directly/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Authorize Posting/i })).toBeInTheDocument();
  });

  it('handles create signer flow and shows QR code and deep link', async () => {
    const mockApprovalUrl = 'https://warpcast.com/~/approve?signer_uuid=test-uuid';
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/auth/signer') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            signerUuid: 'test-uuid',
            status: 'pending_approval',
            approvalUrl: mockApprovalUrl,
          }),
        });
      }
      if (url.includes('/api/auth/signer/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'pending_approval' }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<SignerConnect onSuccess={mockOnSuccess} />);
    const authorizeBtn = screen.getByRole('button', { name: /Authorize Posting/i });
    fireEvent.click(authorizeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Approve Posting on Farcaster/i)).toBeInTheDocument();
    });

    const warpcastLink = screen.getByRole('link', { name: /Open Warpcast App/i });
    expect(warpcastLink).toHaveAttribute('href', mockApprovalUrl);
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('polls status and triggers onSuccess when approved', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const mockApprovalUrl = 'https://warpcast.com/~/approve?signer_uuid=approved-uuid';

    let pollCount = 0;
    globalThis.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/auth/signer') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            signerUuid: 'approved-uuid',
            status: 'pending_approval',
            approvalUrl: mockApprovalUrl,
          }),
        });
      }
      if (url.includes('/api/auth/signer/status')) {
        pollCount++;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: pollCount >= 2 ? 'approved' : 'pending_approval' }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(<SignerConnect onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: /Authorize Posting/i }));

    await waitFor(() => {
      expect(screen.getByText(/Approve Posting on Farcaster/i)).toBeInTheDocument();
    });

    // Advance interval timers
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.advanceTimersByTimeAsync(1500);

    expect(mockOnSuccess).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('handles error gracefully and allows retry', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Neynar API rate limited' }),
    });

    render(<SignerConnect onSuccess={mockOnSuccess} />);
    fireEvent.click(screen.getByRole('button', { name: /Authorize Posting/i }));

    await waitFor(() => {
      expect(screen.getByText(/Neynar API rate limited/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });
  });
});
