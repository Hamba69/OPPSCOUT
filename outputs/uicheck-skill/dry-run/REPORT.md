# UI audit skill dry run — 17 November 2026

**Execution succeeded without desktop control. UI verdict: Provisional.** No application changes, provider submissions, account mutations or deployment were performed. Evidence is from the current local workspace and a fresh isolated headless Edge profile, not the user's signed-in desktop profile.

## Fresh results

- Installed skill scanner completed over **86 files**: 84 TSX and 2 CSS.
- **10 route/viewport checks completed**, at 320 and 1280px, with zero runner errors, zero selected axe violations and no page-level horizontal overflow in these default layouts.
- Eight checks rendered their requested page: home, seeker login, publisher landing and publisher signup at both widths.
- Two `/opportunities` checks redirected to login. They are authentication-gate observations, not catalogue coverage.
- Keyboard focus styles and screenshots were captured by the runner. This is sampling, not a screen-reader or full keyboard certification.

## Candidate review

The static scanner produced 12 S1 and four S2 candidates. These are **not confirmed issue counts**:

- All 12 apparent missing-label issues are false positives: `Field` in `src/components/profile-form.tsx:40` wraps the inputs in `<label>`.
- The removed-outline candidate has a parent `.opp-card:focus-within` shadow replacement in normal colours. Its high-contrast behaviour requires separate evaluation.
- Three 10–11px typography candidates are grouped as one S2 source-inferred readability concern.

Fresh scoped findings: S0 0, S1 0, S2 1, S3 0. The two S1 issues established by the **earlier extended audit**—forced-colour focus loss and enlarged-root-text overflow—remain open; they were not rerun by this default-layout dry run. The cumulative assessment remains **S0 0, S1 2, S2 1, S3 0**, provisional. See [the full report](../REPORT.md) for evidence and proposed fixes.

## Coverage by lens

| Lens | Evidence |
| --- | --- |
| Accessibility | Fresh static and selected automated browser rules; no real screen reader. |
| Usability | Default public-page structure and authentication redirects; signed-in tasks untested. |
| Performance/resilience | Not remeasured in this dry run; prior synthetic observation remains labelled in the full report. |
| Consistency | Shared labels and focus styling checked; scanner token counts remain heuristic. |
| Maintainability | Existing shared category artwork and component patterns inspected; no code edits. |
| Trust | No account/provider action executed; no catalogue verification claims validated. |
| Content clarity | Source labels present; small supporting typography flagged for review. |
| AI/agent interfaces | No such interaction exercised in this public-page run. |

## Outputs and reproduction

- `static-audit.json` and `static-audit.md`: raw scanner candidates and token inventory.
- `browser-audit.json`: final URLs, redirect coverage notes, axe results, layout measurements and sampled Tab sequence.
- PNGs: screenshots of tested rendered pages.

With the local app at `http://127.0.0.1:3107`:

```powershell
python C:/Users/PROBOOK/.codex/skills/ui-ux-audit/scripts/audit_static.py src --format md
node outputs/uicheck-skill/dry-run/browser-audit.cjs
```

The skill is usable without desktop control. Signed-in evaluation still needs an explicitly accessible authenticated test context; this run did not extract browser cookies or reuse the desktop account.
