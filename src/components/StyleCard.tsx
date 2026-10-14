import Image from "next/image";
import Link from "next/link";
import type { StagingStyle } from "@/lib/styles";
import { ROUTES } from "@/lib/site";

interface StyleCardProps {
  style: StagingStyle;
  /** Podgląd stylu (np. wersja „po” z portfolio). */
  imageSrc?: string;
  imageAlt?: string;
  /** Link „Zamów w tym stylu” – domyślnie /zamow?styl=<slug>. */
  href?: string;
  className?: string;
}

export function StyleCard({ style, imageSrc, imageAlt, href, className = "" }: StyleCardProps) {
  const target = href ?? `${ROUTES.order}?styl=${style.slug}`;
  return (
    <article className={`card flex flex-col overflow-hidden ${className}`}>
      {imageSrc && (
        <div className="relative aspect-[3/2] bg-cream">
          <Image
            src={imageSrc}
            alt={imageAlt ?? `Przykładowa aranżacja w stylu ${style.name.toLowerCase()}`}
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-ink">{style.name}</h3>
          <span className="flex -space-x-1.5" aria-hidden="true">
            {style.palette.map((color) => (
              <span
                key={color}
                className="h-5 w-5 rounded-full border-2 border-surface"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{style.description}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label={`Charakterystyczne elementy stylu ${style.name}`}>
          {style.keywords.map((keyword) => (
            <li key={keyword} className="rounded-full bg-cream px-2.5 py-1 text-xs text-ink/80">
              {keyword}
            </li>
          ))}
        </ul>
        <Link href={target} className="link mt-5 inline-flex items-center gap-1 text-sm">
          Zamów w tym stylu<span aria-hidden="true">→</span>
          <span className="sr-only">: {style.name}</span>
        </Link>
      </div>
    </article>
  );
}
