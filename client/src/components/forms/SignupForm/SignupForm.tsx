'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useAuth } from '@/context/AuthContext';
import styles from './SignupForm.module.css';

export function SignupForm() {
  const router = useRouter();
  const { register, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearError();
    setFormError(null);

    if (name.trim().length < 2) {
      setFormError('Name must be at least 2 characters');
      return;
    }

    if (!email.includes('@')) {
      setFormError('Enter a valid email address');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(name, email, password);
      router.push('/');
    } catch {
      setIsSubmitting(false);
    }
  };

  const visibleError = formError || error;

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      {visibleError && (
        <div className={styles.alert} role="alert">
          <AlertCircle size={18} />
          <span>{visibleError}</span>
        </div>
      )}
      <Input
        label="Name"
        name="name"
        autoComplete="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={isSubmitting}
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="Use at least 8 characters."
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        disabled={isSubmitting}
      />
      <Button type="submit" isLoading={isSubmitting}>Create account</Button>
    </form>
  );
}
