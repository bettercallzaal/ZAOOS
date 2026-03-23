// src/lib/publish/lens-client.ts
import { PublicClient, mainnet, testnet } from "@lens-protocol/client";

const LENS_APP_ADDRESS = process.env.NEXT_PUBLIC_LENS_APP_ADDRESS
  || "0x8A5Cc31180c37078e1EbA2A23c861Acf351a97cE";

let clientInstance: ReturnType<typeof PublicClient.create> | null = null;

/**
 * Get or create the Lens V3 PublicClient.
 * Uses mainnet by default. Pass testnet for development.
 */
export function getLensClient(env: 'mainnet' | 'testnet' = 'mainnet') {
  if (clientInstance) return clientInstance;

  clientInstance = PublicClient.create({
    environment: env === 'testnet' ? testnet : mainnet,
    origin: "https://zaoos.com",
  });

  return clientInstance;
}

export function getLensAppAddress() {
  return LENS_APP_ADDRESS;
}
