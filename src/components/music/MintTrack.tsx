'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LicensePicker from './LicensePicker';
import MintSuccess from './MintSuccess';

interface MintTrackProps {
  isOpen: boolean;
  onClose: () => void;
}

const GENRES = ['Hip-Hop', 'R&B', 'Electronic', 'Lo-Fi', 'Jazz', 'Afrobeats', 'Soul', 'Experimental'];

const PRICE_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: '1', label: '1 $U' },
  { value: '5', label: '5 $U' },
  { value: 'custom', label: 'Custom' },
];

const INPUT_CLASS =
  'w-full bg-[#0a1628] border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/50';

const MAX_AUDIO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_COVER_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MintTrack({ isOpen, onClose }: MintTrackProps) {
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [licensePreset, setLicensePreset] = useState('collectible');
  const [price, setPrice] = useState<string>('free');
  const [customPrice, setCustomPrice] = useState('');
  const [minting, setMinting] = useState(false);
  const [mintProgress, setMintProgress] = useState('');
  const [result, setResult] = useState<{ txId: string; coverUrl: string | null; bazarUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill artist from session
  useEffect(() => {
    if (user?.displayName && !artist) {
      setArtist(user.displayName);
    }
  }, [user?.displayName, artist]);

  if (!isOpen) return null;

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AUDIO_SIZE) {
      setError(`Audio file too large (${formatFileSize(file.size)}). Max 50MB.`);
      e.target.value = '';
      return;
    }
    setError(null);
    setAudioFile(file);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_COVER_SIZE) {
      setError(`Cover image too large (${formatFileSize(file.size)}). Max 5MB.`);
      e.target.value = '';
      return;
    }
    setError(null);
    setCoverFile(file);
  };

  const handleMint = async () => {
    setMinting(true);
    setError(null);
    setMintProgress('Uploading to Arweave...');

    try {
      const formData = new FormData();
      formData.append('audio', audioFile!);
      if (coverFile) formData.append('cover', coverFile);
      formData.append('metadata', JSON.stringify({
        title,
        artist,
        genre: genre || undefined,
        description: description || undefined,
        licensePreset,
      }));

      const res = await fetch('/api/music/mint', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          throw new Error('Arweave minting is not yet configured. This feature is coming soon.');
        }
        throw new Error(data.error || 'Mint failed');
      }

      setResult({
        txId: data.asset.txId,
        coverUrl: data.asset.coverUrl,
        bazarUrl: data.asset.bazarUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mint failed');
    } finally {
      setMinting(false);
      setMintProgress('');
    }
  };

  const handleClose = () => {
    // Reset state on close
    setStep(1);
    setAudioFile(null);
    setCoverFile(null);
    setTitle('');
    setArtist(user?.displayName || '');
    setGenre('');
    setDescription('');
    setLicensePreset('collectible');
    setPrice('free');
    setCustomPrice('');
    setMinting(false);
    setMintProgress('');
    setResult(null);
    setError(null);
    onClose();
  };

  const canAdvanceStep1 = audioFile !== null && title.trim().length > 0;

  const displayPrice = price === 'custom' ? `${customPrice || '0'} $U` : price === 'free' ? 'Free' : `${price} $U`;

  // ---------- Render MintSuccess ----------
  if (result) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div className="w-full max-w-lg rounded-2xl border border-[#f5a623]/20 bg-[#0d1b2a] p-6 shadow-xl">
          <MintSuccess
            title={title}
            artist={artist}
            txId={result.txId}
            coverUrl={result.coverUrl}
            bazarUrl={result.bazarUrl}
            onClose={handleClose}
          />
        </div>
      </div>
    );
  }

  // ---------- Modal ----------
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !minting) handleClose();
      }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#f5a623]/20 bg-[#0d1b2a] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Mint Track</h2>
          <button
            onClick={handleClose}
            disabled={minting}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none disabled:opacity-40"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-2 h-2 rounded-full transition-colors ${
              s === step ? 'bg-[#f5a623]' : s < step ? 'bg-[#f5a623]/40' : 'bg-gray-700'
            }`} />
          ))}
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Minting progress */}
        {minting && mintProgress && (
          <div className="mb-4 rounded-lg border border-[#f5a623]/30 bg-[#f5a623]/10 px-4 py-3 text-sm text-[#f5a623]">
            {mintProgress}
          </div>
        )}

        {/* ========== Step 1: Upload ========== */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Upload</h3>

            {/* Audio file */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Audio File *</label>
              <input
                type="file"
                accept=".mp3,.mp4,.wav,.flac,.ogg,.aac"
                onChange={handleAudioSelect}
                className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#f5a623]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#f5a623] hover:file:bg-[#f5a623]/20 file:cursor-pointer cursor-pointer"
              />
              {audioFile && (
                <p className="mt-1 text-xs text-gray-500">
                  {audioFile.name} ({formatFileSize(audioFile.size)})
                </p>
              )}
            </div>

            {/* Cover art */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Cover Art</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={handleCoverSelect}
                className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[#f5a623]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#f5a623] hover:file:bg-[#f5a623]/20 file:cursor-pointer cursor-pointer"
              />
              {coverFile && (
                <p className="mt-1 text-xs text-gray-500">
                  {coverFile.name} ({formatFileSize(coverFile.size)})
                </p>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Track title"
                className={INPUT_CLASS}
                maxLength={120}
              />
            </div>

            {/* Artist */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Artist</label>
              <input
                type="text"
                value={artist}
                onChange={e => setArtist(e.target.value)}
                placeholder="Artist name"
                className={INPUT_CLASS}
                maxLength={80}
              />
            </div>

            {/* Genre */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Genre</label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(genre === g ? '' : g)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      genre === g
                        ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                        : 'border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description or liner notes"
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>

            {/* Next button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!canAdvanceStep1}
                className="rounded-lg bg-[#f5a623] px-5 py-2 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ========== Step 2: License & Price ========== */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">License &amp; Price</h3>

            {/* License picker */}
            <LicensePicker value={licensePreset} onChange={setLicensePreset} />

            {/* Price options */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500">Price</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRICE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPrice(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      price === opt.value
                        ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                        : 'border-gray-700/50 bg-[#0a1628] text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {price === 'custom' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    value={customPrice}
                    onChange={e => setCustomPrice(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="any"
                    className={`${INPUT_CLASS} max-w-[120px]`}
                  />
                  <span className="text-sm text-gray-500">$U</span>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 rounded-lg border border-gray-700/50 bg-transparent px-4 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* ========== Step 3: Confirm & Mint ========== */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">Confirm &amp; Mint</h3>

            {/* Preview */}
            <div className="rounded-lg border border-gray-700/50 bg-[#0a1628] p-4 space-y-3">
              <div className="flex items-start gap-4">
                {/* Cover preview */}
                {coverFile ? (
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(coverFile)}
                      alt="Cover preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-800">
                    <span className="text-2xl text-gray-600">&#9835;</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-white truncate">{title}</p>
                  <p className="text-sm text-gray-400 truncate">{artist}</p>
                  {genre && <p className="text-xs text-gray-500 mt-0.5">{genre}</p>}
                </div>
              </div>

              {description && (
                <p className="text-xs text-gray-500 border-t border-gray-700/50 pt-2">{description}</p>
              )}

              <div className="flex items-center justify-between border-t border-gray-700/50 pt-2 text-xs">
                <span className="text-gray-500">Audio</span>
                <span className="text-gray-400">
                  {audioFile?.name} ({audioFile ? formatFileSize(audioFile.size) : ''})
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">License</span>
                <span className="text-gray-400 capitalize">{licensePreset}</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Price</span>
                <span className="text-gray-400">{displayPrice}</span>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={minting}
                className="flex-1 rounded-lg border border-gray-700/50 bg-transparent px-4 py-2 text-sm text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Back
              </button>
              <button
                onClick={handleMint}
                disabled={minting}
                className="flex-1 rounded-lg bg-[#f5a623] px-4 py-2 text-sm font-semibold text-[#0a1628] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {minting ? 'Minting...' : 'Mint & List'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
