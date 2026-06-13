import Link from 'next/link';
import { Github, Heart, Linkedin, MapPin, Twitter } from 'lucide-react';
import styles from './Footer.module.css';

const navSections = [
  {
    title: 'Platform',
    links: [
      { href: '/map', label: 'Noise Map' },
      { href: '/report', label: 'Report Noise' },
      { href: '/districts', label: 'Areas' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Login' },
      { href: '/signup', label: 'Create Account' },
      { href: '/admin', label: 'Admin Dashboard' },
    ],
  },
];

const techStack = ['Next.js', 'Express', 'MongoDB', 'MapLibre', 'deck.gl', 'Socket.io'];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand}>
            <MapPin size={20} />
            <span>ShorLahore</span>
          </Link>
          <p className={styles.tagline}>
            Crowdsourced noise pollution mapping and analytics for Lahore, Pakistan.
          </p>
          <div className={styles.techPills}>
            {techStack.map((tech) => (
              <span key={tech} className={styles.pill}>{tech}</span>
            ))}
          </div>
        </div>

        {/* Nav columns */}
        {navSections.map((section) => (
          <div key={section.title} className={styles.navCol}>
            <strong>{section.title}</strong>
            <nav aria-label={`${section.title} links`}>
              {section.links.map((link) => (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              ))}
            </nav>
          </div>
        ))}

        {/* Social / developer column */}
        <div className={styles.navCol}>
          <strong>Developer</strong>
          <p className={styles.devCredit}>
            Designed &amp; developed by<br />
            <span className={styles.devName}>Haseeb Akram</span>
          </p>
          <div className={styles.socials}>
            <a href="https://github.com/Haseeb-Akram928" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <Github size={18} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter size={18} />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>
            © {currentYear} ShorLahore. Built with <Heart size={13} className={styles.heart} /> in Lahore.
          </span>
          <span className={styles.devTag}>
            A project by Haseeb Akram
          </span>
        </div>
      </div>
    </footer>
  );
}
