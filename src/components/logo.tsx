/**
 * The OppScout mark: the orb. Drawn in CSS (the same gradient as the matching orb) so it stays crisp at any
 * size and needs no image request. public/logo.png and the app icons are renderings of the same orb.
 */
export function Logo({ size = 40 }: { size?: number; priority?: boolean }): React.JSX.Element {
  return <span className="orb orb-logo" style={{ width: size, height: size }} aria-hidden="true" />;
}
