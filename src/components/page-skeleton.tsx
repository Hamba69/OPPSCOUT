import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

export function PageSkeleton({ section }: { section: "matches" | "provider" | "admin" }): React.JSX.Element {
  return (
    <main className={styles.page} aria-busy="true" data-section={section}>
      <div className={styles.stage}>
        <div className={styles.orb} aria-hidden="true" />
        <div className={styles.brand} aria-hidden="true">
          <Logo size={56} />
          <span className={styles.wordmark}>oppscout</span>
        </div>
        <div className={styles.track} aria-hidden="true"><div className={styles.bar} /></div>
        <p className={styles.screenReaderStatus} role="status">Loading OppScout</p>
      </div>
    </main>
  );
}
