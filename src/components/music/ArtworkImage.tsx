'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ArtworkImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  sizes?: string;
}

export function ArtworkImage({ src, alt, ...props }: ArtworkImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#1a2a3a] to-[#0a1628] ${props.className || ''}`}
        style={props.fill ? { position: 'absolute', inset: 0 } : { width: props.width, height: props.height }}
      >
        <svg className="w-1/3 h-1/3 text-[#f5a623]/40" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    );
  }

  return <Image src={src} alt={alt} onError={() => setError(true)} unoptimized {...props} />;
}
