import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { Session, DashboardStats } from '../types';
import API from '../config/api';
import StatCard from '../components/StatCard';
import SessionsTable from '../components/SessionsTable';
import SessionDetailPanel from '../components/SessionDetailPanel';
import HumanChatPanel from '../components/HumanChatPanel';
import styles from './Dashboard.module.css';

const API_URL = `${API.endpoints.admin}/sessions`;

interface CrisisAlert {
  session: Session;
  latestAnswer: string;
  step: number;
  detectedAt: string;
}

function computeStats(sessions: Session[]): DashboardStats {
  const today = new Date().toDateString();
  return {
    activeSessions: sessions.filter((s) => s.status === 'in_progress').length,
    crisisFlagged: sessions.filter((s) => s.crisis_level === 'crisis').length,
    todayTotal: sessions.filter((s) => new Date(s.created_at).toDateString() === today).length,
  };
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [chatSession, setChatSession] = useState<Session | null>(null);
  const [crisisAlerts, setCrisisAlerts] = useState<CrisisAlert[]>([]);
  const [statFilter, setStatFilter] = useState<'active' | 'crisis' | null>(null);

  const handleRowClick = useCallback((session: Session) => {
    setSelectedSession(session);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedSession(null);
  }, []);

  const handleChatClick = useCallback((session: Session) => {
    setChatSession(session);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatSession(null);
  }, []);

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

    // Real-time updates via socket.io — connect directly to backend
    const socket = io(API.base, { transports: ['websocket', 'polling'] });
    socket.on('connect_error', () => { /* backend may not be running, silently ignore */ });

    // New session started by end user
    socket.on('session_created', (session: Session) => {
      setSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)]);
    });

    // Session completed — update existing entry
    socket.on('new_triage', (session: Session) => {
      setSessions((prev) => prev.map((s) => s.id === session.id ? session : s));
    });

    socket.on('crisis_alert', (payload: CrisisAlert) => {
      setSessions((prev) => [payload.session, ...prev.filter((s) => s.id !== payload.session.id)]);
      setCrisisAlerts((prev) => [payload, ...prev].slice(0, 8));
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <span className={styles.errorIcon}>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  const stats = computeStats(sessions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const recent = sessions.filter((s) => {
    const d = new Date(s.created_at);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() || d.getTime() === yesterday.getTime();
  });

  const displayedSessions = statFilter === 'active'
    ? sessions.filter((s) => s.status === 'in_progress')
    : statFilter === 'crisis'
      ? sessions.filter((s) => s.crisis_level === 'crisis')
      : recent;

  const sectionTitle = statFilter === 'active'
    ? 'Active Sessions'
    : statFilter === 'crisis'
      ? 'Crisis Flagged Sessions'
      : 'Recent Sessions';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Real-time overview of active support sessions</p>
        </div>
        <div className={styles.liveIndicator}>
          <span className={styles.liveDot} />
          Live
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard title="Active Sessions" count={stats.activeSessions} icon="🟢" variant="active"
          onClick={() => setStatFilter((f) => f === 'active' ? null : 'active')}
          active={statFilter === 'active'} />
        <StatCard title="Crisis Flagged" count={stats.crisisFlagged} icon="🚨" variant="crisis"
          onClick={() => setStatFilter((f) => f === 'crisis' ? null : 'crisis')}
          active={statFilter === 'crisis'} />
        <StatCard title="Today's Total" count={stats.todayTotal} icon="📊" variant="total"
          onClick={() => setStatFilter(null)}
          active={statFilter === null} />
      </div>

      {crisisAlerts.length > 0 && (
        <div className={styles.alertStrip}>
          <div className={styles.alertHeader}>🚨 Immediate Crisis Alerts</div>
          {crisisAlerts.map((alert) => (
            <button
              key={`${alert.session.id}-${alert.detectedAt}`}
              className={styles.alertItem}
              onClick={() => handleRowClick(alert.session)}
              type="button"
            >
              <span className={styles.alertId}>{alert.session.id.slice(0, 8).toUpperCase()}</span>
              <span className={styles.alertText}>{alert.latestAnswer}</span>
              <span className={styles.alertTime}>{new Date(alert.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </button>
          ))}
        </div>
      )}

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>{sectionTitle}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {statFilter && (
              <button
                onClick={() => setStatFilter(null)}
                style={{ fontSize: '12px', padding: '2px 10px', borderRadius: '12px', border: '1px solid #ccc', background: 'transparent', cursor: 'pointer' }}
              >
                ✕ Clear filter
              </button>
            )}
            <span className={styles.sectionBadge}>{displayedSessions.length}</span>
          </div>
        </div>
        <div className={styles.card}>
          <SessionsTable sessions={displayedSessions} onRowClick={handleRowClick} onChatClick={handleChatClick} />
        </div>
      </div>

      <SessionDetailPanel session={selectedSession} onClose={handleClosePanel} />
      <HumanChatPanel session={chatSession} onClose={handleCloseChat} />
    </div>
  );
}
