'use client';

import type { ChangeEvent, ReactNode } from 'react';
import { CARD_FONTS } from '@/lib/cards/fonts';
import { COLOURWAYS } from '@/lib/cards/frames';
import type { ExportReadiness } from '@/lib/cards/readiness';
import type { CardDraft, CardLayer, TextLayer, ZaoStatsLayer } from '@/lib/cards/schema';

// The editor's side panels. Each one edits the draft through callbacks and holds no
// state of its own, so the editor's undo history sees every change.

const inputClass =
  'w-full rounded-lg border border-white/15 bg-[#0d1d36] px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#f5a623] focus:outline-none';
const buttonClass =
  'rounded-lg border border-white/15 px-3 py-2 text-sm text-white hover:border-[#f5a623] disabled:cursor-not-allowed disabled:opacity-40';
const primaryClass =
  'rounded-lg bg-[#f5a623] px-3 py-2 text-sm font-semibold text-[#0a1628] hover:bg-[#ffb94a] disabled:cursor-not-allowed disabled:opacity-40';

interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}

function Field({ label, children, hint }: FieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: every Field wraps exactly one input, select or textarea passed as children
    <label className="block space-y-1">
      <span className="text-xs font-medium uppercase tracking-wide text-white/60">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-white/50">{hint}</span> : null}
    </label>
  );
}

function textValue(
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
): string {
  return e.target.value;
}

interface CardDetailsPanelProps {
  draft: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
}

export function CardDetailsPanel({ draft, onChange }: CardDetailsPanelProps) {
  return (
    <div className="space-y-4">
      <Field label="Card name">
        <input
          className={inputClass}
          maxLength={80}
          value={draft.name}
          onChange={(e) => onChange({ name: textValue(e) })}
        />
      </Field>
      <Field label="Title line">
        <input
          className={inputClass}
          maxLength={80}
          value={draft.titleLine}
          onChange={(e) => onChange({ titleLine: textValue(e) })}
        />
      </Field>
      <Field label="Short bio">
        <textarea
          className={inputClass}
          maxLength={160}
          rows={3}
          value={draft.bio}
          onChange={(e) => onChange({ bio: textValue(e) })}
        />
      </Field>
      <fieldset className="space-y-1">
        <legend className="text-xs font-medium uppercase tracking-wide text-white/60">
          Colourway
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {COLOURWAYS.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={draft.colourwayId === c.id}
              className={`${buttonClass} ${draft.colourwayId === c.id ? 'border-[#f5a623]' : ''}`}
              onClick={() =>
                onChange({ colourwayId: c.id, background: c.background, borderColor: c.border })
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Background">
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-white/15 bg-transparent"
            value={draft.background}
            onChange={(e) => onChange({ background: textValue(e) })}
          />
        </Field>
        <Field label="Border">
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-white/15 bg-transparent"
            value={draft.borderColor}
            onChange={(e) => onChange({ borderColor: textValue(e) })}
          />
        </Field>
        <Field label={`Border width ${draft.borderWidth}`}>
          <input
            type="range"
            min={0}
            max={60}
            className="w-full accent-[#f5a623]"
            value={draft.borderWidth}
            onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
          />
        </Field>
        <Field label={`Corners ${draft.cornerRadius}`}>
          <input
            type="range"
            min={0}
            max={120}
            className="w-full accent-[#f5a623]"
            value={draft.cornerRadius}
            onChange={(e) => onChange({ cornerRadius: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label="Rarity label" hint="A label only. It does not set supply or price.">
        <input
          className={inputClass}
          maxLength={40}
          placeholder="PALOOZA 1 of 1"
          value={draft.rarityLabel}
          onChange={(e) => onChange({ rarityLabel: textValue(e) })}
        />
      </Field>
    </div>
  );
}

interface TextControlsProps {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
}

function TextControls({ layer, onChange }: TextControlsProps) {
  return (
    <div className="space-y-3">
      <Field label="Text">
        <textarea
          className={inputClass}
          maxLength={280}
          rows={2}
          value={layer.text}
          onChange={(e) => onChange({ text: textValue(e) })}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Font">
          <select
            className={inputClass}
            value={layer.fontId}
            onChange={(e) => onChange({ fontId: textValue(e) })}
          >
            {CARD_FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.family}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Size ${layer.fontSize}`}>
          <input
            type="range"
            min={6}
            max={200}
            className="w-full accent-[#f5a623]"
            value={layer.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label="Colour">
          <input
            type="color"
            className="h-10 w-full rounded-lg border border-white/15 bg-transparent"
            value={layer.color}
            onChange={(e) => onChange({ color: textValue(e) })}
          />
        </Field>
        <Field label="Align">
          <select
            className={inputClass}
            value={layer.align}
            onChange={(e) => onChange({ align: textValue(e) as TextLayer['align'] })}
          >
            <option value="left">Left</option>
            <option value="center">Centre</option>
            <option value="right">Right</option>
          </select>
        </Field>
        <Field label={`Outline ${layer.strokeWidth}`}>
          <input
            type="range"
            min={0}
            max={20}
            className="w-full accent-[#f5a623]"
            value={layer.strokeWidth}
            onChange={(e) => {
              const strokeWidth = Number(e.target.value);
              onChange({
                strokeWidth,
                strokeColor: strokeWidth > 0 ? (layer.strokeColor ?? '#000000') : undefined,
              });
            }}
          />
        </Field>
        <label className="flex items-center gap-2 pt-5 text-sm text-white">
          <input
            type="checkbox"
            checked={layer.shadow}
            onChange={(e) => onChange({ shadow: e.target.checked })}
          />
          Shadow
        </label>
      </div>
    </div>
  );
}

interface StatsControlsProps {
  layer: ZaoStatsLayer;
  onChange: (patch: Partial<ZaoStatsLayer>) => void;
}

function StatsControls({ layer, onChange }: StatsControlsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Festival">
        <input
          className={inputClass}
          maxLength={80}
          value={layer.festival}
          onChange={(e) => onChange({ festival: textValue(e) })}
        />
      </Field>
      <Field label="Year">
        <input
          className={inputClass}
          inputMode="numeric"
          maxLength={4}
          value={layer.year ?? ''}
          onChange={(e) => {
            const year = Number.parseInt(e.target.value, 10);
            onChange({ year: year >= 2000 && year <= 2100 ? year : undefined });
          }}
        />
      </Field>
      <Field label="Genre">
        <input
          className={inputClass}
          maxLength={80}
          value={layer.genre}
          onChange={(e) => onChange({ genre: textValue(e) })}
        />
      </Field>
      <Field label="City">
        <input
          className={inputClass}
          maxLength={80}
          value={layer.city}
          onChange={(e) => onChange({ city: textValue(e) })}
        />
      </Field>
      <div className="col-span-2">
        <Field label="ZAO moment">
          <input
            className={inputClass}
            maxLength={160}
            value={layer.moment}
            onChange={(e) => onChange({ moment: textValue(e) })}
          />
        </Field>
      </div>
    </div>
  );
}

const LAYER_LABEL: Record<CardLayer['type'], string> = {
  image: 'Image',
  text: 'Text',
  'zao-stats': 'ZAO stats',
};

interface LayersPanelProps {
  layers: CardLayer[];
  selectedId: string | null;
  uploadError: string | null;
  onSelect: (id: string) => void;
  onUpload: (file: File) => void;
  onAddText: () => void;
  onAddStats: () => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onLayerChange: (id: string, patch: Partial<CardLayer>) => void;
}

export function LayersPanel({
  layers,
  selectedId,
  uploadError,
  onSelect,
  onUpload,
  onAddText,
  onAddStats,
  onMove,
  onToggle,
  onRemove,
  onLayerChange,
}: LayersPanelProps) {
  const selected = layers.find((l) => l.id === selectedId);
  const hasStats = layers.some((l) => l.type === 'zao-stats');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <label className={`${buttonClass} cursor-pointer`}>
          Add image
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />
        </label>
        <button type="button" className={buttonClass} onClick={onAddText}>
          Add text
        </button>
        <button type="button" className={buttonClass} onClick={onAddStats} disabled={hasStats}>
          Add ZAO stats
        </button>
      </div>
      {uploadError ? (
        <p role="alert" className="text-sm text-red-300">
          {uploadError}
        </p>
      ) : null}
      {layers.length === 0 ? (
        <p className="text-sm text-white/60">No layers yet. Add your photo or artwork first.</p>
      ) : (
        <ul className="space-y-2">
          {[...layers].reverse().map((layer) => {
            const index = layers.indexOf(layer);
            return (
              <li
                key={layer.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${layer.id === selectedId ? 'border-[#f5a623]' : 'border-white/10'}`}
              >
                <button
                  type="button"
                  className="flex-1 text-left text-sm text-white"
                  onClick={() => onSelect(layer.id)}
                >
                  {LAYER_LABEL[layer.type]}
                  {layer.type === 'text' ? `: ${layer.text.slice(0, 20)}` : ''}
                </button>
                <button
                  type="button"
                  className="text-xs text-white/70"
                  aria-label="Move up"
                  disabled={index === layers.length - 1}
                  onClick={() => onMove(layer.id, 1)}
                >
                  Up
                </button>
                <button
                  type="button"
                  className="text-xs text-white/70"
                  aria-label="Move down"
                  disabled={index === 0}
                  onClick={() => onMove(layer.id, -1)}
                >
                  Down
                </button>
                <button
                  type="button"
                  className="text-xs text-white/70"
                  onClick={() => onToggle(layer.id)}
                >
                  {layer.visible ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="text-xs text-red-300"
                  onClick={() => onRemove(layer.id)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {selected?.type === 'text' ? (
        <TextControls layer={selected} onChange={(patch) => onLayerChange(selected.id, patch)} />
      ) : null}
      {selected?.type === 'zao-stats' ? (
        <StatsControls layer={selected} onChange={(patch) => onLayerChange(selected.id, patch)} />
      ) : null}
      {selected?.type === 'image' ? (
        <p className="text-sm text-white/60">
          Drag the image to move it. Use the handles to resize, crop by scaling past the card edge,
          and rotate.
        </p>
      ) : null}
    </div>
  );
}

interface CreditsPanelProps {
  credits: CardDraft['credits'];
  onChange: (patch: Partial<CardDraft['credits']>) => void;
}

export function CreditsPanel({ credits, onChange }: CreditsPanelProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70">
        Credits print on every card and cannot be hidden. Leave the photographer or frame designer
        blank and the card says &quot;Unknown&quot;.
      </p>
      <Field label="Artist (required)">
        <input
          className={inputClass}
          maxLength={80}
          value={credits.artist}
          onChange={(e) => onChange({ artist: textValue(e) })}
        />
      </Field>
      <Field label="Photographer">
        <input
          className={inputClass}
          maxLength={80}
          value={credits.photographer}
          onChange={(e) => onChange({ photographer: textValue(e) })}
        />
      </Field>
      <Field label="Frame designer">
        <input
          className={inputClass}
          maxLength={80}
          value={credits.frameDesigner}
          onChange={(e) => onChange({ frameDesigner: textValue(e) })}
        />
      </Field>
    </div>
  );
}

interface ExportPanelProps {
  readiness: ExportReadiness;
  approved: boolean;
  busy: boolean;
  error: string | null;
  onApprove: (approved: boolean) => void;
  onExportImage: (kind: 'card' | 'share' | 'nft') => void;
  onExportBundle: () => void;
}

export function ExportPanel({
  readiness,
  approved,
  busy,
  error,
  onApprove,
  onExportImage,
  onExportBundle,
}: ExportPanelProps) {
  return (
    <div className="space-y-4">
      {readiness.missing.length > 0 ? (
        <p className="text-sm text-white/70">Still needed: {readiness.missing.join(', ')}.</p>
      ) : null}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          className={buttonClass}
          disabled={!readiness.canExportImages || busy}
          onClick={() => onExportImage('card')}
        >
          Card PNG
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!readiness.canExportImages || busy}
          onClick={() => onExportImage('share')}
        >
          Share PNG (3:2)
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={!readiness.canExportImages || busy}
          onClick={() => onExportImage('nft')}
        >
          NFT PNG (4:5)
        </button>
      </div>
      <label className="flex items-start gap-2 text-sm text-white">
        <input
          type="checkbox"
          className="mt-1"
          checked={approved}
          onChange={(e) => onApprove(e.target.checked)}
        />
        I approve this card and its credits.
      </label>
      <button
        type="button"
        className={`${primaryClass} w-full`}
        disabled={!readiness.canExportBundle || busy}
        onClick={onExportBundle}
      >
        Download approved bundle
      </button>
      <p className="text-xs text-white/50">
        The bundle is three PNGs and a metadata file, saved to your device. Nothing is uploaded,
        posted or minted. Send it to The ZAO when you are happy with it.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
