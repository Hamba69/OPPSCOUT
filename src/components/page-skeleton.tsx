import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

const MESSAGES = {
  matches: "Finding what fits you…",
  provider: "Opening your publisher workspace…",
  admin: "Opening the portal…",
} as const;

/**
 * Loading state shown while a page streams in. It is a normal block (not position: fixed), so it centres
 * inside the glass app frame on signed-in pages and on the page itself elsewhere. A fixed overlay would be
 * trapped by the frame's backdrop-filter, which makes it the containing block for fixed elements.
 */
export function PageSkeleton({ section }: { section: keyof typeof MESSAGES }): React.JSX.Element {
  return (
    <main className={styles.page} aria-busy="true" data-section={section}>
      <div className={styles.card}>
        <div className={styles.orb} aria-hidden="true" />
        <div className={styles.brand} aria-hidden="true">
          <Logo size={28} />
          <span className={styles.wordmark}>oppscout</span>
        </div>
        <p className={styles.message} aria-hidden="true">{MESSAGES[section]}</p>
        <div className={styles.track} aria-hidden="true"><div className={styles.bar} /></div>
        <p className={styles.screenReaderStatus} role="status">Loading OppScout</p>
      </div>
    </main>
  );
}
