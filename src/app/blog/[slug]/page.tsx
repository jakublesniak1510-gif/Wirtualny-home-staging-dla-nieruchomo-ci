import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon } from "@/components/CheckIcon";
import { JsonLd, articleJsonLd } from "@/components/JsonLd";
import { Breadcrumbs } from "@/components/marketing/Breadcrumbs";
import { BLOG_POSTS, getCategoryLabel, getPostBySlug, getRelated, getTableOfContents } from "@/content/blog";
import type { BlogBlock } from "@/content/blog";
import { countWords } from "@/content/blog/helpers";
import { formatDatePL, formatPLNShort, formatPhotoCount } from "@/lib/format";
import { FREE_SAMPLE_PHOTOS, PRICE_BULK } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { ROUTES, SITE } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: ROUTES.blogPost(post.slug),
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      section: getCategoryLabel(post.category),
      tags: post.keywords,
    },
  });
}

function ArticleBody({ blocks }: { blocks: readonly BlogBlock[] }) {
  const toc = getTableOfContents(blocks);
  let h2Index = 0;
  return (
    <div className="prose-blog">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case "h2": {
            const id = toc[h2Index++]?.id;
            return (
              <h2 key={key} id={id}>
                {block.text}
              </h2>
            );
          }
          case "h3":
            return <h3 key={key}>{block.text}</h3>;
          case "p":
            return (
              <p key={key}>
                {block.text}
                {block.link && (
                  <>
                    {" "}
                    <Link href={block.link.href} className="link">
                      {block.link.label}
                    </Link>
                    <span aria-hidden="true">&nbsp;→</span>
                  </>
                )}
              </p>
            );
          case "ul":
            return (
              <ul key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={key}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case "note":
            return (
              <aside key={key} className="rounded-card border border-sand/60 bg-sand-light/50 px-5 py-4 text-base">
                {block.title && <p className="font-semibold text-ink">{block.title}</p>}
                <p className="mt-1 text-ink/85">{block.text}</p>
              </aside>
            );
        }
      })}
    </div>
  );
}

export default async function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const toc = getTableOfContents(post.body);
  const related = getRelated(post);
  const categoryLabel = getCategoryLabel(post.category);
  const path = ROUTES.blogPost(post.slug);

  return (
    <>
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.description,
          path,
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          imagePath: post.image.src,
          section: categoryLabel,
          keywords: post.keywords,
          wordCount: countWords(post.body),
        })}
      />
      <article>
        <header className="border-b border-line bg-cream/60 pb-10 pt-10 sm:pt-14">
          <div className="container-x max-w-4xl">
            <Breadcrumbs
              items={[
                { name: "Blog", path: ROUTES.blog },
                { name: post.title, path },
              ]}
            />
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">{categoryLabel}</p>
            <h1 className="mt-3 text-3xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-4 text-sm text-muted">
              <time dateTime={post.publishedAt}>{formatDatePL(post.publishedAt)}</time>
              {post.updatedAt && (
                <>
                  {" "}
                  · aktualizacja <time dateTime={post.updatedAt}>{formatDatePL(post.updatedAt)}</time>
                </>
              )}{" "}
              · {post.readingMinutes} min czytania · {SITE.name}
            </p>
            <section aria-labelledby="w-skrocie" className="mt-8 rounded-card border border-line bg-surface p-6 shadow-soft">
              <h2 id="w-skrocie" className="text-base font-semibold text-ink">
                W skrócie
              </h2>
              <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-relaxed text-ink">
                {post.summary.map((point) => (
                  <li key={point} className="flex gap-3">
                    <CheckIcon className="mt-0.5 text-brand" />
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </header>

        <div className="container-x grid max-w-6xl gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
          <div className="min-w-0 max-w-3xl">
            <figure className="mb-10">
              <div className="relative aspect-[3/2] overflow-hidden rounded-card border border-line bg-cream">
                <Image
                  src={post.image.src}
                  alt={post.image.alt}
                  fill
                  sizes="(min-width: 1024px) 720px, 100vw"
                  className="object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
              <figcaption className="mt-2 text-xs text-muted">Ilustracja poglądowa.</figcaption>
            </figure>
            <ArticleBody blocks={post.body} />

            <section aria-labelledby="cta-artykul" className="mt-12 rounded-card bg-brand p-6 text-white shadow-lift sm:p-8">
              <h2 id="cta-artykul" className="text-2xl font-semibold leading-tight">
                Zobacz swoje mieszkanie umeblowane w {SITE.turnaroundHours} h
              </h2>
              <p className="mt-2 text-white/85">
                Wgraj zdjęcia pustych pomieszczeń, wybierz styl i zapłać BLIK-iem. Od {formatPLNShort(PRICE_BULK)} za
                zdjęcie, każde z oznaczeniem „wizualizacja”.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={ROUTES.order} className="btn-primary bg-white text-brand hover:bg-brand-light">
                  Zamów wizualizację
                </Link>
                <Link
                  href={ROUTES.freeSample}
                  className="btn-secondary border-white/40 bg-transparent text-white hover:bg-white/10"
                >
                  {formatPhotoCount(FREE_SAMPLE_PHOTOS)} gratis na próbę
                </Link>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Spis treści i skróty">
            <nav aria-labelledby="spis-tresci" className="rounded-card border border-line bg-surface p-5">
              <h2 id="spis-tresci" className="text-sm font-semibold uppercase tracking-[0.12em] text-sand-dark">
                Spis treści
              </h2>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a href={`#${entry.id}`} className="text-ink/80 hover:text-brand hover:underline">
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="mt-4 rounded-card border border-line bg-cream p-5 text-sm">
              <p className="font-semibold text-ink">Policz koszt i oszczędność</p>
              <p className="mt-1 text-muted">Kalkulator ceny brutto/netto i porównanie z fizycznym home stagingiem.</p>
              <Link href={`${ROUTES.pricing}#kalkulator`} className="link mt-3 inline-flex">
                Otwórz kalkulator
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="powiazane-title" className="border-t border-line bg-surface py-14 sm:py-16">
          <div className="container-x">
            <h2 id="powiazane-title" className="text-2xl font-semibold text-ink sm:text-3xl">
              Przeczytaj też
            </h2>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <article className="card relative flex h-full flex-col p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sand-dark">
                      {getCategoryLabel(item.category)}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">
                      <Link href={ROUTES.blogPost(item.slug)} className="after:absolute after:inset-0 hover:text-brand">
                        {item.title}
                      </Link>
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>
                    <p className="mt-4 text-xs text-muted">{item.readingMinutes} min czytania</p>
                  </article>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
