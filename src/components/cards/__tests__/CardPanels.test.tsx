import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditsPanel, ExportPanel } from '../CardPanels';

const ready = { canExportImages: true, canExportBundle: true, missing: [] };

function renderExport(overrides: Partial<Parameters<typeof ExportPanel>[0]> = {}) {
  const props = {
    readiness: ready,
    approved: true,
    busy: false,
    error: null,
    onApprove: vi.fn(),
    onExportImage: vi.fn(),
    onExportBundle: vi.fn(),
    ...overrides,
  };
  render(<ExportPanel {...props} />);
  return props;
}

describe('ExportPanel', () => {
  it('enables every export when the card is ready and approved', () => {
    const props = renderExport();
    fireEvent.click(screen.getByRole('button', { name: 'NFT PNG (4:5)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Download approved bundle' }));
    expect(props.onExportImage).toHaveBeenCalledWith('nft');
    expect(props.onExportBundle).toHaveBeenCalledOnce();
  });

  it('locks the bundle until approval but allows the images', () => {
    renderExport({
      approved: false,
      readiness: {
        canExportImages: true,
        canExportBundle: false,
        missing: ['your approval of the card and its credits'],
      },
    });
    expect(screen.getByRole('button', { name: 'Download approved bundle' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Card PNG' })).toBeEnabled();
    expect(screen.getByText(/Still needed: your approval/)).toBeInTheDocument();
  });

  it('blocks every export without the artist credit', () => {
    renderExport({
      readiness: { canExportImages: false, canExportBundle: false, missing: ['the artist credit'] },
    });
    for (const name of [
      'Card PNG',
      'Share PNG (3:2)',
      'NFT PNG (4:5)',
      'Download approved bundle',
    ]) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('reports the approval tick and shows an export error', () => {
    const props = renderExport({ approved: false, error: 'Export failed.' });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(props.onApprove).toHaveBeenCalledWith(true);
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed.');
  });
});

describe('CreditsPanel', () => {
  it('sends each credit field as typed', () => {
    const onChange = vi.fn();
    render(
      <CreditsPanel
        credits={{ artist: '', photographer: '', frameDesigner: '' }}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Artist (required)'), {
      target: { value: 'Test Artist' },
    });
    fireEvent.change(screen.getByLabelText('Photographer'), { target: { value: 'P' } });
    expect(onChange).toHaveBeenCalledWith({ artist: 'Test Artist' });
    expect(onChange).toHaveBeenCalledWith({ photographer: 'P' });
  });
});
