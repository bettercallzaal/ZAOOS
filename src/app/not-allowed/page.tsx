import Link from 'next/link';

export default function NotAllowedPage() {
  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0a1628] px-6">
      <div className="text-center max-w-sm">
        <h1 className="text-3xl font-bold text-white mb-4">Not on the list yet</h1>
        <p className="text-gray-400 mb-8">
          ZAO OS is currently invite-only for ZAO community members.
          If you think this is an error, reach out to the team.
        </p>
        <Link
          href="/"
          className="text-[#f5a623] hover:text-[#ffd700] font-medium transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </main>
  );
}
