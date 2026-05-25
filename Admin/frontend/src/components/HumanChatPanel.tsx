import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Session } from '../types';
import API from '../config/api';
import styles from './HumanChatPanel.module.css';

interface HumanMessage {
  id?: number;
  sender: 'admin' | 'user';
  message: string;
  created_at: string;
}

interface Props {
  session: Session | null;
  onClose: () => void;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export default function HumanChatPanel({ session, onClose }: Props) {
  const [messages, setMessages] = useState<HumanMessage[]>([]);
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ step: number; answer: string }>>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Load session history + human messages when session changes
  useEffect(() => {
    if (!session) {
      setMessages([]);
      setSessionAnswers([]);
      seenIds.current = new Set();
      return;
    }
    setLoading(true);
    seenIds.current = new Set();

    Promise.all([
      fetch(`${API.endpoints.admin}/sessions/${session.id}`).then((r) => r.json()),
      fetch(`${API.endpoints.admin}/sessions/${session.id}/human-messages`).then((r) => r.json()),
    ])
      .then(([sessionData, humanMsgs]: [Session & { answers?: Array<{ step: number; answer: string }> }, HumanMessage[]]) => {
        setSessionAnswers(sessionData.answers ?? []);
        const typed = (humanMsgs ?? []) as HumanMessage[];
        typed.forEach((m) => { if (m.id != null) seenIds.current.add(m.id); });
        setMessages(typed);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.id]);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    if (!session) return;
    const poll = async () => {
      try {
        const res = await fetch(`${API.endpoints.admin}/sessions/${session.id}/human-messages`);
        if (!res.ok) return;
        const msgs = (await res.json()) as HumanMessage[];
        const newMsgs = msgs.filter((m) => m.id != null && !seenIds.current.has(m.id!));
        if (newMsgs.length > 0) {
          newMsgs.forEach((m) => { if (m.id != null) seenIds.current.add(m.id!); });
          setMessages((prev) => [...prev, ...newMsgs]);
        }
      } catch {
        // ignore
      }
    };
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [session?.id]);

  // Also listen via socket.io for instant updates
  useEffect(() => {
    if (!session) return;
    const socket = io(API.base, { transports: ['websocket', 'polling'] });
    socket.on('connect_error', () => { /* backend may be unavailable */ });
    socket.on('connect', () => {
      // Join the session room so admin receives room-scoped human_message events
      socket.emit('join_session', session.id);
    });
    socket.on('human_message', (payload: { sessionId: string } & HumanMessage) => {
      if (payload.sessionId !== session.id) return;
      if (payload.id != null && seenIds.current.has(payload.id)) return;
      if (payload.id != null) seenIds.current.add(payload.id);
      setMessages((prev) => [...prev, payload]);
    });
    return () => { socket.disconnect(); };
  }, [session?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sessionAnswers]);

  // Focus input when panel opens
  useEffect(() => {
    if (session) setTimeout(() => inputRef.current?.focus(), 300);
  }, [session?.id]);

  async function sendMessage() {
    const text = draft.trim();
    if (!text || !session || sending) return;
    setSending(true);
    setDraft('');
    try {
      const res = await fetch(`${API.endpoints.admin}/sessions/${session.id}/human-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      if (res.ok) {
        const msg = (await res.json()) as HumanMessage;
        // Only add if socket hasn't already delivered it
        if (msg.id != null && !seenIds.current.has(msg.id)) {
          seenIds.current.add(msg.id);
          setMessages((prev) => [...prev, msg]);
        } else if (msg.id != null) {
          seenIds.current.add(msg.id); // ensure tracked even if socket was first
        }
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  const open = session !== null;

  // These must exactly match Chat.tsx:
  // step 1 = answer to OPENING_MESSAGE, step 2 = answer to FIXED_QUESTIONS[0], etc.
  const AI_QUESTIONS = [
    "Hi, I am really glad you are here. I am a support navigator with Hope Pathways from LMNSPN. How have you been feeling today, or what brought you here?",
    "How long have you been feeling this way?",
    "What has felt heaviest for you over the last few days?",
    "When these feelings show up, what is usually happening around you?",
    "Have you spoken to a GP, counsellor, or support service about this before?",
    "Is there someone you trust that you can lean on right now?",
  ];

  const flags: string[] = (() => {
    const raw = session?.flags;
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  })();

  const FLAG_LABELS: Record<string, string> = {
    first_time_seeker: 'First-time seeker',
    social_isolation: 'Social isolation',
    previous_ed_presentation: 'Previous ED presentation',
    cald_background: 'CALD background',
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${open ? styles.backdropVisible : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <div>
            <div className={styles.panelLabel}>Human Intervention — Crisis</div>
            <div className={styles.panelId}>
              {session ? shortId(session.id) : '—'}
            </div>
            {session?.name && <div className={styles.panelName}>👤 {session.name}</div>}
            {session?.phone && <div className={styles.panelName}>📞 {session.phone}</div>}
            {session?.address && <div className={styles.panelName}>📍 {session.address}</div>}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* AI triage summary + flags */}
        {(session?.notes || flags.length > 0) && (
          <div className={styles.summaryBar}>
            {session?.notes && (
              <div className={styles.summaryText}>
                <strong>AI Summary:</strong> {session.notes}
              </div>
            )}
            {flags.length > 0 && (
              <div className={styles.flagsRow}>
                {flags.map((f) => (
                  <span key={f} className={styles.flagBadge}>
                    {FLAG_LABELS[f] ?? f.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat area */}
        <div className={styles.chatArea}>
          {loading && <div className={styles.loadingText}>Loading session…</div>}

          {!loading && (
            <>
              {/* AI triage transcript */}
              {sessionAnswers.length > 0 && (
                <div className={styles.transcriptSection}>
                  <div className={styles.sectionLabel}>AI Triage Conversation</div>
                  {sessionAnswers.map((a, i) => (
                    <div key={i}>
                      <div className={`${styles.bubble} ${styles.bubbleAi}`}>
                        <span className={styles.bubbleSenderLabel}>🤖 AI Navigator</span>
                        {AI_QUESTIONS[i] ?? `Check-in question ${a.step}`}
                      </div>
                      <div className={`${styles.bubble} ${styles.bubbleUser}`}>
                        <span className={styles.bubbleSenderLabel}>👤 User</span>
                        {a.answer}
                      </div>
                    </div>
                  ))}
                  <div className={styles.divider}>
                    <span>⬇ Human Intervention</span>
                  </div>
                </div>
              )}

              {/* Human chat messages */}
              {messages.length === 0 && sessionAnswers.length === 0 && (
                <div className={styles.emptyChat}>No messages yet. Send a message to start the human intervention.</div>
              )}
              {messages.length === 0 && sessionAnswers.length > 0 && (
                <div className={styles.emptyChat}>Send your first message to the user below.</div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`${styles.bubble} ${m.sender === 'admin' ? styles.bubbleAdmin : styles.bubbleUserReply}`}>
                  <span className={styles.bubbleSenderLabel}>
                    {m.sender === 'admin' ? '🧑‍💼 You (Support Worker)' : '👤 User'}
                  </span>
                  {m.message}
                  <span className={styles.bubbleTime}>{formatTime(m.created_at)}</span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            value={draft}
            placeholder="Type your message to the user…"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
            }}
            disabled={sending || !session}
          />
          <button
            className={styles.sendBtn}
            onClick={sendMessage}
            disabled={sending || !draft.trim() || !session}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </>
  );
}
