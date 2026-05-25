import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Session } from '../types';
import SessionsTable from '../components/SessionsTable';
import SessionDetailPanel from '../components/SessionDetailPanel';
import HumanChatPanel from '../components/HumanChatPanel';
import styles from './Sessions.module.css';
import API from '../config/api';

const API_URL = `${API.endpoints.admin}/sessions`;

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'crisis', label: 'Crisis' },
];

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatSession, setChatSession] = useState<Session | null>(null);

  const handleRowClick = useCallback((session: Session) => setSelectedSession(session), []);
  const handleClosePanel = useCallback(() => setSelectedSession(null), []);
  const handleChatClick = useCallback((session: Session) => setChatSession(session), []);
  const handleCloseChat = useCallback(() => setChatSession(null), []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Failed to fetch sessions');
        const data: Session[] = await res.json();
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Poll every 30s as fallback
    const interval = setInterval(fetchSessions, 30000);

    // Real-time updates via socket.io
    const socket = io(API.base, { transports: ['websocket', 'polling'] });
    socket.on('connect_error', () => { /* backend may not be running */ });

    socket.on('session_created', (session: Session) => {
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    });

    socket.on('new_triage', (session: Session) => {
      setSessions((prev) => prev.map((s) => s.id === session.id ? session : s));
    });

    socket.on('crisis_alert', (payload: { session: Session }) => {
      setSessions((prev) => [payload.session, ...prev.filter((s) => s.id !== payload.session.id)]);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const filtered = sessions.filter((s) => {
    if (filter === 'all') return true;
    if (filter === 'crisis') return s.crisis_level === 'crisis';
    return s.status === filter;
  });

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading sessions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sessions</h1>
          <p className={styles.subtitle}>All support sessions — {sessions.length} total</p>
        </div>
      </div>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <SessionsTable sessions={filtered} onRowClick={handleRowClick} onChatClick={handleChatClick} />
      </div>

      <SessionDetailPanel session={selectedSession} onClose={handleClosePanel} />
      <HumanChatPanel session={chatSession} onClose={handleCloseChat} />
    </div>
  );
}
