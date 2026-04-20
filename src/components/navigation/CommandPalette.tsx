'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMAND_GROUPS = {
  navigation: {
    label: 'Navigation',
    commands: [
      { label: 'Chat', key: 'chat', href: '/chat' },
      { label: 'Music', key: 'music', href: '/music' },
      { label: 'Spaces', key: 'spaces', href: '/spaces' },
      { label: 'Governance', key: 'governance', href: '/governance' },
      { label: 'Library', key: 'library', href: '/library' },
      { label: 'Tools', key: 'tools', href: '/tools' },
      { label: 'Contribute', key: 'contribute', href: '/contribute' },
      { label: 'Directory', key: 'directory', href: '/directory' },
      { label: 'Messages', key: 'messages', href: '/messages' },
      { label: 'Settings', key: 'settings', href: '/settings' },
    ],
  },
  actions: {
    label: 'Actions',
    commands: [
      { label: 'New Post', key: 'new-post', action: 'new-post' },
      { label: 'Search Members', key: 'search-members', action: 'search-members' },
      { label: 'Toggle Music Player', key: 'toggle-music-player', action: 'toggle-music' },
    ],
  },
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [value, setValue] = useState('');

  useFocusTrap(
    { current: document.querySelector('[role="dialog"]') },
    isOpen,
  );

  useEffect(() => {
    if (!isOpen) {
      setValue('');
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSelect = useCallback(
    (command: string) => {
      const allCommands = [
        ...COMMAND_GROUPS.navigation.commands,
        ...COMMAND_GROUPS.actions.commands,
      ];

      const selected = allCommands.find((c) => `${c.key}` === command);

      if (!selected) return;

      if ('href' in selected) {
        router.push(selected.href);
      } else if ('action' in selected) {
        switch (selected.action) {
          case 'new-post':
            // Dispatch event or use context to open compose
            window.dispatchEvent(
              new CustomEvent('command-palette:new-post'),
            );
            break;
          case 'search-members':
            window.dispatchEvent(
              new CustomEvent('command-palette:search-members'),
            );
            break;
          case 'toggle-music':
            window.dispatchEvent(
              new CustomEvent('command-palette:toggle-music'),
            );
            break;
        }
      }

      onClose();
    },
    [router, onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="fixed left-1/2 top-[20vh] w-full max-w-2xl -translate-x-1/2 rounded-lg border border-white/[0.08] bg-[#0d1b2a] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <Command
          className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-white/50 [&_[cmdk-group]]:overflow-hidden [&_[cmdk-group]]:px-1.5 [&_[cmdk-group]]:py-1.5"
          value={value}
          onValueChange={setValue}
        >
          <div className="flex items-center border-b border-white/[0.08] px-3 py-2">
            <svg
              className="mr-2 h-5 w-5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Command.Input
              placeholder="Search commands..."
              className="flex-1 border-0 bg-transparent py-2 text-sm text-white placeholder-white/40 focus:outline-none"
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto">
            <Command.Empty className="px-3 py-6 text-center text-sm text-white/50">
              No commands found
            </Command.Empty>

            {Object.entries(COMMAND_GROUPS).map(([groupKey, group]) => (
              <Command.Group
                key={groupKey}
                heading={group.label}
                className="overflow-hidden"
              >
                {group.commands.map((cmd) => (
                  <Command.Item
                    key={cmd.key}
                    value={cmd.key}
                    onSelect={() => handleSelect(cmd.key)}
                    className="flex cursor-pointer items-center rounded px-2 py-1.5 text-sm text-white aria-selected:bg-[#f5a623] aria-selected:text-[#0d1b2a]"
                  >
                    <span>{cmd.label}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-white/[0.08] px-3 py-2 text-xs text-white/40">
            <p>Press <kbd className="rounded bg-white/10 px-1 py-0.5">Esc</kbd> to close</p>
          </div>
        </Command>
      </div>
    </div>
  );
}
