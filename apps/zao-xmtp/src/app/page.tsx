import { redirect } from 'next/navigation';
import { SignIn } from '@/components/SignIn';
import { requireMember } from '@/lib/membership';

export default async function Home() {
  if (await requireMember({ persist: false })) redirect('/messages');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold text-[#f5a623]">ZAO XMTP</h1>
      <p className="text-sm text-slate-300">
        Private, end-to-end encrypted messages between ZAO Respect holders. Sign in with Farcaster; if
        any of your addresses holds OG or ZOR Respect, you are in.
      </p>
      <SignIn />
      <p className="text-xs text-slate-500">
        Your messaging key is made in this browser and never leaves it. We never ask for a wallet
        private key or seed phrase. Clearing this site's data loses your message history on this device.
      </p>
    </main>
  );
}
