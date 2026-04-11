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
    const toUpload = Array.from(files).slice(0, maxFiles - value.length);

    const newItems: UploadItem[] = toUpload.map((f) => ({
      id:         Math.random().toString(36).slice(2),
      file:       f,
      status:     'uploading',
      attachment: null,
      errorMsg:   null,
    }));

    setItems((prev) => [...prev, ...newItems]);

    await Promise.all(
      newItems.map(async (item) => {
        try {
          const res  = await uploadMut.mutateAsync(item.file);
          const att  = res.data.data;
          // Update item to done
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, status: 'done', attachment: att } : i,
            ),
          );
          onChange([...value, att]);
        } catch {
          setItems((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'error', errorMsg: 'Upload failed' }
                : i,
            ),
          );
        }
      }),
    );
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

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
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
            'flex items-center gap-2 px-3 py-2 rounded-[10px] border',
            item.status === 'error'
              ? 'bg-[#FEF2F2] border-[#FECACA]'
              : 'bg-[var(--ghost)] border-[var(--border)]',
          )}
        >
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
            <span className="text-[0.65rem] text-[#DC2626]">{item.errorMsg}</span>
          )}
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="p-0.5 rounded hover:bg-[var(--border)] transition-colors"
          >
            <X size={12} />
          </button>
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
