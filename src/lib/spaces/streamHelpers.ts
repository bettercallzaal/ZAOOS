export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  // Append short random suffix to avoid collisions
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export function generateCallId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function createStreamUser(session: {
  fid: number;
  displayName: string;
  username: string;
  pfpUrl?: string | null;
}): { id: string; name: string; image?: string } {
  return {
    id: String(session.fid),
    name: session.displayName || session.username,
    image: session.pfpUrl || undefined,
  };
}

export function createGuestUser(): { id: string; name: string; type: 'guest' } {
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  return {
    id: guestId,
    name: 'Guest Listener',
    type: 'guest',
  };
}
