'use client';

import { useState } from 'react';
import type { PublicArtist } from '@/lib/stock/artists';

const STATUS_COLOR: Record<string, string> = {
  wishlist: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  contacted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  interested: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  travel_booked: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  wishlist: 'Wishlist',
  contacted: 'Contacted',
  interested: 'Interested',
  confirmed: 'Confirmed',
  travel_booked: 'Booked',
};

interface Props {
  artist: PublicArtist;
  canEdit: boolean;
  token: string;
}

export function ArtistProfileView({ artist, canEdit, token }: Props) {
  const [bio, setBio] = useState(artist.bio);
  const [photoUrl, setPhotoUrl] = useState(artist.photo_url);
  const [logoUrl, setLogoUrl] = useState(artist.logo_url);
  const [socials, setSocials] = useState(artist.socials);
  const [genre, setGenre] = useState(artist.genre);
  const [city, setCity] = useState(artist.city);
  const [editing, setEditing] = useState(canEdit && !artist.bio);
  const [points, setPoints] = useState(artist.points_earned);
  const [eligible, setEligible] = useState(artist.volunteer_eligible);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [justEarned, setJustEarned] = useState(0);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [photoBroken, setPhotoBroken] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/stock/artist-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: artist.slug,
          token,
          bio,
          photo_url: photoUrl,
          logo_url: logoUrl,
          socials,
          genre,
          city,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setMsg(d.error || 'Save failed');
      } else {
        const d = await res.json();
        if (d.earnedThisCall) {
          setPoints(d.totalPoints);
          setJustEarned(d.earnedThisCall);
          setTimeout(() => setJustEarned(0), 6000);
        }
        if (d.becameEligible) {
          setEligible(true);
          setJustUnlocked(true);
          setTimeout(() => setJustUnlocked(false), 6000);
        }
        setEditing(false);
        setMsg('Saved');
        setTimeout(() => setMsg(null), 2000);
      }
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  const showPhoto = photoUrl && !photoBroken;
  const showLogo = logoUrl && !logoBroken;
  const initials = artist.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasBio = bio.trim().length > 0;
  const hasLogo = logoUrl.trim().length > 0;

  return (
    <section className="bg-gradient-to-br from-[#f5a623]/10 via-transparent to-transparent rounded-2xl p-6 border border-white/[0.08] space-y-4">
      {justEarned > 0 && (
        <div className="bg-[#f5a623]/20 border border-[#f5a623]/50 rounded-lg p-3 text-center">
          <p className="text-xs uppercase tracking-wider font-bold text-[#f5a623]">
            You earned {justEarned} ZAOfestivals Point{justEarned === 1 ? '' : 's'}
          </p>
          <p className="text-[11px] text-gray-300 mt-0.5">
            Paid post-event. Keep moving through the contributor path.
          </p>
        </div>
      )}
      {justUnlocked && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-lg p-3 text-center">
          <p className="text-xs uppercase tracking-wider font-bold text-emerald-400">
            Volunteer eligible unlocked
          </p>
          <p className="text-[11px] text-gray-300 mt-0.5">
            You are now on the roster for Oct 3. See you at the parklet.
          </p>
        </div>
      )}

      <div className="flex items-start gap-4">
        {showPhoto ? (
           
          <img
            src={photoUrl}
            alt={artist.name}
            onError={() => setPhotoBroken(true)}
            className="w-24 h-24 rounded-full object-cover border-2 border-[#f5a623]/40 flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-[#0d1b2a] border-2 border-white/[0.08] flex-shrink-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-500">{initials}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white">{artist.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {artist.status !== 'declined' && (
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase ${STATUS_COLOR[artist.status] || STATUS_COLOR.wishlist}`}>
                {STATUS_LABEL[artist.status] || artist.status}
              </span>
            )}
            {artist.cypher_interested && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase bg-rose-500/10 text-rose-400 border-rose-500/30">
                In the Cypher
              </span>
            )}
            {points > 0 && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
                {points} ZAOfestivals Point{points === 1 ? '' : 's'}
              </span>
            )}
            {eligible && (
              <span className="text-[10px] font-bold px-2 py-1 rounded-full border uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                Volunteer eligible
              </span>
            )}
          </div>
        </div>
      </div>

      {canEdit && (
        <ContributorPath hasBio={hasBio} hasLogo={hasLogo} eligible={eligible} />
      )}

      {!editing && (
        <>
          {bio.trim() ? (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Bio</p>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{bio}</p>
            </div>
          ) : (
            <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 italic">No bio yet.</p>
              {canEdit && (
                <p className="text-[11px] text-gray-500 mt-2">
                  Add a bio below to earn your first ZAOfestivals Point.
                </p>
              )}
            </div>
          )}

          {showLogo && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-2">Brand logo</p>
              { }
              <img
                src={logoUrl}
                alt={`${artist.name} logo`}
                onError={() => setLogoBroken(true)}
                className="max-h-32 max-w-full rounded bg-white/[0.03] p-2 border border-white/[0.06]"
              />
            </div>
          )}

          {(genre || city) && (
            <div className="flex gap-4 text-xs text-gray-400">
              {genre && <span><strong className="text-white">Genre:</strong> {genre}</span>}
              {city && <span><strong className="text-white">City:</strong> {city}</span>}
            </div>
          )}

          {socials.trim() && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Links</p>
              <p className="text-xs text-gray-400 break-words">{socials}</p>
            </div>
          )}

          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="w-full bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {hasBio && hasLogo ? 'Edit my profile' : hasBio ? 'Add my logo (next step)' : 'Start earning points'}
            </button>
          )}
        </>
      )}

      {editing && canEdit && (
        <div className="space-y-3">
          <p className="text-xs text-gray-400 leading-relaxed">
            Editing {artist.name}&apos;s profile. Keep this edit link private; anyone with it can edit this page.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Photo URL</label>
            <input
              value={photoUrl}
              onChange={(e) => { setPhotoUrl(e.target.value); setPhotoBroken(false); }}
              placeholder="https://... (your X / Farcaster pfp)"
              maxLength={500}
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />
            {photoBroken && photoUrl && (
              <p className="text-[10px] text-amber-400">Image did not load. Use a direct https:// URL.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-2">
              Brand logo URL {!hasLogo && <span className="bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded text-[9px] normal-case">+1 point</span>}
            </label>
            <input
              value={logoUrl}
              onChange={(e) => { setLogoUrl(e.target.value); setLogoBroken(false); }}
              placeholder="https://... (your artist brand logo)"
              maxLength={500}
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />
            {logoBroken && logoUrl && (
              <p className="text-[10px] text-amber-400">Image did not load. Use a direct https:// URL.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold flex items-center gap-2">
              Bio {!hasBio && <span className="bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded text-[9px] normal-case">+1 point</span>}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Who you are, what you make, what you bring to ZAOstock"
              rows={6}
              maxLength={2000}
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Genre</label>
              <input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Hip-hop, indie"
                maxLength={100}
                className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Brooklyn, Oakland"
                maxLength={100}
                className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold">Links + Socials</label>
            <input
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              placeholder="x.com/..., farcaster.xyz/..., spotify, soundcloud, website"
              maxLength={500}
              className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded-lg px-4 py-2.5 text-sm transition-colors"
            >
              {busy ? 'Saving...' : 'Save profile'}
            </button>
            {hasBio && (
              <button
                onClick={() => setEditing(false)}
                disabled={busy}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            )}
            {msg && <p className="text-[11px] text-emerald-400 ml-auto">{msg}</p>}
          </div>
        </div>
      )}

      {!canEdit && (
        <p className="text-[11px] text-gray-600 italic text-center">
          To edit this profile you need the claim link from your cypher signup confirmation.
        </p>
      )}
    </section>
  );
}

function ContributorPath({
  hasBio,
  hasLogo,
  eligible,
}: {
  hasBio: boolean;
  hasLogo: boolean;
  eligible: boolean;
}) {
  const steps = [
    { id: 'bio', label: 'Submit your bio', done: hasBio, reward: 1 },
    { id: 'logo', label: 'Share your brand logo', done: hasLogo, reward: 1 },
  ];
  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="bg-[#0d1b2a] border border-white/[0.08] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#f5a623] uppercase tracking-wider font-bold">Contributor Path</p>
        <p className="text-[10px] text-gray-500">
          {completedCount} / {steps.length} steps
          {eligible && <span className="text-emerald-400 ml-2">eligible</span>}
        </p>
      </div>
      <p className="text-[11px] text-gray-400 leading-relaxed">
        Each step earns 1 ZAOfestivals Point (paid post-event). Complete all steps to be eligible to work the event as a volunteer on Oct 3.
      </p>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={s.id} className="flex items-start gap-3">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
              s.done
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#0a1628] text-gray-500 border border-white/[0.1]'
            }`}>
              {s.done ? '\u2713' : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${s.done ? 'text-gray-400 line-through' : 'text-white'}`}>{s.label}</p>
              <p className="text-[10px] text-gray-500">+{s.reward} ZAOfestivals Point</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
