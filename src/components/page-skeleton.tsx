import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

export function PageSkeleton(_props: { section: "matches" | "provider" | "admin" }): React.JSX.Element {
  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.stage}>
        <div className={styles.logoOrbit} aria-hidden="true">
          <div className={styles.outerOrbit} />
          <div className={styles.innerOrbit} />
          <div className={styles.logoCore}><Logo size={82} /></div>
          {Array.from({ length: 8 }, (_, index) => (
            <span className={`${styles.logoParticle} ${styles.outerParticle}`} key={`outer-${index}`}>
              <Logo size={25} priority={false} />
            </span>
          ))}
          {Array.from({ length: 4 }, (_, index) => (
            <span className={`${styles.logoParticle} ${styles.innerParticle}`} key={`inner-${index}`}>
              <Logo size={18} priority={false} />
            </span>
          ))}
        </div>
        <p className={styles.screenReaderStatus} role="status">Loading OppScout</p>
      </div>
    </main>
  );
}
