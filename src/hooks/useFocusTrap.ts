'use client';

import { useEffect, useRef, useCallback, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trap keyboard focus within a container element (modal/drawer).
 * - Tab / Shift+Tab cycles through focusable elements inside the container.
 * - Auto-focuses the first focusable element when opened.
 * - Restores focus to the previously focused element when closed.
 * - Handles dynamic content via a MutationObserver.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, isOpen: boolean) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter((el) => el.offsetParent !== null); // exclude hidden elements
  }, [containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    // Save the element that had focus before the trap opened
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Small delay to let the DOM render, then focus the first element
    const raf = requestAnimationFrame(() => {
      const elements = getFocusableElements();
      if (elements.length > 0) {
        elements[0].focus();
      } else {
        // If no focusable children, focus the container itself so keydown events work
        containerRef.current?.setAttribute('tabindex', '-1');
        containerRef.current?.focus();
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) {
        e.preventDefault();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Watch for dynamic content changes (e.g. search results appearing)
    let observer: MutationObserver | null = null;
    if (containerRef.current) {
      observer = new MutationObserver(() => {
        // If focus has moved outside the container, pull it back in
        if (
          containerRef.current &&
          document.activeElement &&
          !containerRef.current.contains(document.activeElement)
        ) {
          const elements = getFocusableElements();
          if (elements.length > 0) {
            elements[0].focus();
          }
        }
      });
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKeyDown);
      observer?.disconnect();
    };
  }, [isOpen, containerRef, getFocusableElements]);

  // Restore focus when closed
  useEffect(() => {
    if (!isOpen && previouslyFocusedRef.current) {
      // Use rAF to ensure this runs after the modal DOM is removed
      const raf = requestAnimationFrame(() => {
        previouslyFocusedRef.current?.focus();
        previouslyFocusedRef.current = null;
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);
}
