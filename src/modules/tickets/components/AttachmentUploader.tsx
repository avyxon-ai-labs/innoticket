import { useRef, useState }      from 'react';
import { Paperclip, X, Upload,
         FileText, Image,
         AlertCircle }           from 'lucide-react';
import { cn }                    from '../../../utils';
import { useUploadAttachment }   from '../hooks';
import type { Attachment }       from '../../../services/ticket.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

function humanSize(bytes: number): string {
  if (bytes < 1024)          return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image  size={14} className="text-[#3B82F6]" />;
  return <FileText size={14} className="text-[var(--ink-light)]" />;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value:     Attachment[];
  onChange:  (attachments: Attachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadItem {
  id:         string;
  file:       File;
  status:     'uploading' | 'done' | 'error';
  attachment: Attachment | null;
  errorMsg:   string | null;
  debugInfo?: string; // ⚠️ TEMP — remove before release
}

export function AttachmentUploader({
  value, onChange, maxFiles = 10, disabled = false,
}: Props) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const inputRef          = useRef<HTMLInputElement>(null);
  const uploadMut         = useUploadAttachment();

  const isAtMax = value.length >= maxFiles;

  async function handleFiles(files: FileList | null) {
    if (!files || disabled) return;
    const raw = Array.from(files).slice(0, maxFiles - value.length);

    // ⚠️ TEMP DEBUG: collect per-file info before & after arrayBuffer copy
    type FileDebug = { orig: string; copied: string; file: File };
    const debugged = await Promise.all(
      raw.map(async (f): Promise<FileDebug> => {
        const orig = `orig: name="${f.name}" size=${f.size} type="${f.type || '(empty)'}"`;
        try {
          const buf  = await f.arrayBuffer();
          const mime = f.type || 'image/jpeg';
          const blob = new Blob([buf], { type: mime });
          const copy = new File([blob], f.name || 'photo.jpg', { type: mime });
          const copied = `copy: name="${copy.name}" size=${copy.size} type="${copy.type}"`;
          return { orig, copied, file: copy };
        } catch (e) {
          return { orig, copied: `arrayBuffer() FAILED: ${String(e)}`, file: f };
        }
      }),
    );

    const toUpload = debugged.map((d) => d.file);

    const newItems: UploadItem[] = toUpload.map((f, idx) => ({
      id:         Math.random().toString(36).slice(2),
      file:       f,
      status:     'uploading',
      attachment: null,
      errorMsg:   null,
      debugInfo:  debugged[idx].orig + ' | ' + debugged[idx].copied,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // Upload all in parallel, collect results, then call onChange once
    // (avoids stale-closure bug where each callback sees the same old `value`)
    const results = await Promise.all(
      newItems.map(async (item) => {
        try {
          const res = await uploadMut.mutateAsync(item.file);
          const att = res.data.data;
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'done', attachment: att } : i,
            ),
          );
          return att;
        } catch (err: unknown) {
          // ⚠️ TEMP DEBUG: surface full error details on screen
          const e = err as Record<string, unknown>;
          const status  = (e?.response as Record<string, unknown>)?.status;
          const srvMsg  = ((e?.response as Record<string, unknown>)?.data as Record<string, unknown>)?.message;
          const netMsg  = e?.message;
          const debugErr = [
            status  ? `HTTP ${status}`          : null,
            srvMsg  ? `server: "${srvMsg}"`      : null,
            netMsg  ? `err: "${String(netMsg)}"` : null,
          ].filter(Boolean).join(' | ') || 'unknown error';

          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'error', errorMsg: debugErr }
                : i,
            ),
          );
          return null;
        }
      }),
    );

    const uploaded = results.filter((a): a is Attachment => a !== null);
    if (uploaded.length > 0) {
      onChange([...value, ...uploaded]);
    }
  }

  function removeExisting(idx: number) {
    const next = value.filter((_, i) => i !== idx);
    onChange(next);
  }

  function removeItem(id: string) {
    const item = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (item?.attachment) {
      onChange(value.filter((a) => a.fileUrl !== item.attachment?.fileUrl));
    }
  }

  // Drag-and-drop
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      {!isAtMax && !disabled && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-[12px] px-4 py-5',
            'flex flex-col items-center gap-2 cursor-pointer',
            'text-[var(--ink-light)] transition-colors',
            'hover:border-[var(--sage)] hover:text-[var(--sage)] hover:bg-[var(--sage-light)]',
            'border-[var(--border)]',
          )}
        >
          <Upload size={18} />
          <div className="text-center">
            <p className="text-xs font-medium">Click or drag to upload</p>
            <p className="text-[0.65rem] mt-0.5">PNG, JPG, PDF, DOCX — max {maxFiles} files</p>
          </div>
        </div>
      )}

      {/* No `capture` attribute — lets mobile show the full picker:
          camera, photo library, and file browser. */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // Reset so the same file can be re-selected after removal
          e.target.value = '';
        }}
      />

      {/* Existing attachments */}
      {value.length > 0 && (
        <div className="flex flex-col gap-1">
          {value.map((att, idx) => (
            <div
              key={att.fileUrl}
              className="flex items-center gap-2 px-3 py-2 rounded-[10px]
                         bg-[var(--ghost)] border border-[var(--border)]"
            >
              <FileIcon type={att.fileType} />
              <a
                href={att.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs truncate text-[var(--ink)] hover:text-[var(--sage)] transition-colors"
              >
                {att.fileName}
              </a>
              <span className="text-[0.65rem] text-[var(--ink-light)] shrink-0">
                {humanSize(att.fileSize)}
              </span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeExisting(idx)}
                  className="p-0.5 rounded hover:bg-[var(--border)] transition-colors text-[var(--ink-light)]"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* In-progress / error items */}
      {items.filter((i) => i.status !== 'done').map((item) => (
        <div
          key={item.id}
          className={cn(
            'flex flex-col gap-1 px-3 py-2 rounded-[10px] border',
            item.status === 'error'
              ? 'bg-[#FEF2F2] border-[#FECACA]'
              : 'bg-[var(--ghost)] border-[var(--border)]',
          )}
        >
          <div className="flex items-center gap-2">
            {item.status === 'uploading' ? (
              <Paperclip size={13} className="text-[var(--ink-light)] animate-pulse" />
            ) : (
              <AlertCircle size={13} className="text-[#DC2626] shrink-0" />
            )}
            <span className="flex-1 text-xs truncate text-[var(--ink)]">{item.file.name}</span>
            {item.status === 'uploading' && (
              <span className="text-[0.65rem] text-[var(--ink-light)]">Uploading…</span>
            )}
            {item.status === 'error' && (
              <span className="text-[0.65rem] font-semibold text-[#DC2626]">{item.errorMsg}</span>
            )}
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="p-0.5 rounded hover:bg-[var(--border)] transition-colors"
            >
              <X size={12} />
            </button>
          </div>
          {/* ⚠️ TEMP DEBUG — remove before release */}
          {item.debugInfo && (
            <p className="text-[0.6rem] font-mono text-[#7C3AED] break-all leading-relaxed">
              {item.debugInfo}
            </p>
          )}
        </div>
      ))}

      {value.length > 0 && (
        <p className="text-[0.65rem] text-[var(--ink-light)]">
          {value.length}/{maxFiles} file{value.length !== 1 ? 's' : ''} attached
        </p>
      )}
    </div>
  );
}
