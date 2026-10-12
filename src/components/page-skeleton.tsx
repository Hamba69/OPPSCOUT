import { Logo } from "@/components/logo";
import styles from "@/components/page-skeleton.module.css";

export function PageSkeleton(_props: { section: "matches" | "provider" | "admin" }): React.JSX.Element {
  return (
    <main className={styles.page} aria-busy="true">
      <div className={styles.stage}>
        <div className={styles.butterfly} aria-hidden="true">
          <svg className={styles.wings} viewBox="0 0 220 160" fill="none">
            <g className={styles.leftWing}>
              <path className={styles.upperWing} d="M105 78C91 32 48 9 25 24C2 40 21 81 65 88C38 91 23 113 36 132C50 152 83 124 106 91Z" />
              <path className={styles.lowerWing} d="M103 86C76 91 57 112 65 129C73 145 96 126 107 100Z" />
            </g>
            <g className={styles.rightWing}>
              <path className={styles.upperWing} d="M115 78C129 32 172 9 195 24C218 40 199 81 155 88C182 91 197 113 184 132C170 152 137 124 114 91Z" />
              <path className={styles.lowerWing} d="M117 86C144 91 163 112 155 129C147 145 124 126 113 100Z" />
            </g>
          </svg>
          <div className={styles.logoMark}><Logo size={68} /></div>
        </div>
        <p className={styles.screenReaderStatus} role="status">Loading OppScout</p>
      </div>
    </main>
  );
}
