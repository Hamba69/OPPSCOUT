import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

const loadingCopy = {
  matches: {
    title: "Finding opportunities that fit you",
    detail: "Checking verified roles against your profile and application deadlines.",
  },
  provider: {
    title: "Preparing your organization workspace",
    detail: "Loading your listings, review status, and next steps.",
  },
  admin: {
    title: "Preparing your review queue",
    detail: "Gathering listings and trust checks that need attention.",
  },
} as const;

export function PageSkeleton({ section }: { section: keyof typeof loadingCopy }): React.JSX.Element {
  const copy = loadingCopy[section];

  return (
    <main className="page-shell" aria-busy="true">
      <section className={styles.loadingCard} aria-labelledby="loading-title">
        <div className={styles.pattern} aria-hidden="true" />
        <div className={styles.content}>
          <div className={styles.brand}>
            <Logo size={35} />
            <span>oppscout</span>
          </div>
          <div className={styles.flight} aria-hidden="true">
            <svg className={styles.orbit} viewBox="0 0 180 118" fill="none">
              <ellipse cx="90" cy="59" rx="68" ry="37" />
            </svg>
            <svg className={styles.butterfly} viewBox="0 0 96 78" fill="none">
              <g className={styles.leftWing}>
                <path d="M47 39C37 13 13 8 10 23C7 37 26 44 46 43C32 43 24 53 30 62C36 70 45 57 48 45Z" />
                <path className={styles.vein} d="M43 38C31 29 21 23 12 21M44 44C37 50 34 57 32 62" />
              </g>
              <g className={styles.rightWing}>
                <path d="M49 39C59 13 83 8 86 23C89 37 70 44 50 43C64 43 72 53 66 62C60 70 51 57 48 45Z" />
                <path className={styles.vein} d="M53 38C65 29 75 23 84 21M52 44C59 50 62 57 64 62" />
              </g>
              <path className={styles.body} d="M48 34C44 39 44 48 48 56C52 48 52 39 48 34Z" />
              <path className={styles.antenna} d="M47 35C42 27 39 26 36 26M49 35C54 27 57 26 60 26" />
            </svg>
          </div>
          <p className={styles.eyebrow}>A little patience. A better next step.</p>
          <h1 id="loading-title" className={styles.title}>{copy.title}</h1>
          <p className={styles.detail}>{copy.detail}</p>
          <div className={styles.progressTrack} aria-hidden="true"><span /></div>
          <p className={styles.status} role="status">{copy.title}. {copy.detail}</p>
        </div>
      </section>
    </main>
  );
}
