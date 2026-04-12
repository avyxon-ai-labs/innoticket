import { useState, useRef, useEffect } from 'react';
import { CircleDot, Loader2,
         AlertTriangle, ChevronDown }  from 'lucide-react';
import { useDashboardSummary }          from '../hooks';
import { useTicketStore }               from '../store';
import type { DashboardSummary }        from '../../../services/dashboard.service';

// ── Popover ───────────────────────────────────────────────────────────────────

function Popover({
  open, onClose, children, anchorRef,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLElement | null>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute top-[calc(100%+6px)] right-0 z-50 min-w-[170px]
                 bg-[var(--surface)] border border-[var(--border)] rounded-[12px]
                 shadow-lg shadow-black/10 p-3
                 animate-[fadeSlideDown_0.15s_ease-out]"
    >
      {children}
    </div>
  );
}

// ── Single chip ───────────────────────────────────────────────────────────────

interface ChipProps {
  icon:       React.ReactNode;
  label:      string;
  value:      number | undefined;
  isLoading:  boolean;
  colorClass: string;       // text + border colour
  bgClass:    string;       // background
  onClick?:   () => void;
  hasPopover?: boolean;
  open?:      boolean;
  children?:  React.ReactNode;
  btnRef?:    React.RefObject<HTMLButtonElement | null>;
}

function SummaryChip({
  icon, label, value, isLoading, colorClass, bgClass,
  onClick, hasPopover, open, children, btnRef,
}: ChipProps) {
  return (
    <div className="relative">
      <button
        ref={btnRef as React.RefObject<HTMLButtonElement>}
        onClick={onClick}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border
                    text-xs font-semibold transition-all select-none
                    ${bgClass} ${colorClass}
                    ${onClick ? 'hover:brightness-95 cursor-pointer' : 'cursor-default'}`}
      >
        <span className="shrink-0">{icon}</span>
        {isLoading ? (
          <span className="w-5 h-3 rounded bg-current opacity-20 animate-pulse inline-block" />
        ) : (
          <span className="tabular-nums">{value ?? 0}</span>
        )}
        <span className="opacity-75 font-normal">{label}</span>
        {hasPopover && <ChevronDown size={10} className={`ml-0.5 transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>

      {hasPopover && children}
    </div>
  );
}

// ── Row item in popover ───────────────────────────────────────────────────────

function PopoverRow({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <span className="text-xs text-[var(--ink-light)]">{label}</span>
      <span className={`text-xs font-bold tabular-nums px-1.5 py-0.5 rounded-[5px] ${accent}`}>
        {value}
      </span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function TicketSummaryBar() {
  const { filters } = useTicketStore();
  const [openPopover, setOpenPopover] = useState<'open' | 'progress' | 'escalated' | null>(null);
  const escalatedBtnRef = useRef<HTMLButtonElement | null>(null);
  const openBtnRef      = useRef<HTMLButtonElement | null>(null);
  const progressBtnRef  = useRef<HTMLButtonElement | null>(null);

  const projectCode = typeof filters.projectCode === 'string' ? filters.projectCode : '';
  const centerCodes = Array.isArray(filters.centerCodes) ? filters.centerCodes : [];
  const services    = Array.isArray(filters.services)    ? filters.services    : [];

  const { data, isLoading } = useDashboardSummary({
    projectCode,
    ...(centerCodes.length && { centreCodes: centerCodes.join(',') }),
    ...(services.length    && { services:    services.join(',')    }),
  });

  if (!projectCode) return null;

  const s = data as DashboardSummary | undefined;
  const escalated = (s?.escalatedL1 ?? 0) + (s?.escalatedL2 ?? 0);
  const toggle = (id: typeof openPopover) =>
    setOpenPopover((prev) => (prev === id ? null : id));

  return (
    <div className="flex items-center gap-1.5 flex-wrap">

      {/* Open */}
      <SummaryChip
        btnRef={openBtnRef}
        icon={<CircleDot size={12} />}
        label="Open"
        value={s?.open}
        isLoading={isLoading}
        colorClass="text-[#1D4ED8] border-[#BFDBFE]"
        bgClass="bg-[#EFF6FF]"
        onClick={() => toggle('open')}
        hasPopover
        open={openPopover === 'open'}
      >
        <Popover
          open={openPopover === 'open'}
          onClose={() => setOpenPopover(null)}
          anchorRef={openBtnRef}
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)] mb-2">
            Open tickets
          </p>
          <PopoverRow label="Total open" value={s?.open ?? 0} accent="bg-[#EFF6FF] text-[#1D4ED8]" />
          <div className="border-t border-[var(--border)] mt-2 pt-2">
            <PopoverRow label="Resolved" value={s?.resolved ?? 0} accent="bg-[#F0FDF4] text-[#166534]" />
            <PopoverRow label="Closed"   value={s?.closed   ?? 0} accent="bg-[#F0FDF4] text-[#166534]" />
          </div>
        </Popover>
      </SummaryChip>

      {/* In Progress */}
      <SummaryChip
        btnRef={progressBtnRef}
        icon={<Loader2 size={12} />}
        label="In Progress"
        value={s?.inProgress}
        isLoading={isLoading}
        colorClass="text-[#C2410C] border-[#FED7AA]"
        bgClass="bg-[#FFF7ED]"
        onClick={() => toggle('progress')}
        hasPopover
        open={openPopover === 'progress'}
      >
        <Popover
          open={openPopover === 'progress'}
          onClose={() => setOpenPopover(null)}
          anchorRef={progressBtnRef}
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)] mb-2">
            Active workload
          </p>
          <PopoverRow label="In progress" value={s?.inProgress ?? 0} accent="bg-[#FFF7ED] text-[#C2410C]" />
          <PopoverRow label="Withdrawn"   value={s?.withdrawn  ?? 0} accent="bg-[var(--ghost)] text-[var(--ink-mid)]" />
          <PopoverRow label="Rejected"    value={s?.rejected   ?? 0} accent="bg-[#FEF2F2] text-[#B91C1C]" />
        </Popover>
      </SummaryChip>

      {/* Escalated */}
      <SummaryChip
        btnRef={escalatedBtnRef}
        icon={<AlertTriangle size={12} className={escalated > 0 ? 'animate-pulse' : ''} />}
        label="Escalated"
        value={escalated}
        isLoading={isLoading}
        colorClass={
          escalated > 0
            ? 'text-[#B91C1C] border-[#FECACA]'
            : 'text-[var(--ink-light)] border-[var(--border)]'
        }
        bgClass={escalated > 0 ? 'bg-[#FEF2F2]' : 'bg-[var(--ghost)]'}
        onClick={() => toggle('escalated')}
        hasPopover
        open={openPopover === 'escalated'}
      >
        <Popover
          open={openPopover === 'escalated'}
          onClose={() => setOpenPopover(null)}
          anchorRef={escalatedBtnRef}
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[var(--ink-light)] mb-2">
            SLA breach breakdown
          </p>
          <PopoverRow
            label="L1 – First breach"
            value={s?.escalatedL1 ?? 0}
            accent="bg-[#FFFBEB] text-[#92400E]"
          />
          <PopoverRow
            label="L2 – Critical"
            value={s?.escalatedL2 ?? 0}
            accent="bg-[#FEF2F2] text-[#B91C1C]"
          />
          <div className="border-t border-[var(--border)] mt-2 pt-2">
            <PopoverRow label="Combined" value={escalated} accent="bg-[#FEF2F2] text-[#B91C1C]" />
          </div>
        </Popover>
      </SummaryChip>

    </div>
  );
}
