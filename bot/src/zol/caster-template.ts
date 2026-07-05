/**
 * ZOL Farcaster Caster - Ed25519 Signer Integration
 *
 * Posts casts to Snapchain via self-custodied Ed25519 signer.
 *
 * Environment variables (set in bot/.env):
 * - ZOL_SIGNER_PRIVATE_KEY: Ed25519 private key (hex), from ~/.zao/private/zol-signer.json
 * - ZOL_FID: FID number (3338501)
 * - ZOL_HUB_ENDPOINT: gRPC endpoint, default hub-grpc.pinata.cloud:2283
 * - FC_NETWORK: MAINNET (1) or TESTNET (0), default 1
 *
 * Usage:
 *   const caster = new ZOLCaster(env.ZOL_SIGNER_PRIVATE_KEY, env.ZOL_FID)
 *   const result = await caster.post("Hello from ZOL!")
 */

import {
  HubClient,
  NobleEd25519Signer,
  makeCastAdd,
  validateMessage,
  toFarcasterTime,
} from '@farcaster/hub-nodejs'
import type { CastAddMessage, MessageData } from '@farcaster/core'
import { FC_NETWORK } from '@farcaster/core'

interface CastOptions {
  text: string
  parentHash?: Uint8Array // For threaded replies, 32-byte hash
  embeds?: { url: string }[] // Links
  mentions?: number[] // FIDs to mention
  mentionsPositions?: { position: number; length: number }[]
}

interface PostResult {
  success: boolean
  hash?: string
  error?: string
  details?: Record<string, unknown>
}

/**
 * ZOLCaster: Posts casts to Snapchain via Pinata or custom hub.
 *
 * Requires:
 * 1. Ed25519 private key (generated once, stored securely)
 * 2. FID 3338501 (with signer registered in Key Registry)
 * 3. Hub endpoint (Pinata gRPC default)
 */
export class ZOLCaster {
  private signer: NobleEd25519Signer
  private fid: number
  private hubEndpoint: string
  private hubPort: number
  private network: number

  constructor(
    privateKeyHex: string,
    fid: number,
    hubEndpoint: string = 'hub-grpc.pinata.cloud',
    hubPort: number = 2283,
    network: number = FC_NETWORK.MAINNET
  ) {
    // Reconstruct signer from private key
    // CAUTION: privateKeyHex should NEVER come from env in production
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex')
    this.signer = NobleEd25519Signer.create({
      privateKey: privateKeyBytes,
    })

    this.fid = fid
    this.hubEndpoint = hubEndpoint
    this.hubPort = hubPort
    this.network = network

    console.log(`[ZOLCaster] Initialized for FID ${fid} on network ${network}`)
    console.log(`[ZOLCaster] Hub: ${hubEndpoint}:${hubPort}`)
  }

  /**
   * Post a cast to Snapchain
   */
  async post(options: CastOptions): Promise<PostResult> {
    try {
      // Validate input
      if (!options.text || options.text.trim().length === 0) {
        return { success: false, error: 'Cast text cannot be empty' }
      }
      if (options.text.length > 320) {
        return { success: false, error: 'Cast exceeds 320 character limit' }
      }

      // Build CastAdd message
      const castData: MessageData = {
        type: 1, // CAST_TYPE_ADD
        fid: this.fid,
        timestamp: toFarcasterTime(new Date()),
        network: this.network,
        castAddBody: {
          text: options.text,
          embeds: options.embeds || [],
          mentions: options.mentions || [],
          mentionsPositions: options.mentionsPositions || [],
          parentHash: options.parentHash || new Uint8Array(32), // Root cast
          parentFid: 0,
        },
      }

      // Sign with Ed25519 signer
      const message = await makeCastAdd(
        castData.castAddBody,
        { fid: this.fid, network: this.network },
        this.signer
      )

      // Validate message structure before submission
      const validationResult = validateMessage(message)
      if (!validationResult.isValid()) {
        return {
          success: false,
          error: 'Message validation failed',
          details: { validation: validationResult.error },
        }
      }

      // Submit to hub via gRPC
      const submitResult = await this.submitToHub(message)
      return submitResult
    } catch (error: unknown) {
      console.error('[ZOLCaster] Post error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Submit signed message to Snapchain hub via gRPC
   */
  private async submitToHub(
    message: CastAddMessage
  ): Promise<PostResult> {
    let client: HubClient | null = null

    try {
      // Connect to hub
      client = HubClient.create({
        address: this.hubEndpoint,
        port: this.hubPort,
        credentials: undefined, // Use insecure connection for Pinata free tier
      })

      console.log(`[ZOLCaster] Connecting to ${this.hubEndpoint}:${this.hubPort}...`)

      // Submit message
      const submitResult = await client.submitMessage(message)

      if (submitResult.isOk()) {
        const hash = submitResult.value
        console.log(`[ZOLCaster] Cast submitted: hash=${hash}`)
        return {
          success: true,
          hash: hash,
        }
      } else {
        const errorMsg = submitResult.error?.message || 'Unknown error'
        console.error(`[ZOLCaster] Hub rejected message: ${errorMsg}`)
        return {
          success: false,
          error: `Hub error: ${errorMsg}`,
          details: { code: submitResult.error?.code },
        }
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[ZOLCaster] Hub connection error: ${errorMsg}`)
      return {
        success: false,
        error: `Connection error: ${errorMsg}`,
      }
    } finally {
      if (client) {
        await client.close()
      }
    }
  }

  /**
   * Alternative: Submit via HTTP to Pinata (simpler, slower 1-2h lag)
   * Use if gRPC fails.
   */
  async postViaHTTP(options: CastOptions): Promise<PostResult> {
    try {
      if (!options.text || options.text.trim().length === 0) {
        return { success: false, error: 'Cast text cannot be empty' }
      }

      const castData = {
        text: options.text,
        embeds: options.embeds || [],
        mentions: options.mentions || [],
        mentionsPositions: options.mentionsPositions || [],
        parentHash: options.parentHash || new Uint8Array(32),
        parentFid: 0,
      }

      const message = await makeCastAdd(
        castData,
        { fid: this.fid, network: this.network },
        this.signer
      )

      const response = await fetch('https://hub.pinata.cloud/v1/submitMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        }
      }

      const result = await response.json() as { hash?: string }
      console.log(`[ZOLCaster] Cast submitted via HTTP: hash=${result.hash}`)
      return {
        success: true,
        hash: result.hash,
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error(`[ZOLCaster] HTTP submission error: ${errorMsg}`)
      return {
        success: false,
        error: `HTTP error: ${errorMsg}`,
      }
    }
  }
}

/**
 * Telegram command handler example:
 *
 * bot.on('message', async (msg) => {
 *   if (msg.text?.startsWith('/post ')) {
 *     const castText = msg.text.replace('/post ', '')
 *     const result = await caster.post({ text: castText })
 *
 *     if (result.success) {
 *       bot.sendMessage(msg.chat.id, `Posted! Hash: ${result.hash}`)
 *     } else {
 *       bot.sendMessage(msg.chat.id, `Error: ${result.error}`)
 *     }
 *   }
 * })
 */

/**
 * Integration test (run with npx ts-node)
 */
if (require.main === module) {
  const testMain = async () => {
    const privateKey = process.env.ZOL_SIGNER_PRIVATE_KEY
    const fid = Number(process.env.ZOL_FID || '3338501')
    const hubEndpoint = process.env.ZOL_HUB_ENDPOINT || 'hub-grpc.pinata.cloud'

    if (!privateKey) {
      console.error('Error: ZOL_SIGNER_PRIVATE_KEY not set')
      process.exit(1)
    }

    const caster = new ZOLCaster(privateKey, fid, hubEndpoint)

    // Test post
    console.log('\n[TEST] Posting test cast...')
    const result = await caster.post({
      text: 'ZOL signer test - Ed25519 integration live!',
    })

    if (result.success) {
      console.log('\n[SUCCESS] Cast posted!')
      console.log(`Hash: ${result.hash}`)
      console.log(`View at: https://warpcast.com/~/none?hash=${result.hash}`)
    } else {
      console.log('\n[FAILED] Cast not posted')
      console.log(`Error: ${result.error}`)
      if (result.details) {
        console.log('Details:', JSON.stringify(result.details, null, 2))
      }
    }

    process.exit(result.success ? 0 : 1)
  }

  testMain().catch((err) => {
    console.error('Test failed:', err)
    process.exit(1)
  })
}
