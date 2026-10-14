import Image from "next/image";

export function Logo({ size = 40, priority = true }: { size?: number; priority?: boolean }): React.JSX.Element {
  return <Image src="/logo.png" alt="" width={size} height={size} priority={priority} aria-hidden="true" />;
}
