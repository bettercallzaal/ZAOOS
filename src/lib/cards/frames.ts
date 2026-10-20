// Frames and colourways for the card builder. No AI-made visuals (doc 2690, rule 1):
// v1 ships only a blank frame the builder draws from plain shapes. Designer-made frames
// are image files plus a slot list under public/cards/frames/<id>/, added once Zaal
// names who designs them (board card 10523). Every frame is original (doc 2690).

export interface Colourway {
  id: string;
  label: string;
  background: string;
  border: string;
  text: string;
}

export interface CardFrame {
  id: string;
  label: string;
  /** Who designed it; shown in the card's frame credit. */
  designer: string;
  kind: 'shapes' | 'image';
}

export const DEFAULT_COLOURWAY_ID = 'zao-navy-gold';

export const COLOURWAYS: readonly Colourway[] = [
  {
    id: 'zao-navy-gold',
    label: 'ZAO navy and gold',
    background: '#0a1628',
    border: '#f5a623',
    text: '#f5e9d0',
  },
  {
    id: 'zao-gold-navy',
    label: 'ZAO gold and navy',
    background: '#f5a623',
    border: '#0a1628',
    text: '#0a1628',
  },
  {
    id: 'mono',
    label: 'Black and white',
    background: '#111111',
    border: '#ffffff',
    text: '#ffffff',
  },
];

export const FRAMES: readonly CardFrame[] = [
  { id: 'blank', label: 'Blank', designer: 'The artist', kind: 'shapes' },
];

export function getColourway(id: string): Colourway | undefined {
  return COLOURWAYS.find((c) => c.id === id);
}

export function getFrame(id: string): CardFrame | undefined {
  return FRAMES.find((f) => f.id === id);
}
