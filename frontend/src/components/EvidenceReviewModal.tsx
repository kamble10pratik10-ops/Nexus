import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import type { Finding } from './types';

type ReviewStatus = 'confirm' | 'dismiss' | 'need-more-info';
interface Review { finding_id: string; status: string; comment: string; timestamp: string }
interface Records { alerts: object[]; cases: object[]; assets: object[]; events: object[] }

const emptyRecords: Records = { alerts: [], cases: [], assets: [], events: [] };
const valueText = (value: unknown) => typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value ?? 'Not available');

function RecordTable({ title, rows }: { title: string; rows: object[] }) {
  if (!rows.length) return null;
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return (
    <section className="mt-4">
      <h4 className="font-semibold capitalize text-slate-200">{title} ({rows.length})</h4>
      <div className="mt-2 overflow-x-auto rounded border border-slate-700">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900"><tr>{columns.map((column) => <th key={column} className="p-2 font-semibold text-slate-400">{column}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index} className="border-t border-slate-800">{columns.map((column) => <td key={column} className="max-w-[24rem] break-words p-2 align-top text-slate-300">{valueText((row as Record<string, unknown>)[column])}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export default function EvidenceReviewModal({ finding, apiUrl, onClose }: { finding: Finding; apiUrl: string; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const [records, setRecords] = useState<Records>(emptyRecords);
  const [limitations, setLimitations] = useState<string[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [evidenceLoading, setEvidenceLoading] = useState(true);
  const [evidenceError, setEvidenceError] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('confirm');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const evidence = finding.evidence;
  const thresholds = Object.entries(evidence).filter(([key]) => key.toLowerCase().includes('threshold'));
  const recordCount = Object.values(records).reduce((sum, rows) => sum + rows.length, 0);

  const loadReviews = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await axios.get(`${apiUrl}/findings/reviews`, { params: { finding_id: finding.finding_id }, signal });
      setReviews(response.data.reviews || []);
    } catch (error) {
      if (!axios.isCancel(error)) setReviewsError('Review history could not be loaded.');
    } finally {
      if (!signal?.aborted) setReviewsLoading(false);
    }
  }, [apiUrl, finding.finding_id]);

  useEffect(() => {
    const controller = new AbortController();
    axios.post(`${apiUrl}/evidence/records`, { entity_id: finding.entity_id, evidence }, { signal: controller.signal })
      .then((response) => {
        setRecords({ ...emptyRecords, ...(response.data.records || {}) });
        setLimitations(response.data.limitations || []);
        setTruncated(Boolean(response.data.truncated));
      })
      .catch((error) => { if (!axios.isCancel(error)) setEvidenceError('Source records could not be loaded.'); })
      .finally(() => { if (!controller.signal.aborted) setEvidenceLoading(false); });
    void loadReviews(controller.signal);
    return () => controller.abort();
  }, [apiUrl, evidence, finding.entity_id, loadReviews]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const returnFocus = returnFocusRef.current;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), textarea:not([disabled]), input:not([disabled])'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
      returnFocus?.focus();
    };
  }, [onClose]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || saving) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      await axios.post(`${apiUrl}/findings/review`, { finding_id: finding.finding_id, status, comment: comment.trim() });
      setComment('');
      setReviewsLoading(true);
      setReviewsError('');
      await loadReviews();
      setSaveSuccess('Review decision saved and history refreshed.');
    } catch {
      setSaveError('The review could not be saved. Your decision and reason have been retained.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="evidence-review-title" className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-700 bg-[#101622] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-700 bg-[#101622] p-5">
          <div><h2 id="evidence-review-title" className="text-xl font-bold">Evidence review</h2><p className="mt-1 font-mono text-sm text-blue-300">{finding.finding_id}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close evidence review" className="rounded px-3 py-1 text-2xl text-slate-300 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-400">×</button>
        </header>
        <div className="space-y-6 p-5">
          <section aria-labelledby="finding-details-heading">
            <h3 id="finding-details-heading" className="text-lg font-semibold">Finding details</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[['ID', finding.finding_id], ['Entity', finding.entity_id], ['Type', finding.type], ['Outcome', finding.outcome], ['Severity', finding.severity]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-slate-200">{valueText(value)}</dd></div>)}
              <div className="sm:col-span-2 lg:col-span-3"><dt className="text-xs font-semibold uppercase text-slate-500">Description</dt><dd className="mt-1 text-slate-200">{finding.description || 'Not available'}</dd></div>
            </dl>
            <h4 className="mt-4 text-sm font-semibold text-slate-300">Finding evidence</h4>
            {Object.keys(evidence).length ? <dl className="mt-2 grid grid-cols-1 gap-2 rounded border border-slate-700 bg-black/20 p-3 text-xs sm:grid-cols-2">{Object.entries(evidence).map(([key, value]) => <div key={key}><dt className="font-semibold text-slate-500">{key}</dt><dd className="break-words text-slate-300">{valueText(value)}</dd></div>)}</dl> : <p className="mt-2 text-sm text-yellow-300">No structured evidence was supplied with this finding.</p>}
            <div className="mt-3 rounded border border-slate-700 p-3 text-sm"><span className="font-semibold text-slate-300">Rule threshold: </span>{thresholds.length ? thresholds.map(([key, value]) => `${key}: ${valueText(value)}`).join('; ') : <span className="text-yellow-300">Unavailable — no threshold is present in this finding’s evidence.</span>}</div>
          </section>

          <section aria-labelledby="source-records-heading">
            <h3 id="source-records-heading" className="text-lg font-semibold">Raw source records</h3>
            {evidenceLoading ? <p className="mt-3 text-slate-400" role="status">Loading exact source records…</p> : evidenceError ? <p className="mt-3 text-red-300" role="alert">{evidenceError}</p> : <>
              {recordCount === 0 && <p className="mt-3 rounded border border-yellow-700/50 bg-yellow-500/10 p-3 text-sm text-yellow-200">No exact source record references could be resolved from this finding’s evidence. Review the finding-level evidence above and the stated limitations.</p>}
              {truncated && <p className="mt-3 text-sm text-yellow-300">The source record response was truncated.</p>}
              {limitations.length > 0 && <div className="mt-3 rounded border border-yellow-700/50 p-3"><h4 className="text-sm font-semibold text-yellow-200">Limitations</h4><ul className="mt-1 list-disc pl-5 text-sm text-yellow-100">{limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
              {(Object.keys(records) as (keyof Records)[]).map((key) => <RecordTable key={key} title={key} rows={records[key]} />)}
            </>}
          </section>

          <section aria-labelledby="review-heading" className="rounded-lg border border-blue-900/60 bg-blue-950/20 p-4">
            <h3 id="review-heading" className="text-lg font-semibold">Reviewer decision</h3>
            <p className="mt-1 text-sm text-slate-400">Reviewer decisions are an audit annotation and do not change the automated assessment.</p>
            <form className="mt-4" onSubmit={submitReview}>
              <fieldset disabled={saving}><legend className="text-sm font-semibold">Decision</legend><div className="mt-2 flex flex-wrap gap-4">{([['confirm', 'Confirm'], ['dismiss', 'Dismiss'], ['need-more-info', 'Need more information']] as const).map(([value, label]) => <label key={value} className="flex items-center gap-2 text-sm"><input type="radio" name="review-status" value={value} checked={status === value} onChange={() => setStatus(value)} />{label}</label>)}</div></fieldset>
              <label className="mt-4 block text-sm font-semibold" htmlFor="review-reason">Required reason</label>
              <textarea id="review-reason" required value={comment} disabled={saving} onChange={(event) => setComment(event.target.value)} rows={3} className="mt-2 w-full rounded border border-slate-600 bg-slate-950 p-3 text-sm text-white focus:border-blue-400 focus:outline-none" placeholder="Explain the evidence-based reason for this decision" />
              {saveError && <p className="mt-2 text-sm text-red-300" role="alert">{saveError}</p>}
              {saveSuccess && <p className="mt-2 text-sm text-emerald-300" role="status">{saveSuccess}</p>}
              <button type="submit" disabled={saving || !comment.trim()} className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400">{saving ? 'Saving…' : 'Save review'}</button>
            </form>
            <div className="mt-6"><h4 className="font-semibold">Review history</h4>{reviewsLoading ? <p className="mt-2 text-sm text-slate-400">Loading review history…</p> : reviewsError ? <p className="mt-2 text-sm text-red-300">{reviewsError}</p> : reviews.length === 0 ? <p className="mt-2 text-sm text-slate-400">No prior reviews.</p> : <ul className="mt-2 space-y-2">{reviews.map((review, index) => <li key={`${review.timestamp}-${index}`} className="rounded border border-slate-700 p-3 text-sm"><div className="flex flex-wrap justify-between gap-2"><strong className="text-blue-200">{review.status}</strong><time className="text-xs text-slate-500">{review.timestamp}</time></div><p className="mt-1 text-slate-300">{review.comment}</p></li>)}</ul>}</div>
          </section>
        </div>
      </div>
    </div>
  );
}
