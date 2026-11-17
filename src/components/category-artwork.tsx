import Image from "next/image";

import { Icon } from "@/components/app-shell";

const artwork = {
  job: "/images/categories/job.webp",
  scholarship: "/images/categories/scholarship.webp",
  internship: "/images/categories/internship.webp",
  grant: "/images/categories/grant.webp",
  fellowship: "/images/categories/fellowship.svg",
  training: "/images/categories/training.svg",
  exhibition: "/images/categories/exhibition.svg",
} as const;

/** Decorative category artwork; the adjacent label supplies the accessible name. */
export function CategoryArtwork({ category }: { category: string }): React.JSX.Element {
  if (!Object.prototype.hasOwnProperty.call(artwork, category)) {
    return <span className="icon-chip"><Icon name="opportunities" size={18} /></span>;
  }

  return <Image src={artwork[category as keyof typeof artwork]} alt="" aria-hidden="true"
    width={48} height={48} sizes="48px" unoptimized className="size-12 shrink-0 object-contain" />;
}
