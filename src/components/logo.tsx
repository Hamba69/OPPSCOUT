import Image from "next/image";

export function Logo({ size = 40 }: { size?: number }): React.JSX.Element {
  return <Image src="/logo.png" alt="" width={size} height={size} priority aria-hidden="true" />;
}
