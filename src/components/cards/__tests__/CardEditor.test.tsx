import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DRAFT_STORAGE_KEY } from '@/lib/cards/drafts';
import { createBlankDraft } from '@/lib/cards/schema';

// jsdom has no canvas, so the Konva stage and the export module are mocked; the
// editor's own state (draft, approval, credits, tabs) is what is under test.
const { renderExportMock, downloadMock } = vi.hoisted(() => ({
  renderExportMock: vi.fn(() => 'data:image/png;base64,AAAA'),
  downloadMock: vi.fn(),
}));

vi.mock('../CardCanvas', () => ({
  CardCanvas: () => <div data-testid="card-canvas" />,
}));
vi.mock('../exportCard', () => ({
  ensureFontsLoaded: vi.fn(() => Promise.resolve()),
  renderExport: renderExportMock,
  downloadDataUrl: downloadMock,
  downloadJson: vi.fn(),
}));
vi.mock('@/hooks/useMiniApp', () => ({
  useMiniApp: () => ({ context: null }),
}));

import CardEditor from '../CardEditor';

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}

async function renderEditor() {
  render(<CardEditor />);
  await act(async () => {});
}

describe('CardEditor', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
    renderExportMock.mockClear();
    downloadMock.mockClear();
  });

  it('says so when the saved draft cannot be read', async () => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, '{broken');
    await renderEditor();
    expect(screen.getByText(/saved draft could not be read/)).toBeInTheDocument();
  });

  it('restores a valid saved draft', async () => {
    window.localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ ...createBlankDraft(0), name: 'Saved Card' }),
    );
    await renderEditor();
    expect(screen.getByDisplayValue('Saved Card')).toBeInTheDocument();
  });

  it('clears the approval when the card changes after it was approved', async () => {
    await renderEditor();
    fireEvent.change(screen.getByLabelText('Card name'), { target: { value: 'My Card' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    fireEvent.change(screen.getByLabelText('Artist (required)'), {
      target: { value: 'Test Artist' },
    });
    fireEvent.click(screen.getByRole('tab', { name: 'Export' }));
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: 'Download approved bundle' })).toBeEnabled();

    fireEvent.click(screen.getByRole('tab', { name: 'Card' }));
    fireEvent.change(screen.getByLabelText('Card name'), { target: { value: 'My Card 2' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Export' }));
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Download approved bundle' })).toBeDisabled();
  });

  it('undo brings back the previous name', async () => {
    await renderEditor();
    fireEvent.change(screen.getByLabelText('Card name'), { target: { value: 'First' } });
    fireEvent.change(screen.getByLabelText('Card name'), { target: { value: 'Second' } });
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByLabelText('Card name')).toHaveValue('First');
  });

  it('refuses an SVG upload with a message', async () => {
    await renderEditor();
    fireEvent.click(screen.getByRole('tab', { name: 'Layers' }));
    const input = screen.getByLabelText('Add image');
    const file = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Use a PNG, JPG or WebP image.');
  });
});
