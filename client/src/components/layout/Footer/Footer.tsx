import Link from 'next/link';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span>ShorLahore</span>
        <nav aria-label="Footer navigation">
          <Link href="/map">Map</Link>
          <Link href="/districts">Districts</Link>
          <Link href="/login">Admin</Link>
        </nav>
      </div>
    </footer>
  );
}
