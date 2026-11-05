'use client';

import type Konva from 'konva';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMiniApp } from '@/hooks/useMiniApp';
import { loadDraft, saveDraft } from '@/lib/cards/drafts';
import { CARD_FONTS, resolveFontFamily } from '@/lib/cards/fonts';
import { getColourway } from '@/lib/cards/frames';
import { createHistory, type History, pushHistory, redo, undo } from '@/lib/cards/history';
import { buildCardMetadata } from '@/lib/cards/metadata';
import { exportReadiness } from '@/lib/cards/readiness';
import { type CardDraft, type CardLayer, createBlankDraft } from '@/lib/cards/schema';
import { CardCanvas, type LayerPatch } from './CardCanvas';
import { CardDetailsPanel, CreditsPanel, ExportPanel, LayersPanel } from './CardPanels';
import { downloadDataUrl, downloadJson, ensureFontsLoaded, renderExport } from './exportCard';
import {
  checkImageFile,
  isAllowedImageDataUrl,
  newImageLayer,
  newStatsLayer,
  newTextLayer,
} from './layerFactory';

// The ZAO card builder (plan: docs/superpowers/plans/2026-10-20-zao-card-builder-v1.md).
// Everything happens in the artist's browser: no sign-in, no upload, no mint.

type Tab = 'card' | 'layers' | 'credits' | 'export';
const TABS: { id: Tab; label: string }[] = [
  { id: 'card', label: 'Card' },
  { id: 'layers', label: 'Layers' },
  { id: 'credits', label: 'Credits' },
  { id: 'export', label: 'Export' },
];
const MAX_DISPLAY_WIDTH = 420;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read failed'));
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(file);
  });
}

function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('not an image'));
    img.src = src;
  });
}

function fileSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'zao-card'
  );
}

export default function CardEditor() {
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<History<CardDraft>>(() =>
    createHistory(createBlankDraft()),
  );
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<string>('');
  const [tab, setTab] = useState<Tab>('card');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [displayWidth, setDisplayWidth] = useState(320);
  const [fontFamilies, setFontFamilies] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { context } = useMiniApp();
  const draft = history.present;

  // Any edit after approval clears it: the artist approves the card as it is (doc 2690,
  // rule 2). Only the approval tick itself changes `approved`.
  const update = useCallback((change: (d: CardDraft) => CardDraft) => {
    setHistory((h) => {
      const next = change(h.present);
      const approved = next.approved !== h.present.approved ? next.approved : false;
      return pushHistory(h, { ...next, approved, updatedAt: Date.now() });
    });
  }, []);

  // Load the saved draft once. "Unavailable" and "invalid" are said out loud, never
  // treated as "nothing saved".
  useEffect(() => {
    const result = loadDraft();
    if (result.status === 'ok') setHistory(createHistory(result.draft));
    if (result.status === 'invalid')
      setNotice('Your saved draft could not be read, so this is a fresh card.');
    if (result.status === 'unavailable')
      setNotice('This browser is not keeping drafts. Export your card before you leave.');
    setLoaded(true);
  }, []);

  // Prefill the FID when opened as a Farcaster mini app. Unverified and editable.
  useEffect(() => {
    const fid = context?.userFid;
    if (!loaded || !fid || draft.artistFid !== null) return;
    setHistory((h) => ({ ...h, present: { ...h.present, artistFid: fid } }));
  }, [context?.userFid, loaded, draft.artistFid]);

  // Autosave after a pause in editing.
  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      const result = saveDraft(draft);
      if (result.ok) setSaveState('Draft saved in this browser');
      else if (result.reason === 'write-failed')
        setSaveState('Draft not saved: the browser is out of space. Try a smaller image.');
      else if (result.reason === 'unavailable') setSaveState('Drafts are off in this browser');
      else setSaveState('Draft not saved: something on the card is invalid');
    }, 800);
    return () => clearTimeout(timer);
  }, [draft, loaded]);

  // Fit the stage to the screen.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setDisplayWidth(Math.min(MAX_DISPLAY_WIDTH, Math.floor(entry.contentRect.width)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // next/font renames families; read the real names, then wait for the faces to load.
  useEffect(() => {
    const style = getComputedStyle(document.body);
    const families: Record<string, string> = {};
    for (const font of CARD_FONTS) {
      families[font.id] = resolveFontFamily(font, style.getPropertyValue(font.cssVariable));
    }
    void ensureFontsLoaded(Object.values(families)).then(() => {
      setFontFamilies(families);
      stageRef.current?.batchDraw();
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setHistory((h) => (e.shiftKey ? redo(h) : undo(h)));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const textColor = getColourway(draft.colourwayId)?.text ?? '#ffffff';
  const readiness = useMemo(() => exportReadiness(draft), [draft]);

  const patchLayer = useCallback(
    (id: string, patch: LayerPatch | Partial<CardLayer>) =>
      update((d) => ({
        ...d,
        layers: d.layers.map((l) => (l.id === id ? ({ ...l, ...patch } as CardLayer) : l)),
      })),
    [update],
  );

  const addLayer = (layer: CardLayer) => {
    update((d) => ({ ...d, layers: [...d.layers, layer] }));
    setSelectedId(layer.id);
  };

  const onUpload = async (file: File) => {
    setUploadError(null);
    const check = checkImageFile(file);
    if (!check.ok) {
      setUploadError(check.error);
      return;
    }
    try {
      const src = await readFileAsDataUrl(file);
      if (!isAllowedImageDataUrl(src)) {
        setUploadError('That file could not be used. Try a PNG, JPG or WebP.');
        return;
      }
      const size = await loadImageSize(src);
      addLayer(newImageLayer(src, size.width, size.height));
    } catch {
      setUploadError('That file could not be read as an image.');
    }
  };

  const moveLayer = (id: string, direction: -1 | 1) =>
    update((d) => {
      const index = d.layers.findIndex((l) => l.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= d.layers.length) return d;
      const layers = [...d.layers];
      [layers[index], layers[target]] = [layers[target], layers[index]];
      return { ...d, layers };
    });

  const renderAll = async (kinds: ('card' | 'share' | 'nft')[]) => {
    const stage = stageRef.current;
    if (!stage) throw new Error('the card is not ready yet');
    await ensureFontsLoaded(Object.values(fontFamilies));
    stage.batchDraw();
    return kinds.map((kind) => ({ kind, dataUrl: renderExport(stage, kind, draft.background) }));
  };

  const exportImage = async (kind: 'card' | 'share' | 'nft') => {
    setExportError(null);
    setBusy(true);
    try {
      const [image] = await renderAll([kind]);
      downloadDataUrl(image.dataUrl, `${fileSlug(draft.name)}-${kind}.png`);
    } catch (error: unknown) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  const exportBundle = async () => {
    setExportError(null);
    setBusy(true);
    try {
      const slug = fileSlug(draft.name);
      // The image URI is the bundle's own NFT file; The ZAO swaps in the stored URI
      // when the card is minted (storage is board card 10524).
      const metadata = buildCardMetadata(draft, {
        imageUri: `${slug}-nft.png`,
        madeAt: new Date(),
      });
      if (!metadata.ok) {
        setExportError(metadata.error);
        return;
      }
      for (const image of await renderAll(['card', 'share', 'nft'])) {
        downloadDataUrl(image.dataUrl, `${slug}-${image.kind}.png`);
      }
      downloadJson(metadata.metadata, `${slug}-metadata.json`);
    } catch (error: unknown) {
      setExportError(error instanceof Error ? error.message : 'Export failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 bg-[#0a1628] px-4 py-6 text-white md:flex-row">
      <section className="md:w-[440px] md:shrink-0">
        <h1 className="mb-1 text-xl font-bold text-[#f5a623]">ZAO Card Builder</h1>
        <p className="mb-4 text-sm text-white/60">
          Make your card. It stays on your device until you export it.
        </p>
        {notice ? (
          <p className="mb-3 rounded-lg bg-white/5 p-3 text-sm text-white/80">{notice}</p>
        ) : null}
        <div ref={containerRef} className="w-full">
          {Object.keys(fontFamilies).length > 0 ? (
            <CardCanvas
              draft={draft}
              displayWidth={displayWidth}
              fontFamilies={fontFamilies}
              textColor={textColor}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onLayerChange={patchLayer}
              stageRef={stageRef}
            />
          ) : (
            <div className="aspect-[5/7] w-full max-w-[420px] animate-pulse rounded-2xl bg-white/5" />
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
            disabled={history.past.length === 0}
            onClick={() => setHistory(undo)}
          >
            Undo
          </button>
          <button
            type="button"
            className="rounded-lg border border-white/15 px-3 py-2 text-sm disabled:opacity-40"
            disabled={history.future.length === 0}
            onClick={() => setHistory(redo)}
          >
            Redo
          </button>
          <span className="ml-auto text-xs text-white/50" aria-live="polite">
            {saveState}
          </span>
        </div>
      </section>
      <section className="flex-1">
        <div role="tablist" className="mb-4 grid grid-cols-4 gap-1 rounded-lg bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`rounded-md px-2 py-2 text-sm ${tab === t.id ? 'bg-[#f5a623] font-semibold text-[#0a1628]' : 'text-white/80'}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === 'card' ? (
          <CardDetailsPanel
            draft={draft}
            onChange={(patch) => update((d) => ({ ...d, ...patch }))}
          />
        ) : null}
        {tab === 'layers' ? (
          <LayersPanel
            layers={draft.layers}
            selectedId={selectedId}
            uploadError={uploadError}
            onSelect={setSelectedId}
            onUpload={(file) => void onUpload(file)}
            onAddText={() => addLayer(newTextLayer(textColor))}
            onAddStats={() => addLayer(newStatsLayer())}
            onMove={moveLayer}
            onToggle={(id) =>
              update((d) => ({
                ...d,
                layers: d.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)),
              }))
            }
            onRemove={(id) => {
              update((d) => ({ ...d, layers: d.layers.filter((l) => l.id !== id) }));
              if (selectedId === id) setSelectedId(null);
            }}
            onLayerChange={patchLayer}
          />
        ) : null}
        {tab === 'credits' ? (
          <CreditsPanel
            credits={draft.credits}
            onChange={(patch) => update((d) => ({ ...d, credits: { ...d.credits, ...patch } }))}
          />
        ) : null}
        {tab === 'export' ? (
          <ExportPanel
            readiness={readiness}
            approved={draft.approved}
            busy={busy}
            error={exportError}
            onApprove={(approved) => update((d) => ({ ...d, approved }))}
            onExportImage={(kind) => void exportImage(kind)}
            onExportBundle={() => void exportBundle()}
          />
        ) : null}
      </section>
    </div>
  );
}
