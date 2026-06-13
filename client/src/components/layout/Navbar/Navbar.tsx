'use client';

import Link from 'next/link';
import { LogOut, MapPin, Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import styles from './Navbar.module.css';

const links = [
  { href: '/', label: 'Home' },
  { href: '/map', label: 'Map' },
  { href: '/insights', label: 'Insights' },
  { href: '/compare', label: 'Compare' },
  { href: '/quiet-finder', label: 'Quiet Finder' },
  { href: '/report', label: 'Report' },
  { href: '/districts', label: 'Areas' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const visibleLinks = [
    ...links,
    ...(isAuthenticated ? [{ href: '/me', label: 'My Impact' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand} onClick={() => setIsOpen(false)}>
          <MapPin size={22} />
          <span>ShorLahore</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {visibleLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>

        <div className={styles.actions}>
          <Button variant="ghost" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          {isAuthenticated ? (
            <Button variant="secondary" onClick={() => void logout()}>
              <LogOut size={16} />
              <span>{user?.name || 'Logout'}</span>
            </Button>
          ) : (
            <Button asChild variant="secondary" href="/login">Login</Button>
          )}
        </div>

        <Button className={styles.menuButton} variant="ghost" onClick={() => setIsOpen((current) => !current)} aria-label="Toggle navigation">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {isOpen && (
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          {visibleLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>{link.label}</Link>
          ))}

          <div className={styles.mobileActions}>
            <button
              className={styles.themeToggle}
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>

            {isAuthenticated ? (
              <button
                className={styles.mobileAuthBtn}
                onClick={() => { void logout(); setIsOpen(false); }}
              >
                <LogOut size={16} />
                <span>{user?.name || 'Logout'}</span>
              </button>
            ) : (
              <>
                <Link href="/login" className={styles.mobileAuthBtn} onClick={() => setIsOpen(false)}>Login</Link>
                <Link href="/signup" className={styles.mobileAuthBtn} onClick={() => setIsOpen(false)}>Signup</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
