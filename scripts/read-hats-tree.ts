import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

const HATS_ADDRESS = '0x3bc1A0Ad72417f2d411118085256fC53CBdDd137' as `0x${string}`;

const client = createPublicClient({
  chain: optimism,
  transport: http('https://mainnet.optimism.io'),
});

const TREE_DOMAIN = 226;
const topHatId = BigInt(TREE_DOMAIN) << BigInt(224);

const viewHatAbi = [{
  name: 'viewHat',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: '_hatId', type: 'uint256' }],
  outputs: [
    { name: 'details', type: 'string' },
    { name: 'maxSupply', type: 'uint32' },
    { name: 'supply', type: 'uint32' },
    { name: 'eligibility', type: 'address' },
    { name: 'toggle', type: 'address' },
    { name: 'imageUri', type: 'string' },
    { name: 'numChildren', type: 'uint16' },
    { name: 'mutable_', type: 'bool' },
    { name: 'active', type: 'bool' },
  ],
}] as const;

async function main() {
  console.log('Reading ZAO Hat Tree (Tree 226) from Optimism...\n');
  console.log('Top Hat ID:', '0x' + topHatId.toString(16).padStart(64, '0'));

  const topHat = await client.readContract({
    address: HATS_ADDRESS,
    abi: viewHatAbi,
    functionName: 'viewHat',
    args: [topHatId],
  });

  console.log('\n=== TOP HAT ===');
  console.log('Details:', topHat[0]);
  console.log('Max Supply:', topHat[1]);
  console.log('Current Supply:', topHat[2]);
  console.log('Eligibility:', topHat[3]);
  console.log('Toggle:', topHat[4]);
  console.log('Image URI:', topHat[5]);
  console.log('Num Children:', topHat[6]);
  console.log('Mutable:', topHat[7]);
  console.log('Active:', topHat[8]);

  if (topHat[6] > 0) {
    console.log(`\n=== CHILD HATS (${topHat[6]} children) ===`);
    for (let i = 1; i <= topHat[6]; i++) {
      const childId = topHatId | (BigInt(i) << BigInt(208));
      try {
        const child = await client.readContract({
          address: HATS_ADDRESS,
          abi: viewHatAbi,
          functionName: 'viewHat',
          args: [childId],
        });
        console.log(`\nChild ${i}:`);
        console.log('  Hat ID:', '0x' + childId.toString(16).padStart(64, '0'));
        console.log('  Details:', child[0]);
        console.log('  Supply:', child[2], '/', child[1]);
        console.log('  Eligibility:', child[3]);
        console.log('  Toggle:', child[4]);
        console.log('  Children:', child[6]);
        console.log('  Mutable:', child[7]);
        console.log('  Active:', child[8]);

        if (child[6] > 0) {
          for (let j = 1; j <= child[6]; j++) {
            const grandchildId = childId | (BigInt(j) << BigInt(192));
            try {
              const gc = await client.readContract({
                address: HATS_ADDRESS,
                abi: viewHatAbi,
                functionName: 'viewHat',
                args: [grandchildId],
              });
              console.log(`  Grandchild ${i}.${j}:`);
              console.log('    Hat ID:', '0x' + grandchildId.toString(16).padStart(64, '0'));
              console.log('    Details:', gc[0]);
              console.log('    Supply:', gc[2], '/', gc[1]);
              console.log('    Active:', gc[8]);

              if (gc[6] > 0) {
                for (let k = 1; k <= gc[6]; k++) {
                  const ggcId = grandchildId | (BigInt(k) << BigInt(176));
                  try {
                    const ggc = await client.readContract({
                      address: HATS_ADDRESS,
                      abi: viewHatAbi,
                      functionName: 'viewHat',
                      args: [ggcId],
                    });
                    console.log(`    Great-grandchild ${i}.${j}.${k}:`);
                    console.log('      Details:', ggc[0]);
                    console.log('      Supply:', ggc[2], '/', ggc[1]);
                    console.log('      Active:', ggc[8]);
                  } catch { /* empty */ }
                }
              }
            } catch { /* empty */ }
          }
        }
      } catch { /* empty */ }
    }
  }
}

main().catch(console.error);
