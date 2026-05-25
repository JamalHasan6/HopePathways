import { Session, ResultType } from '../types';
import styles from './SessionsTable.module.css';

interface SessionsTableProps {
  sessions: Session[];
  onRowClick?: (session: Session) => void;
  onChatClick?: (session: Session) => void;
}

const crisisLabel: Record<ResultType, string> = {
  crisis: 'Crisis',
  hub: 'Hub Referral',
  peer: 'Peer Support',
  info: 'Info Only',
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function SessionsTable({ sessions, onRowClick, onChatClick }: SessionsTableProps) {
  if (sessions.length === 0) {
    return (
      <div className={styles.empty}>
        <span>No sessions found.</span>
      </div>
    );
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Session #</th>
            <th>Status</th>
            <th>Outcome</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Wants Call</th>
            <th>Notes</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr
              key={session.id}
              onClick={() => onRowClick?.(session)}
              className={onRowClick ? styles.clickable : undefined}
            >
              <td>
                <span className={styles.sessionNumber}>{shortId(session.id)}</span>
              </td>
              <td>
                <span className={`${styles.badge} ${styles[session.status]}`}>
                  {session.status === 'in_progress' && <span className={styles.dot} />}
                  {session.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </span>
              </td>
              <td>
                {session.crisis_level && session.status === 'completed' ? (
                  <span className={`${styles.badge} ${styles[session.crisis_level]}`}>
                    {session.crisis_level === 'crisis' && <span className={styles.dot} />}
                    {crisisLabel[session.crisis_level]}
                  </span>
                ) : (
                  <span className={styles.muted}>{session.status === 'in_progress' ? 'Pending' : '—'}</span>
                )}
              </td>
              <td className={styles.description}>{session.name ?? '—'}</td>
              <td className={styles.description}>{session.email ?? '—'}</td>
              <td className={styles.description}>{session.phone ?? '—'}</td>
              <td className={styles.description}>{session.address ?? '—'}</td>
              <td className={styles.description}>{session.wants_call ?? '—'}</td>
              <td className={styles.description}>{session.notes ?? '—'}</td>
              <td className={styles.time}>{formatTime(session.created_at)}</td>
              <td>
                <button
                  className={styles.chatBtn}
                  title="Open human intervention chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatClick?.(session);
                  }}
                >
                  💬
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
