import Link from 'next/link';
import { BarChart3, Github, Linkedin, MapPin, SearchCheck } from 'lucide-react';
import styles from './Footer.module.css';

const navSections = [
  {
    title: 'Explore',
    links: [
      { href: '/map', label: 'Noise map' },
      { href: '/districts', label: 'Areas' },
      { href: '/insights', label: 'Public insights' },
      { href: '/compare', label: 'Compare areas' },
      { href: '/quiet-finder', label: 'Quiet finder' },
    ],
  },
  {
    title: 'Contribute',
    links: [
      { href: '/report', label: 'Submit report' },
      { href: '/me', label: 'My impact' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Login' },
      { href: '/signup', label: 'Create account' },
    ],
  },
];

const projectHighlights = ['Live city map', 'Area scorecards', 'Quiet recommendations'];

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <Link href="/" className={styles.brand}>
            <MapPin size={20} />
            <span>ShorLahore</span>
          </Link>
          <p className={styles.tagline}>
            Crowdsourced noise reporting, public area insights, and calmer-place discovery for Lahore.
          </p>
          <div className={styles.highlights}>
            {projectHighlights.map((highlight) => (
              <span key={highlight} className={styles.pill}>{highlight}</span>
            ))}
          </div>
        </div>

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

        <div className={styles.summaryCol}>
          <strong>Public data</strong>
          <div className={styles.summaryItem}>
            <BarChart3 size={18} />
            <span>Aggregated active reports keep city insights useful without exposing private user data.</span>
          </div>
          <div className={styles.summaryItem}>
            <SearchCheck size={18} />
            <span>Find quieter areas by time of day, intensity, and the source you want to avoid.</span>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <div className={styles.bottomInner}>
          <span>Built by Haseeb Akram</span>
          <div className={styles.profileLinks}>
            <a href="https://github.com/Haseeb-Akram928" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
              <Github size={15} />
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/haseeb-akram-807843385/" target="_blank" rel="noopener noreferrer" className={styles.sourceLink}>
              <Linkedin size={15} />
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
