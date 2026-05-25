import { useEffect, useState } from 'react';
import { Session, ResultType } from '../types';
import API from '../config/api';
import styles from './SessionDetailPanel.module.css';

interface Props {
  session: Session | null;
  onClose: () => void;
}

const crisisLabel: Record<ResultType, string> = {
  crisis: 'Crisis',
  hub: 'Hub Referral',
  peer: 'Peer Support',
  info: 'Info Only',
};

const crisisColor: Record<ResultType, string> = {
  crisis: '#e53e3e',
  hub: '#4a6fa5',
  peer: '#805ad5',
  info: '#d69e2e',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

const FLAG_LABELS: Record<string, string> = {
  first_time_seeker: '🆕 First-time seeker',
  social_isolation: '🔇 Social isolation',
  previous_ed_presentation: '🏥 Previous ED presentation',
  cald_background: '🌐 CALD background',
};

function flagLabel(flag: string): string {
  return FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ');
}

export default function SessionDetailPanel({ session, onClose }: Props) {
  const [detail, setDetail] = useState<Session | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch full session detail when a session is selected
  useEffect(() => {
    if (!session) { setDetail(null); return; }
    setDetail(null);
    setLoadingDetail(true);
    fetch(`${API.endpoints.admin}/sessions/${session.id}`)
      .then((r) => r.json())
      .then((data: Session) => setDetail(data))
      .catch(() => setDetail(session))
      .finally(() => setLoadingDetail(false));
  }, [session?.id]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const displayed = detail ?? session;

  // Parse flags from JSON string stored in DB
  const flags: string[] = (() => {
    const raw = displayed?.flags;
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  })();

  return (
    <>
      <div
        className={`${styles.backdrop} ${session ? styles.backdropVisible : ''}`}
        onClick={onClose}
      />
      <aside className={`${styles.panel} ${session ? styles.panelOpen : ''}`}>
        {session && (
          <>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelLabel}>Session</p>
                <h2 className={styles.panelId}># {shortId(session.id)}</h2>
              </div>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className={styles.panelBody}>
              {/* Status & Outcome */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Status</span>
                  <span className={`${styles.badge} ${styles[session.status]}`}>
                    {session.status === 'in_progress' && <span className={styles.dot} />}
                    {session.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Outcome</span>
                  {session.crisis_level && session.status === 'completed' ? (
                    <span
                      className={styles.outcomeBadge}
                      style={{ color: crisisColor[session.crisis_level], background: `${crisisColor[session.crisis_level]}18` }}
                    >
                      {session.crisis_level === 'crisis' && <span className={styles.dot} style={{ background: crisisColor.crisis }} />}
                      {crisisLabel[session.crisis_level]}
                    </span>
                  ) : (
                    <span className={styles.muted}>{session.status === 'in_progress' ? 'Pending' : '—'}</span>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className={styles.row}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Started</span>
                  <span className={styles.fieldValue}>{formatDateTime(session.created_at)}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Completed</span>
                  <span className={styles.fieldValue}>
                    {session.completed_at ? formatDateTime(session.completed_at) : '—'}
                  </span>
                </div>
              </div>

              <hr className={styles.divider} />

              {/* Triage Summary */}
              <h3 className={styles.sectionTitle}>Triage Summary</h3>
              <div className={styles.notesBox}>
                {loadingDetail
                  ? <span className={styles.muted}>Loading…</span>
                  : displayed?.notes
                    ? displayed.notes
                    : <span className={styles.muted}>No summary available yet.</span>
                }
              </div>

              <hr className={styles.divider} />

              {/* Support Flags */}
              <h3 className={styles.sectionTitle}>Support Flags</h3>
              {flags.length > 0 ? (
                <div className={styles.flagsList}>
                  {flags.map((flag) => (
                    <span key={flag} className={styles.flagBadge}>
                      {flagLabel(flag)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className={styles.muted} style={{ fontSize: '13px' }}>
                  {loadingDetail ? 'Loading…' : 'No support flags identified.'}
                </p>
              )}

              <hr className={styles.divider} />

              {/* Contact info */}
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.infoGrid}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Name</span>
                  <span className={styles.fieldValue}>{displayed?.name ?? '—'}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Email</span>
                  <span className={styles.fieldValue}>{displayed?.email ?? '—'}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Phone</span>
                  <span className={styles.fieldValue}>{displayed?.phone ?? '—'}</span>
                </div>
                <div className={`${styles.field} ${styles.fullWidth}`}>
                  <span className={styles.fieldLabel}>Address</span>
                  <span className={styles.fieldValue}>{displayed?.address ?? '—'}</span>
                </div>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>Wants Call</span>
                  <span className={styles.fieldValue}>{displayed?.wants_call ?? '—'}</span>
                </div>
              </div>

              {/* Full ID */}
              <div className={styles.fullIdRow}>
                <span className={styles.fieldLabel}>Full Session ID</span>
                <code className={styles.fullId}>{session.id}</code>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
