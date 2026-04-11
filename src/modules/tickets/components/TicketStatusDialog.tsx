import { useState, useEffect }         from 'react';
import { Modal }                       from '../../../components/ui/Modal';
import { Button }                      from '../../../components/ui/Button';
import { Select }                      from '../../../components/ui/Select';
import { AttachmentUploader }          from './AttachmentUploader';
import { TicketStatusBadge }           from './TicketStatusBadge';
import { useUpdateTicketStatus,
         useTicketById }               from '../hooks';
import { useTicketStore }              from '../store';
import {
  STATUS_TRANSITIONS,
}                                      from '../../../services/ticket.service';
import type {
  TicketStatus,
  Attachment,
}                                      from '../../../services/ticket.service';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
  CLOSED:      'Closed',
  WITHDRAWN:   'Withdrawn',
  REJECTED:    'Rejected',
};

// ── Component ─────────────────────────────────────────────────────────────────

export function TicketStatusDialog() {
  const { statusDialogId, closeStatusDialog } = useTicketStore();
  const open = !!statusDialogId;

  const { data: ticket }   = useTicketById(statusDialogId);
  const updateMut          = useUpdateTicketStatus();

  const allowedNext = (ticket && STATUS_TRANSITIONS[ticket.status]) ?? [];

  const [newStatus,   setNewStatus]   = useState<TicketStatus | ''>('');
  const [remarks,     setRemarks]     = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error,       setError]       = useState('');

  // Reset when ticket changes
  useEffect(() => {
    if (statusDialogId) {
      setNewStatus('');
      setRemarks('');
      setAttachments([]);
      setError('');
    }
  }, [statusDialogId]);

  async function handleSubmit() {
    if (!newStatus) { setError('Please select a status.'); return; }
    if (newStatus === 'RESOLVED' && !remarks.trim()) {
      setError('Remarks are required when resolving a ticket.');
      return;
    }
    setError('');
    try {
      await updateMut.mutateAsync({
        id:      statusDialogId!,
        payload: { status: newStatus, remarks: remarks.trim(), attachments },
      });
      closeStatusDialog();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message
        ?? 'Something went wrong. Please try again.';
      setError(msg);
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeStatusDialog}
      title="Update Ticket Status"
      description={ticket ? `Ticket #${ticket.id}` : undefined}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={closeStatusDialog}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={updateMut.isPending}
            onClick={handleSubmit}
            disabled={!newStatus}
          >
            Update Status
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Current status */}
        {ticket && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--ink-light)]">Current:</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
        )}

        {/* New status */}
        <Select
          label="New Status"
          placeholder="Select status…"
          value={newStatus}
          onChange={(v) => {
            setNewStatus(v as TicketStatus);
            setError('');
          }}
          options={allowedNext.map((s) => ({
            value: s,
            label: STATUS_LABELS[s],
          }))}
          error={error && !newStatus ? error : undefined}
        />

        {/* Remarks */}
        <div className="flex flex-col gap-1">
          <label className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
            Remarks {newStatus === 'RESOLVED' && <span className="text-[var(--red)]">*</span>}
          </label>
          <textarea
            rows={3}
            placeholder={
              newStatus === 'RESOLVED'
                ? 'Describe how the issue was resolved…'
                : 'Add remarks or justification…'
            }
            value={remarks}
            onChange={(e) => { setRemarks(e.target.value); setError(''); }}
            className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--ghost)]
                       px-3 py-2 text-sm text-[var(--ink)] resize-none outline-none
                       placeholder:text-[var(--ink-light)]
                       focus:border-[var(--sage)] focus:bg-[var(--surface)]
                       transition-colors duration-150"
          />
        </div>

        {/* Attachments */}
        <div className="flex flex-col gap-1">
          <label className="text-[0.68rem] font-semibold text-[var(--ink-mid)] tracking-wide uppercase">
            Attachments (optional)
          </label>
          <AttachmentUploader
            value={attachments}
            onChange={setAttachments}
            maxFiles={5}
          />
        </div>

        {/* Error banner */}
        {error && !(!newStatus && error === 'Please select a status.') && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-[10px]
                          bg-[#FEF2F2] border border-[#FECACA]" role="alert">
            <span className="text-[#DC2626] shrink-0 text-sm leading-none mt-0.5">✕</span>
            <p className="text-xs text-[#DC2626] leading-relaxed">{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
