import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { JukeEmbed } from './JukeEmbed';

describe('JukeEmbed', () => {
  it('renders the iframe pointing at the Juke embed URL for the space', () => {
    render(<JukeEmbed spaceId="zao-live-42" />);
    const iframe = screen.getByTitle('Juke live audio space');
    expect(iframe).toHaveAttribute('src', 'https://juke.audio/embed/zao-live-42');
  });

  it('grants the iframe autoplay and microphone permissions', () => {
    render(<JukeEmbed spaceId="abc123" />);
    const iframe = screen.getByTitle('Juke live audio space');
    expect(iframe).toHaveAttribute('allow', 'autoplay; microphone');
  });

  it('shows the connecting skeleton before the iframe loads', () => {
    render(<JukeEmbed spaceId="abc123" />);
    expect(screen.getByText('Connecting to Juke...')).toBeInTheDocument();
  });

  it('hides the skeleton once the iframe fires load', () => {
    render(<JukeEmbed spaceId="abc123" />);
    fireEvent.load(screen.getByTitle('Juke live audio space'));
    expect(screen.queryByText('Connecting to Juke...')).not.toBeInTheDocument();
  });

  it('keeps a visible "Powered by Juke" attribution link', () => {
    render(<JukeEmbed spaceId="abc123" />);
    const link = screen.getByRole('link', { name: 'Powered by Juke' });
    expect(link).toHaveAttribute('href', 'https://juke.audio');
  });

  it('applies a caller-supplied className to the wrapper', () => {
    const { container } = render(<JukeEmbed spaceId="abc123" className="mt-8" />);
    expect(container.firstChild).toHaveClass('mt-8');
  });
});
