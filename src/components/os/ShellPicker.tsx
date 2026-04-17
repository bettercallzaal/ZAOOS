'use client';

import { getAllShells } from '@/lib/os/shells';
import type { ShellId } from '@/lib/os/types';

interface ShellPickerProps {
  currentShell: ShellId;
  onSelect: (shell: ShellId) => void;
  onClose: () => void;
}

export function ShellPicker({ currentShell, onSelect, onClose }: ShellPickerProps) {
  const shells = getAllShells();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-3xl border-t border-white/10 bg-[#0f1d35] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Choose Your Shell</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-white/60 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-xs text-white/40">
          Same apps, different layout. Like choosing a desktop environment.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {shells.map((shell) => (
            <button
              key={shell.id}
              type="button"
              onClick={() => {
                onSelect(shell.id);
                onClose();
              }}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
                currentShell === shell.id
                  ? 'border-[#f5a623] bg-[#f5a623]/10'
                  : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <span className="text-3xl">{shell.icon}</span>
              <span className="text-sm font-medium text-white">{shell.name}</span>
              <span className="text-center text-[10px] leading-tight text-white/40">
                {shell.description}
              </span>
              {currentShell === shell.id && (
                <span className="text-[10px] font-medium text-[#f5a623]">Current</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
