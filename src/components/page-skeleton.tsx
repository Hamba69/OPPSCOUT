import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

export function PageSkeleton(_props: { section: "matches" | "provider" | "admin" }): React.JSX.Element {
  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.stage}>
        <div aria-hidden="true"><Logo size={64} /></div>
        <span className={styles.wordmark} aria-hidden="true">oppscout</span>
        <div className={styles.track} aria-hidden="true"><div className={styles.bar} /></div>
        <p className={styles.screenReaderStatus} role="status">Loading OppScout</p>
      </div>
    </main>
  );
}
