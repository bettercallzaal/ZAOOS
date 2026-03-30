'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Title shown in the sheet header */
  title?: string;
  /** Max height as percentage of viewport (default: 75) */
  maxHeight?: number;
  /** Whether to show the drag handle (default: true) */
  showHandle?: boolean;
}

const DISMISS_THRESHOLD = 100; // px dragged down to dismiss

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  maxHeight = 75,
  showHandle = true,
}: BottomSheetProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dragStartY = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setDragOffset(0);
      setIsClosing(false);
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Wait for exit animation
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setDragOffset(0);
    }, 200);
  }, [onClose]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start drag from the handle area or when sheet is scrolled to top
    const sheet = sheetRef.current;
    if (sheet && sheet.scrollTop > 0) return;

    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;

    const diff = e.touches[0].clientY - dragStartY.current;
    // Only allow dragging down
    if (diff < 0) {
      setDragOffset(0);
      return;
    }
    setDragOffset(diff);
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (dragOffset > DISMISS_THRESHOLD) {
      handleClose();
    } else {
      setDragOffset(0);
    }
  }, [dragOffset, handleClose]);

  if (!open && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Bottom sheet'}
        className={`fixed inset-x-0 bottom-0 z-[60] bg-[#0d1b2a] border-t border-gray-700 rounded-t-2xl shadow-xl flex flex-col ${
          isClosing ? 'animate-slide-down' : 'animate-slide-up'
        }`}
        style={{
          maxHeight: `${maxHeight}vh`,
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1 rounded-full bg-gray-600" />
          </div>
        )}

        {/* Title */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-800 flex-shrink-0">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button
              onClick={handleClose}
              aria-label="Close"
              className="text-gray-500 hover:text-gray-300 transition-colors p-1"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
