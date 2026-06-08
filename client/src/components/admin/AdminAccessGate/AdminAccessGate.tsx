'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useAuth } from '@/hooks/useAuth';
import styles from './AdminAccessGate.module.css';

interface AdminAccessGateProps {
  children: React.ReactNode;
}

export function AdminAccessGate({ children }: AdminAccessGateProps) {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.state} role="status" aria-live="polite">
        <Spinner />
        <span>Loading admin workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.state}>
        <ShieldAlert size={28} aria-hidden="true" />
        <h1>Admin sign in required</h1>
        <p>Use an administrator account to view city operations.</p>
        <Button asChild href="/login">
          Sign in
        </Button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.state}>
        <ShieldAlert size={28} aria-hidden="true" />
        <h1>Forbidden</h1>
        <p>Your account does not have access to the admin dashboard.</p>
        <Link href="/" className={styles.link}>
          Return home
        </Link>
      </div>
    );
  }

  return children;
}
