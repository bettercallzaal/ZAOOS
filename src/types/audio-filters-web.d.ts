declare module '@stream-io/audio-filters-web' {
  export class NoiseCancellation {
    isSupported(): boolean | Promise<boolean>;
    isEnabled(): Promise<boolean>;
    init(options: { tracer?: unknown }): Promise<void>;
    dispose(): Promise<void>;
    on(event: 'change', callback: (enabled: boolean) => void): () => void;
    setSuppressionLevel(level: string): void;
  }
}
