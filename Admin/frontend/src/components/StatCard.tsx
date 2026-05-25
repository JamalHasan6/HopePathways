import styles from './StatCard.module.css';

interface StatCardProps {
  title: string;
  count: number;
  icon: string;
  variant: 'active' | 'crisis' | 'total';
  onClick?: () => void;
  active?: boolean;
}

export default function StatCard({ title, count, icon, variant, onClick, active }: StatCardProps) {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${onClick ? styles.clickable : ''} ${active ? styles.activeFilter : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      <div className={styles.iconWrapper}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.count}>{count}</p>
      </div>
    </div>
  );
}
