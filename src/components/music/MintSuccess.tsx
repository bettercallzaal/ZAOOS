'use client';

interface MintSuccessProps {
  title: string;
  artist: string;
  txId: string;
  coverUrl: string | null;
  bazarUrl: string;
  onClose: () => void;
}

export default function MintSuccess({ title, artist, txId, coverUrl, bazarUrl, onClose }: MintSuccessProps) {
  const arweaveUrl = `https://arweave.net/${txId}`;

  return (
    <div className="text-center py-6">
      {coverUrl && (
        <div className="w-32 h-32 mx-auto rounded-xl overflow-hidden mb-4 ring-2 ring-[#f5a623]/40">
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <p className="text-lg font-bold text-green-400 mb-1">Minted to the Permaweb</p>
      <p className="text-sm text-white">{title}</p>
      <p className="text-xs text-gray-500 mb-1">by {artist}</p>
      <p className="text-[10px] text-gray-600 font-mono mb-6">ar://{txId.slice(0, 12)}...{txId.slice(-6)}</p>
      <div className="space-y-2 max-w-xs mx-auto">
        <a href={bazarUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full px-4 py-2.5 rounded-lg bg-[#f5a623] text-[#0a1628] text-sm font-medium hover:bg-[#f5a623]/90 transition-colors text-center">
          View on BazAR
        </a>
        <a href={arweaveUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full px-4 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm hover:bg-white/5 transition-colors text-center">
          View on Arweave
        </a>
        <button onClick={onClose}
          className="block w-full px-4 py-2.5 rounded-lg text-gray-500 text-sm hover:text-white transition-colors text-center">
          Done
        </button>
      </div>
      <p className="text-[9px] text-gray-600 mt-6">Stored permanently on Arweave — 200+ years guaranteed</p>
    </div>
  );
}
