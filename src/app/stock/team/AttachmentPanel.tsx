'use client';

import { useEffect, useRef, useState } from 'react';

export type AttachmentEntityType = 'sponsor' | 'artist' | 'timeline' | 'note' | 'volunteer';
export type AttachmentKind = 'deck' | 'rider' | 'contract' | 'invoice' | 'photo' | 'other';

interface Attachment {
  id: string;
  entity_type: string;
  entity_id: string;
  kind: AttachmentKind;
  filename: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  download_url: string | null;
  created_at: string;
  uploaded_by_member: { id: string; name: string } | null;
}

const KIND_LABEL: Record<AttachmentKind, string> = {
  deck: 'Deck',
  rider: 'Rider',
  contract: 'Contract',
  invoice: 'Invoice',
  photo: 'Photo',
  other: 'Other',
};

function formatBytes(n: number): string {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentPanel({
  entityType,
  entityId,
  defaultKind = 'other',
}: {
  entityType: AttachmentEntityType;
  entityId: string;
  defaultKind?: AttachmentKind;
}) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kind, setKind] = useState<AttachmentKind>(defaultKind);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    try {
      const res = await fetch(
        `/api/stock/team/attachments?entity_type=${entityType}&entity_id=${entityId}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setAttachments(json.attachments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const urlRes = await fetch('/api/stock/team/attachments/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          kind,
          filename: file.name,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        }),
      });
      const urlJson = await urlRes.json();
      if (!urlRes.ok) throw new Error(urlJson.error || 'Could not get upload URL');

      const putRes = await fetch(urlJson.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!putRes.ok) throw new Error(`Upload failed (${putRes.status})`);

      const commitRes = await fetch('/api/stock/team/attachments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          kind,
          filename: file.name,
          storage_path: urlJson.storagePath,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size,
        }),
      });
      const commitJson = await commitRes.json();
      if (!commitRes.ok) throw new Error(commitJson.error || 'Commit failed');

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this attachment?')) return;
    const res = await fetch('/api/stock/team/attachments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } else {
      const json = await res.json();
      setError(json.error || 'Delete failed');
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wider text-gray-500">Attachments</div>
        <div className="flex items-center gap-2">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as AttachmentKind)}
            className="text-xs bg-[#0a1628] border border-white/10 rounded px-2 py-1 text-gray-300"
            disabled={uploading}
          >
            {(Object.keys(KIND_LABEL) as AttachmentKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
          <label
            className={`text-xs px-3 py-1 rounded border cursor-pointer ${
              uploading
                ? 'border-gray-600 text-gray-500 cursor-wait'
                : 'border-[#f5a623]/40 text-[#f5a623] hover:bg-[#f5a623]/10'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              ref={inputRef}
              type="file"
              hidden
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-xs text-gray-500">Loading...</div>
      ) : attachments.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No attachments yet.</div>
      ) : (
        <ul className="space-y-1">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 text-xs bg-[#0a1628] border border-white/5 rounded px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#f5a623]/10 text-[#f5a623] text-[10px] uppercase tracking-wide">
                  {KIND_LABEL[a.kind]}
                </span>
                <span className="truncate text-gray-200" title={a.filename}>
                  {a.filename}
                </span>
                <span className="shrink-0 text-gray-500">{formatBytes(a.size_bytes)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {a.download_url ? (
                  <a
                    href={a.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#f5a623] hover:underline"
                  >
                    Open
                  </a>
                ) : (
                  <span className="text-gray-600">No URL</span>
                )}
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
