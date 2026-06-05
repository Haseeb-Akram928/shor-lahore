'use client';

import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 id="modal-title">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </Button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>
  );
}
