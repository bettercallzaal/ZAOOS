import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OSHome } from '../OSHome';

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { fid: 19640, displayName: 'zaal' },
  }),
}));

// Mock useAppConfig
const mockPinApp = vi.fn();
const mockUnpinApp = vi.fn();
const mockSetShell = vi.fn();

let mockConfig = {
  shell: 'dashboard' as const,
  pinnedApps: ['chat', 'music'],
  startupApps: [],
  widgetLayout: [],
  hiddenApps: [],
};

vi.mock('@/lib/os/use-app-config', () => ({
  useAppConfig: () => ({
    config: mockConfig,
    loading: false,
    pinApp: mockPinApp,
    unpinApp: mockUnpinApp,
    setShell: mockSetShell,
  }),
}));

// Mock the child shells to verify routing
vi.mock('../CommandCenterShell', () => ({
  CommandCenterShell: () => <div data-testid="command-center-shell">Command Center Shell</div>,
}));

vi.mock('../PhoneShell', () => ({
  PhoneShell: () => <div data-testid="phone-shell">Phone Shell</div>,
}));

vi.mock('../DesktopShell', () => ({
  DesktopShell: () => <div data-testid="desktop-shell">Desktop Shell</div>,
}));

describe('OSHome Shell Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders CommandCenterShell when shell is dashboard', () => {
    mockConfig = {
      shell: 'dashboard',
      pinnedApps: ['chat', 'music'],
      startupApps: [],
      widgetLayout: [],
      hiddenApps: [],
    };

    render(<OSHome />);
    expect(screen.getByTestId('command-center-shell')).toBeInTheDocument();
  });

  it('renders PhoneShell when shell is phone', () => {
    mockConfig = {
      shell: 'phone',
      pinnedApps: ['chat', 'music'],
      startupApps: [],
      widgetLayout: [],
      hiddenApps: [],
    };

    render(<OSHome />);
    expect(screen.getByTestId('phone-shell')).toBeInTheDocument();
  });

  it('renders DesktopShell when shell is desktop', () => {
    mockConfig = {
      shell: 'desktop',
      pinnedApps: ['chat', 'music'],
      startupApps: [],
      widgetLayout: [],
      hiddenApps: [],
    };

    render(<OSHome />);
    expect(screen.getByTestId('desktop-shell')).toBeInTheDocument();
  });
});
