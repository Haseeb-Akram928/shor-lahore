import Link from 'next/link';
import { Card } from '@/components/ui/Card/Card';
import { SignupForm } from '@/components/forms/SignupForm/SignupForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Signup',
};

export default function SignupPage() {
  return (
    <section className={styles.page}>
      <Card className={styles.panel}>
        <div className={styles.header}>
          <h1>Create account</h1>
          <p>Join the reporting workflow for Lahore noise observations.</p>
        </div>
        <SignupForm />
        <p className={styles.footerText}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </Card>
    </section>
  );
}
