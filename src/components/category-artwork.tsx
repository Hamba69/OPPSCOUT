import Image from "next/image";

import { Icon } from "@/components/app-shell";

const artwork = {
  job: "/images/categories/job.webp",
  scholarship: "/images/categories/scholarship.webp",
  internship: "/images/categories/internship.webp",
  grant: "/images/categories/grant.webp",
  fellowship: "/images/categories/fellowship.webp",
  training: "/images/categories/training.webp",
  exhibition: "/images/categories/exhibition.webp",
  consultancy: "/images/categories/consultancy.webp",
} as const;

/** Decorative category artwork; the adjacent label supplies the accessible name. */
export function CategoryArtwork({ category, className = "size-12" }: { category: string; className?: string }): React.JSX.Element {
  if (!Object.prototype.hasOwnProperty.call(artwork, category)) {
    return <span className={`icon-chip ${className === "size-12" ? "" : className}`}><Icon name="opportunities" size={18} /></span>;
  }

  return <Image src={artwork[category as keyof typeof artwork]} alt="" aria-hidden="true"
    width={48} height={48} sizes="48px" unoptimized className={`${className} shrink-0 object-contain`} />;
}
