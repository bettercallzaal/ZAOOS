/**
 * Farcaster protocol contract addresses + minimal ABIs on Optimism (OP Mainnet, chainId 10).
 *
 * VERIFY before spending gas: these are the well-known public Farcaster contract addresses,
 * but the operator MUST confirm them against the current docs.farcaster.xyz contracts page
 * before running register-signer.ts. Addresses have been stable since 2023 but anti-fabrication
 * rule (doc 761) requires a live check rather than trusting recall. Set FARCASTER_VERIFY_OK=1
 * in env once you have confirmed them to unblock the script.
 */

export const OP_CHAIN_ID = 10;

/** VERIFY against https://docs.farcaster.xyz/reference/contracts/deployments */
export const FARCASTER_CONTRACTS = {
  IdGateway: '0x00000000Fc25870C6eD6b6c7E41Fb078b7656f69',
  IdRegistry: '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b',
  KeyGateway: '0x00000000fC56947c7E7183f8Ca4B62398CaAdf0B',
  KeyRegistry: '0x00000000Fc1237824fb747aBDE0FF18990E59b7e',
  SignedKeyRequestValidator: '0x00000000FC700472606ED4fA22623Acf62c60553',
  StorageRegistry: '0x00000000fcCe7f938e7aE6D3c335bD6a1a7c593D',
} as const;

/** EIP-712 domain for the SignedKeyRequestValidator metadata signature. VERIFY name/version. */
export const SIGNED_KEY_REQUEST_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: OP_CHAIN_ID,
  verifyingContract: FARCASTER_CONTRACTS.SignedKeyRequestValidator as `0x${string}`,
} as const;

export const SIGNED_KEY_REQUEST_TYPES = {
  SignedKeyRequest: [
    { name: 'requestFid', type: 'uint256' },
    { name: 'key', type: 'bytes' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

// --- Minimal ABIs (only the functions we call) ---

export const ID_GATEWAY_ABI = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'payable',
    inputs: [{ name: 'recovery', type: 'address' }],
    outputs: [
      { name: 'fid', type: 'uint256' },
      { name: 'overpayment', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'price',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export const ID_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'idOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: 'fid', type: 'uint256' }],
  },
] as const;

export const KEY_GATEWAY_ABI = [
  {
    type: 'function',
    name: 'add',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'keyType', type: 'uint32' },
      { name: 'key', type: 'bytes' },
      { name: 'metadataType', type: 'uint8' },
      { name: 'metadata', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

/**
 * SignedKeyRequestValidator.encodeMetadata - the CORRECT way to build the `metadata` arg for
 * KeyGateway.add. Do NOT manually ABI-encode the struct: the metadata is a dynamic struct and
 * manual encoding misses the dynamic offset pointer, producing bytes the validator rejects
 * (verified, Neynar docs / doc 762). Call this view function on-chain instead.
 *
 * function encodeMetadata(uint256 requestFid, address signer, bytes signature, uint256 deadline)
 *   external view returns (bytes)
 */
export const SIGNED_KEY_REQUEST_VALIDATOR_ABI = [
  {
    type: 'function',
    name: 'encodeMetadata',
    stateMutability: 'view',
    inputs: [
      { name: 'requestFid', type: 'uint256' },
      { name: 'signer', type: 'address' },
      { name: 'signature', type: 'bytes' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bytes' }],
  },
] as const;
