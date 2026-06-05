import Link from 'next/link';
import { Card } from '@/components/ui/Card/Card';
import { LoginForm } from '@/components/forms/LoginForm/LoginForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Login',
};

export default function LoginPage() {
  return (
    <section className={styles.page}>
      <Card className={styles.panel}>
        <div className={styles.header}>
          <h1>Login</h1>
          <p>Access protected reporting and admin tools.</p>
        </div>
        <LoginForm />
        <p className={styles.footerText}>
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </Card>
    </section>
  );
}
