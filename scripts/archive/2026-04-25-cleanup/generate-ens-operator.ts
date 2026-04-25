import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

/**
 * Generate a dedicated operator wallet for ENS subname creation.
 *
 * This wallet gets APPROVED as an operator on thezao.eth via NameWrapper.
 * It can create subnames but CANNOT transfer or sell the parent domain.
 *
 * If this key leaks, worst case = someone creates subnames. Your main
 * wallet (thezao.eth owner) stays safe.
 *
 * After running this:
 * 1. Copy ENS_OPERATOR_PRIVATE_KEY to .env.local
 * 2. Go to app.ens.domains → thezao.eth → Permissions
 * 3. Add the operator address as an approved operator
 *    OR call NameWrapper.setApprovalForAll(operatorAddress, true)
 *    from your main wallet
 */

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

console.log('=== ZAO ENS Subname Operator Wallet ===');
console.log('');
console.log('Address:', account.address);
console.log('Private Key:', privateKey);
console.log('');
console.log('Add this to your .env.local:');
console.log(`ENS_OPERATOR_PRIVATE_KEY=${privateKey}`);
console.log('');
console.log('Then approve this address as an operator for thezao.eth:');
console.log('');
console.log('  Option A (app.ens.domains):');
console.log('    1. Go to app.ens.domains → thezao.eth');
console.log('    2. More → Send to manager (set as approved operator)');
console.log(`    3. Enter: ${account.address}`);
console.log('');
console.log('  Option B (Etherscan):');
console.log('    1. Go to https://etherscan.io/address/0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401#writeContract');
console.log('    2. Connect your thezao.eth owner wallet');
console.log('    3. Call setApprovalForAll:');
console.log(`       operator: ${account.address}`);
console.log('       approved: true');
console.log('');
console.log('This operator can create subnames but CANNOT:');
console.log('  - Transfer thezao.eth');
console.log('  - Change thezao.eth ownership');
console.log('  - Access any funds in the owner wallet');
console.log('');
console.log('IMPORTANT: Never commit .env.local. Add ENS_OPERATOR_PRIVATE_KEY to Vercel env vars too.');
