import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/sessions', label: 'Sessions', icon: '💬' },
];

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandIcon}>🌿</span>
        <span className={styles.brandName}>HopePathways</span>
        <span className={styles.brandTag}>Admin</span>
      </div>

      <nav className={styles.nav}>
        <p className={styles.navSection}>MENU</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
