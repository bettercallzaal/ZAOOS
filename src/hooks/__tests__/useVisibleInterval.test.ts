import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVisibleInterval } from '../useVisibleInterval';

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
}

describe('useVisibleInterval', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setHidden(false);
  });

  afterEach(() => {
    vi.useRealTimers();
    setHidden(false);
  });

  it('calls the callback on each tick while visible, not on mount', () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 1000));
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it('skips ticks while the tab is hidden', () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 1000));
    setHidden(true);
    vi.advanceTimersByTime(5000);
    expect(cb).not.toHaveBeenCalled();
  });

  it('refetches once when the tab becomes visible again', () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, 60_000));
    setHidden(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).not.toHaveBeenCalled();
    setHidden(false);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('does nothing when delay is null', () => {
    const cb = vi.fn();
    renderHook(() => useVisibleInterval(cb, null));
    vi.advanceTimersByTime(10_000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).not.toHaveBeenCalled();
  });

  it('uses the latest callback without restarting the interval', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useVisibleInterval(cb, 1000), {
      initialProps: { cb: first },
    });
    vi.advanceTimersByTime(500);
    rerender({ cb: second });
    vi.advanceTimersByTime(500);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('stops polling and listening after unmount', () => {
    const cb = vi.fn();
    const { unmount } = renderHook(() => useVisibleInterval(cb, 1000));
    unmount();
    vi.advanceTimersByTime(5000);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(cb).not.toHaveBeenCalled();
  });
});
