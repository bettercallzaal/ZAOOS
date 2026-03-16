'use client';

export function RequestAccessButton() {
  const requestAccess = () => {
    const text = encodeURIComponent('@zaal requesting access to ZAO OS!');
    const url = `https://warpcast.com/~/compose?text=${text}&channelKey=zao`;
    window.open(url, '_blank');
  };

  return (
    <button
      onClick={requestAccess}
      className="bg-gradient-to-r from-[#f5a623] to-[#ffd700] text-[#0a1628] font-semibold px-6 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity w-full max-w-xs mx-auto block"
    >
      Request Access in /zao
    </button>
  );
}
