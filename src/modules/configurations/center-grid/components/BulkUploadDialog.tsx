import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal }   from 'react-dom';
import { useNavigate }    from 'react-router-dom';
import {
  Download, Upload, X, FileSpreadsheet,
  CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { cn }             from '../../../../utils';
import { Button }         from '../../../../components/ui/Button';
import { bulkService, jobService }            from '../../../../services/job.service';
import type { JobResponse, JobErrorDetail }   from '../../../../services/job.service';

// ── Constants ─────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2500;
const TERMINAL = new Set(['COMPLETED', 'FAILED']);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse tilde-separated phase string into ordered step list.
 *  e.g. "INITIALIZED~DOWNLOADING~PARSING~PROCESSING~COMPLETED"
 *  → ['INITIALIZED','DOWNLOADING','PARSING','PROCESSING','COMPLETED']
 */
function parsePhaseSteps(phase: string): string[] {
  return phase.split('~').map((s) => s.trim()).filter(Boolean);
}

/** Pretty-print a phase token: "INITIALIZED" → "Initialized" */
function formatStep(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatRows(processed: number, total: number): string | null {
  if (!total) return null;
  return `${processed.toLocaleString()} / ${total.toLocaleString()} rows`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorDetails({ errors }: { errors: JobErrorDetail[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? errors : errors.slice(0, 3);

  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-[0.68rem] font-semibold text-[var(--red)]
                   hover:opacity-80 transition-opacity self-start"
      >
        <ChevronDown
          size={12}
          className={cn('transition-transform duration-200', expanded && 'rotate-180')}
        />
        {expanded ? 'Hide' : 'Show'} {errors.length} error{errors.length !== 1 ? 's' : ''}
      </button>

      {expanded && (
        <div className="rounded-[8px] border border-[var(--red)]/20 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[3rem_6rem_1fr] gap-2 px-3 py-1.5
                          bg-[var(--red-light)] text-[0.58rem] font-semibold
                          uppercase tracking-wider text-[var(--red)] border-b border-[var(--red)]/20">
            <span>Row</span>
            <span>Column</span>
            <span>Error</span>
          </div>
          <div className="max-h-48 overflow-y-auto overscroll-contain divide-y divide-[var(--red)]/10">
            {errors.map((e, i) => (
              <div
                key={i}
                className="grid grid-cols-[3rem_6rem_1fr] gap-2 px-3 py-2
                           text-[0.68rem] text-[var(--ink)] hover:bg-[var(--ghost)]
                           transition-colors"
              >
                <span className="font-mono font-semibold tabular-nums text-[var(--red)]">
                  {e.rowNumber}
                </span>
                <span className="font-medium truncate">{e.column || '—'}</span>
                <span className="text-[var(--ink-mid)] leading-snug break-words">
                  {e.errorMessage}
                  {e.invalidValue != null && (
                    <span className="ml-1 font-mono text-[0.62rem] text-[var(--ink-light)]">
                      ({e.invalidValue})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed preview — first 3 rows */}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex flex-col gap-1 text-left w-full group"
        >
          {shown.map((e, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[0.68rem] text-[var(--red)] opacity-80">
              <span className="font-mono shrink-0">Row {e.rowNumber}:</span>
              <span className="leading-snug">{e.errorMessage}</span>
            </div>
          ))}
          {errors.length > 3 && (
            <span className="text-[0.65rem] text-[var(--ink-light)] group-hover:text-[var(--red)] transition-colors mt-0.5">
              +{errors.length - 3} more — click to expand
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function PipelineBar({ phase, status }: { phase: string; status: string }) {
  const steps  = parsePhaseSteps(phase);
  const failed = status === 'FAILED';

  // All steps in the phase string are "done" except the last when still running;
  // on FAILED the last step is the failing one; on COMPLETED all are done.
  const lastIdx = steps.length - 1;

  if (steps.length === 0) return null;

  return (
    <div className="flex items-center gap-0 w-full mt-1">
      {steps.map((step, i) => {
        const isLast    = i === lastIdx;
        const done      = !isLast || status === 'COMPLETED';
        const current   = isLast && !TERMINAL.has(status);
        const bad       = isLast && failed;
        return (
          <div key={`${step}-${i}`} className="flex items-center flex-1 min-w-0">
            {/* Node */}
            <div className="flex flex-col items-center shrink-0">
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-300',
                bad     ? 'bg-[var(--red)] text-white'                          :
                done    ? 'bg-[var(--sage)] text-white'                          :
                current ? 'bg-[var(--sage-light)] ring-2 ring-[var(--sage)]'    :
                          'bg-[var(--ghost)] border border-[var(--border)]',
              )}>
                {bad     ? <X           size={10} strokeWidth={3} />                           :
                 done    ? <CheckCircle2 size={11} strokeWidth={2.5} className="shrink-0" />   :
                 current ? <Loader2      size={10} className="animate-spin text-[var(--sage)]" /> :
                           <span className="text-[0.5rem] font-bold text-[var(--ink-light)]">{i + 1}</span>}
              </div>
              <span className={cn(
                'text-[0.55rem] mt-0.5 text-center leading-tight hidden sm:block max-w-[52px] truncate',
                bad     ? 'text-[var(--red)] font-semibold'  :
                done    ? 'text-[var(--sage)] font-semibold'  :
                current ? 'text-[var(--ink)] font-semibold'   :
                          'text-[var(--ink-light)]',
              )}>
                {formatStep(step)}
              </span>
            </div>
            {/* Connector — skip after last */}
            {i < lastIdx && (
              <div className="flex-1 h-[2px] mx-0.5 bg-[var(--sage)] transition-colors duration-300" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProgressBar({ processed, total }: { processed: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="text-[0.65rem] text-[var(--ink-light)]">{formatRows(processed, total)}</span>
        <span className="text-[0.65rem] font-semibold text-[var(--ink)] tabular-nums">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--ghost)] border border-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--sage)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main dialog ───────────────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  onClose: () => void;
}

type Stage = 'idle' | 'uploading' | 'polling' | 'done';

export function BulkUploadDialog({ open, onClose }: Props) {
  const navigate = useNavigate();

  const [stage,       setStage]       = useState<Stage>('idle');
  const [file,        setFile]        = useState<File | null>(null);
  const [dragOver,    setDragOver]    = useState(false);
  const [uploadErr,   setUploadErr]   = useState<string | null>(null);
  const [job,         setJob]         = useState<JobResponse | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [canDismiss,  setCanDismiss]  = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimer    = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reset when opened ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setStage('idle');
      setFile(null);
      setUploadErr(null);
      setJob(null);
      setCanDismiss(false);
    }
    return () => stopPoll();
  }, [open]);

  // ── Polling ────────────────────────────────────────────────────────────────
  function stopPoll() {
    if (pollTimer.current) {
      clearInterval(pollTimer.current);
      pollTimer.current = null;
    }
  }

  function startPoll(id: number) {
    stopPoll();
    pollTimer.current = setInterval(async () => {
      try {
        const res = await jobService.getById(id);
        const j   = res.data.data;
        setJob(j);
        if (TERMINAL.has(j.status)) {
          stopPoll();
          setStage('done');
          // Allow voluntary dismiss after 3 s
          setTimeout(() => setCanDismiss(true), 3000);
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }

  // ── File handling ──────────────────────────────────────────────────────────
  function handleFileSelect(f: File | undefined) {
    if (!f) return;
    if (!f.name.endsWith('.xlsx')) {
      setUploadErr('Only .xlsx files are supported.');
      return;
    }
    setFile(f);
    setUploadErr(null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  // ── Download template ──────────────────────────────────────────────────────
  async function handleDownload() {
    setDownloading(true);
    try {
      const res  = await bulkService.downloadTemplate('BULK_CENTER_GRID_ADD');
      const url  = URL.createObjectURL(new Blob([res.data as BlobPart]));
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'centre_grid_template.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setUploadErr('Failed to download template. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!file) return;
    setStage('uploading');
    setUploadErr(null);
    try {
      const res = await bulkService.upload('BULK_CENTER_GRID_ADD', file);
      const j   = res.data.data;
      setJob(j);
      setStage('polling');
      startPoll(j.id);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Upload failed. Please try again.';
      setUploadErr(msg);
      setStage('idle');
    }
  }

  // ── Close guard ────────────────────────────────────────────────────────────
  function handleClose() {
    if (stage === 'uploading') return; // hard block while uploading
    stopPoll();
    onClose();
  }

  if (!open) return null;

  const isTerminal        = job ? TERMINAL.has(job.status) : false;
  const isBlocking        = stage === 'uploading' || (stage === 'polling' && !isTerminal);
  const completedWithData = job?.status === 'COMPLETED' && (job?.processedRows ?? 0) > 0;
  const completedNoRows   = job?.status === 'COMPLETED' && (job?.processedRows ?? 0) === 0;
  const jobFailed         = job?.status === 'FAILED';
  const jobRunning        = job ? !TERMINAL.has(job.status) : false;

  // ── Render ─────────────────────────────────────────────────────────────────
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bulk Upload Centre Grid"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(15,17,23,0.42)', backdropFilter: 'blur(4px)' }}
        onClick={isBlocking ? undefined : handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className={cn(
        'relative w-full max-w-lg bg-[var(--surface)] outline-none z-10',
        'rounded-t-[20px] sm:rounded-[20px]',
        'shadow-[var(--shadow-lg)]',
        'animate-[slideUp_0.28s_cubic-bezier(0.34,1.4,0.64,1)] sm:animate-[modalIn_0.22s_cubic-bezier(0.34,1.4,0.64,1)]',
      )}>
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-9 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}>
              Bulk Upload — Centre Grid
            </h2>
            <p className="text-xs text-[var(--ink-light)] mt-0.5">
              Upload an Excel file to create or update multiple centres at once.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={stage === 'uploading'}
            className={cn(
              'ml-4 shrink-0 p-1.5 rounded-[8px] text-[var(--ink-light)]',
              'hover:bg-[var(--ghost)] hover:text-[var(--ink)]',
              'transition-colors duration-150 outline-none',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'focus-visible:ring-2 focus-visible:ring-[var(--sage)]',
            )}
            aria-label="Close"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto max-h-[60vh]">

          {/* ── IDLE / FILE PICK ── */}
          {(stage === 'idle' || stage === 'uploading') && (
            <>
              {/* Download template */}
              <div className="flex items-center justify-between p-3 rounded-[12px]
                              border border-[var(--border)] bg-[var(--ghost)]">
                <div>
                  <p className="text-sm font-medium text-[var(--ink)]">Download Template</p>
                  <p className="text-xs text-[var(--ink-light)] mt-0.5">
                    Fill the sample file and upload it below.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  onClick={handleDownload}
                  disabled={downloading || stage === 'uploading'}
                >
                  {downloading ? 'Downloading…' : 'Sample'}
                </Button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => stage !== 'uploading' && fileInputRef.current?.click()}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-2',
                  'rounded-[14px] border-2 border-dashed px-4 py-8 cursor-pointer',
                  'transition-colors duration-150',
                  dragOver
                    ? 'border-[var(--sage)] bg-[var(--sage-light)]'
                    : file
                      ? 'border-[var(--sage)] bg-[var(--sage-light)]/40'
                      : 'border-[var(--border)] hover:border-[var(--ink-light)] bg-[var(--ghost)]',
                  stage === 'uploading' && 'opacity-50 cursor-not-allowed pointer-events-none',
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {file ? (
                  <>
                    <FileSpreadsheet size={28} className="text-[var(--sage)]" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-[var(--ink)] break-all">{file.name}</p>
                      <p className="text-xs text-[var(--ink-light)] mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={24} className="text-[var(--ink-light)]" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--ink)]">
                        Drop your .xlsx file here
                      </p>
                      <p className="text-xs text-[var(--ink-light)] mt-0.5">
                        or click to browse
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* File error */}
              {uploadErr && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px]
                                bg-[var(--red-light)] border border-[var(--red)]/20">
                  <AlertTriangle size={13} className="text-[var(--red)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--red)]">{uploadErr}</p>
                </div>
              )}
            </>
          )}

          {/* ── POLLING / DONE ── */}
          {(stage === 'polling' || stage === 'done') && job && (
            <div className="flex flex-col gap-4">

              {/* Phase pipeline */}
              <PipelineBar phase={job.phase ?? ''} status={job.status} />

              {/* Progress bar — only when totalRows is known and > 0 */}
              {job.totalRows > 0 && (
                <ProgressBar processed={job.processedRows} total={job.totalRows} />
              )}

              {/* Empty file error — totalRows is 0 after completion */}
              {job.status === 'COMPLETED' && job.totalRows === 0 && (
                <div className="flex items-start gap-2.5 px-3 py-3 rounded-[10px] border
                                bg-[#FFFBEB] border-[#FDE68A]/60 text-xs text-[#92400E]">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-[#D97706]" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">File appears to be empty</span>
                    <span className="opacity-80">
                      No rows were detected. Make sure your file contains data rows below the header.
                    </span>
                  </div>
                </div>
              )}

              {/* Status card */}
              <div className={cn(
                'flex items-start gap-2.5 px-3 py-3 rounded-[10px] border text-xs',
                completedWithData ? 'bg-[var(--sage-light)] border-[var(--sage)]/20 text-[var(--sage)]' :
                completedNoRows   ? 'bg-[#FFFBEB] border-[#FDE68A]/60 text-[#92400E]'                  :
                jobFailed         ? 'bg-[var(--red-light)]  border-[var(--red)]/20  text-[var(--red)]'  :
                                    'bg-[var(--ghost)]       border-[var(--border)]  text-[var(--ink)]',
              )}>
                {completedWithData ? <CheckCircle2   size={14} className="shrink-0 mt-0.5" />                           :
                 completedNoRows   ? <AlertTriangle  size={14} className="shrink-0 mt-0.5 text-[#D97706]" />            :
                 jobFailed         ? <XCircle        size={14} className="shrink-0 mt-0.5" />                           :
                                     <Loader2        size={14} className="animate-spin shrink-0 mt-0.5" />}

                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  {/* Primary message from API */}
                  <span className="font-semibold leading-snug">
                    {job.message || (
                      jobRunning ? 'Processing…'    :
                      jobFailed  ? 'Upload failed.' :
                                   'Upload completed.'
                    )}
                  </span>

                  {/* Row counters */}
                  {(job.totalRows > 0 || job.processedRows > 0) && (
                    <div className="flex items-center gap-3 flex-wrap opacity-80">
                      <span className="flex items-center gap-1">
                        <span className="font-mono font-bold tabular-nums">
                          {job.processedRows.toLocaleString()}
                        </span>
                        <span>processed</span>
                      </span>
                      {job.totalRows > 0 && (
                        <span className="flex items-center gap-1">
                          <span>of</span>
                          <span className="font-mono font-bold tabular-nums">
                            {job.totalRows.toLocaleString()}
                          </span>
                          <span>total rows</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Warning when completed but 0 rows processed */}
                  {completedNoRows && job.totalRows > 0 && (
                    <span className="opacity-80 leading-snug">
                      The job completed but no records were written. Check your data and try again.
                    </span>
                  )}

                  {/* Expandable error table on failure */}
                  {jobFailed && job.errorDetails && job.errorDetails.length > 0 && (
                    <ErrorDetails errors={job.errorDetails} />
                  )}
                </div>
              </div>

              {/* Voluntary dismiss hint — after polling starts but before terminal */}
              {stage === 'polling' && !isTerminal && (
                <p className="text-[0.65rem] text-[var(--ink-light)] text-center">
                  You can close this dialog and check progress in the{' '}
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate('/jobs'); }}
                    className="font-semibold text-[var(--ink)] underline underline-offset-2
                               hover:text-[var(--sage)] transition-colors"
                  >
                    Jobs
                  </button>
                  {' '}section.
                </p>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
          {/* Left: dismiss hint after terminal */}
          <div className="text-[0.65rem] text-[var(--ink-light)]">
            {stage === 'done' && job?.status === 'COMPLETED' && '✓ Centre data updated.'}
            {stage === 'done' && job?.status === 'FAILED' && (
              <span>
                Check the{' '}
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/jobs'); }}
                  className="font-semibold text-[var(--ink)] underline underline-offset-2
                             hover:text-[var(--sage)] transition-colors"
                >
                  Jobs
                </button>
                {' '}section for details.
              </span>
            )}
            {stage === 'polling' && !isTerminal && (
              <span>
                Processing in background — view in{' '}
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/jobs'); }}
                  className="font-semibold text-[var(--ink)] underline underline-offset-2
                             hover:text-[var(--sage)] transition-colors"
                >
                  Jobs
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Close / Cancel — blocked only during upload */}
            {stage !== 'uploading' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                {isTerminal ? 'Close' : 'Close & check later'}
              </Button>
            )}

            {/* Submit */}
            {(stage === 'idle') && (
              <Button
                size="sm"
                disabled={!file}
                onClick={handleSubmit}
                leftIcon={<Upload size={13} />}
              >
                Upload
              </Button>
            )}

            {stage === 'uploading' && (
              <Button size="sm" disabled leftIcon={<Loader2 size={13} className="animate-spin" />}>
                Uploading…
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
