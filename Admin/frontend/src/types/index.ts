export type ResultType = 'crisis' | 'hub' | 'peer' | 'info';
export type SessionStatus = 'in_progress' | 'completed';

export interface CheckInAnswer {
  step: number;
  answer: string;
}

export interface Session {
  id: string;
  crisis_level: ResultType | null;
  status: SessionStatus;
  created_at: string;
  completed_at: string | null;
  name: string | null;
  email?: string | null;
  phone: string | null;
  address: string | null;
  wants_call?: string | null;
  notes: string | null;
  flags: string | null;        // JSON-encoded string[] stored in DB
  answers?: CheckInAnswer[];
}

export interface DashboardStats {
  activeSessions: number;
  crisisFlagged: number;
  todayTotal: number;
}

export interface DashboardData {
  stats: DashboardStats;
  sessions: Session[];
}
